import json
import logging
from collections.abc import Generator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from openai import APIStatusError

from app.mcp.tools import run_mcp_tools
from app.providers.deepseek_client import deepseek_chat_stream_messages
from app.providers.kimi_client import kimi_chat_stream_messages
from app.providers.qwen_client import qwen_chat_stream_messages
from app.schemas import ChatRequest, ChatSessionCreate
from app.security.jwt import get_current_user_from_jwt
from app.storage.chat_db import (
    add_message,
    create_session,
    delete_session,
    get_session,
    list_messages,
    list_sessions,
    touch_session,
    update_session_title,
)
from app.storage.rag_store import retrieve

logger = logging.getLogger(__name__)
router = APIRouter()

RAG_SYSTEM_PROMPT = (
    "你正在执行基于用户上传资料的RAG问答。"
    "当资料中有明确答案时，必须直接回答该答案；"
    "不要泛化为法律或隐私说教，不要拒答。"
    "仅在资料中确实找不到答案时，才说明未找到。"
)


def _sse(payload: dict[str, object]) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _stream_from_provider(provider: str, messages: list[dict[str, str]]) -> Generator[str, None, None]:
    if provider == "qwen":
        yield from qwen_chat_stream_messages(messages)
        return
    if provider == "kimi":
        yield from kimi_chat_stream_messages(messages)
        return
    if provider == "deepseek":
        yield from deepseek_chat_stream_messages(messages)
        return
    raise ValueError(f"unsupported provider: {provider}")


def _normalize_provider(raw: object) -> str:
    # 兼容 Enum、"AiProvider.xxx" 和普通字符串
    if hasattr(raw, "value"):
        v = getattr(raw, "value")
        if isinstance(v, str):
            return v
    text = str(raw or "").strip()
    if text.startswith("AiProvider."):
        return text.split(".", 1)[1]
    return text


def _format_stream_error(exc: Exception, provider: str) -> str:
    if isinstance(exc, APIStatusError):
        body = getattr(exc, "body", None)
        status = getattr(exc, "status_code", None)
        details = ""
        if isinstance(body, dict):
            err = body.get("error")
            if isinstance(err, dict):
                details = str(err.get("message") or "")
        text = details or str(exc)
        if status == 402 or "Insufficient Balance" in text:
            return f"{provider} 余额不足（Insufficient Balance），请充值或切换到其他模型。"
        return f"{provider} 服务调用失败（HTTP {status or 'unknown'}）：{text}"
    return str(exc)


def _chunk_text(text: str, size: int = 80) -> Generator[str, None, None]:
    content = text or ""
    for i in range(0, len(content), size):
        yield content[i : i + size]


def _should_direct_reply_from_mcp(question: str, mcp_context: str, mcp_enabled: bool) -> bool:
    if not mcp_enabled or not (mcp_context or "").strip():
        return False
    q = (question or "").strip()
    if not q:
        return False
    # 与数据库查询强相关时，直接返回 MCP 结果，避免模型“猜测式拒答”
    return any(k in q for k in ["数据库", "二手车", "价格", "均价", "多少钱", "查库", "查询"])


def _rewrite_mcp_reply(question: str, mcp_context: str) -> str:
    q = (question or "").strip()
    ctx = (mcp_context or "").strip()
    if not ctx:
        return "未查到相关数据。"

    # 查询失败
    if "查询车辆失败" in ctx or "查询车辆价格失败" in ctx or "获取车辆详情失败" in ctx:
        return f"数据库查询失败，请稍后重试。错误信息：{ctx}"

    # 无结果类输出统一规范，不允许“查不了数据库”
    if "未找到" in ctx or "没有可解析" in ctx:
        return f"已查询数据库，未查到与“{q or '该条件'}”匹配的有效价格数据。\n{ctx}"

    return f"已查询数据库，结果如下：\n{ctx}"


def _summarize_title(question: str, max_len: int = 20) -> str:
    text = (question or "").replace("\n", " ").strip()
    if not text:
        return "新对话"
    return text[:max_len]


@router.get("/ai/chat/sessions")
def get_chat_sessions(user: dict[str, int | str | None] = Depends(get_current_user_from_jwt)):
    return list_sessions(str(user["user_id"]))


@router.post("/ai/chat/sessions")
def create_chat_session(
    body: ChatSessionCreate,
    user: dict[str, int | str | None] = Depends(get_current_user_from_jwt),
):
    title = (body.title or "新对话").strip() or "新对话"
    return create_session(str(user["user_id"]), title)


@router.get("/ai/chat/sessions/{session_id}/messages")
def get_chat_messages(
    session_id: str,
    user: dict[str, int | str | None] = Depends(get_current_user_from_jwt),
):
    rows = list_messages(str(user["user_id"]), session_id)
    for row in rows:
        if row.get("role") == "assistant":
            row["role"] = "ai"
    return rows


@router.delete("/ai/chat/sessions/{session_id}")
def delete_chat_session(
    session_id: str,
    user: dict[str, int | str | None] = Depends(get_current_user_from_jwt),
):
    delete_session(str(user["user_id"]), session_id)
    return {"ok": True}


@router.post("/ai/chat/stream")
def chat_stream(
    req: ChatRequest,
    user: dict[str, int | str | None] = Depends(get_current_user_from_jwt),
):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question required")

    user_id = str(user["user_id"])
    session_id = req.session_id

    if session_id:
        session = get_session(user_id, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="session not found")
    else:
        session = create_session(user_id, req.question[:20].strip() or "新对话")
        session_id = session["id"]

    existing_messages = list_messages(user_id, session_id)
    add_message(session_id, "user", req.question)

    # 如果是“新建”后第一条消息，自动把标题替换为首句摘要
    if session_id and session and session.get("title") == "新对话" and len(existing_messages) == 0:
        update_session_title(user_id, session_id, _summarize_title(req.question))

    touch_session(user_id, session_id)

    history = list_messages(user_id, session_id)
    messages: list[dict[str, str]] = []
    for item in history:
        role = "assistant" if item["role"] == "ai" else item["role"]
        messages.append({"role": role, "content": item["content"]})

    mcp_context = ""
    if req.mcp_enabled:
        mcp_context = run_mcp_tools(req.question)
        if mcp_context:
            messages.insert(0, {"role": "system", "content": f"[MCP]\n{mcp_context}"})

    # 统一输出格式：尽量纯文本，减少 markdown 星号/标题噪音
    messages.insert(
        0,
        {
            "role": "system",
            "content": "请使用简洁中文纯文本回答，不要使用 Markdown 标题、星号加粗、代码块或表格。",
        },
    )

    if req.rag_enabled:
        chunks = retrieve(req.question, top_k=5)
        if chunks:
            context = "\n\n".join([f"来源: {c['filename']}\n{c['content']}" for c in chunks])
            messages.insert(0, {"role": "system", "content": RAG_SYSTEM_PROMPT})
            messages.insert(
                1, {"role": "system", "content": f"以下是可用资料，请优先基于它回答：\n\n{context}"}
            )

    provider = _normalize_provider(req.provider)

    def event_generator() -> Generator[str, None, None]:
        try:
            if _should_direct_reply_from_mcp(req.question, mcp_context, req.mcp_enabled):
                full_text = _rewrite_mcp_reply(req.question, mcp_context)
                yield _sse(
                    {
                        "status": "queued",
                        "progress": 5,
                        "provider": "mcp",
                        "session_id": session_id,
                    }
                )
                chunks = list(_chunk_text(full_text, size=90))
                total = len(chunks) or 1
                for idx, chunk in enumerate(chunks, start=1):
                    progress = min(95, 10 + int(85 * idx / total))
                    yield _sse(
                        {
                            "delta": chunk,
                            "status": "streaming",
                            "progress": progress,
                            "provider": "mcp",
                            "session_id": session_id,
                        }
                    )
                add_message(session_id, "assistant", full_text)
                touch_session(user_id, session_id)
                yield _sse(
                    {
                        "status": "completed",
                        "progress": 100,
                        "provider": "mcp",
                        "session_id": session_id,
                    }
                )
                yield "data: [DONE]\n\n"
                return

            yield _sse(
                {
                    "status": "queued",
                    "progress": 5,
                    "provider": provider,
                    "session_id": session_id,
                }
            )

            full_text = ""
            last_progress = 10
            chunk_count = 0
            for chunk in _stream_from_provider(provider, messages):
                if not chunk:
                    continue
                full_text += chunk
                chunk_count += 1
                estimated = min(95, 12 + chunk_count * 2 + len(full_text) // 80)
                if estimated > last_progress:
                    last_progress = estimated
                yield _sse(
                    {
                        "delta": chunk,
                        "status": "streaming",
                        "progress": last_progress,
                        "provider": provider,
                        "session_id": session_id,
                    }
                )

            if not full_text.strip():
                raise RuntimeError("模型未返回有效内容")

            add_message(session_id, "assistant", full_text)
            touch_session(user_id, session_id)
            yield _sse(
                {
                    "status": "completed",
                    "progress": 100,
                    "provider": provider,
                    "session_id": session_id,
                }
            )
            yield "data: [DONE]\n\n"
        except Exception as exc:
            user_msg = _format_stream_error(exc, provider)
            logger.warning("chat_stream failed provider=%s err=%s", provider, user_msg)
            yield _sse({"error": user_msg, "status": "error", "session_id": session_id})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
