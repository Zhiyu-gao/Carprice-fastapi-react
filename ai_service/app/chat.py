import json
import logging
from collections.abc import Generator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.ai.graph import run_chat_with_langgraph
from app.mcp.tools import run_mcp_tools
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


def _sse(payload: dict[str, str]) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


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

    add_message(session_id, "user", req.question)
    touch_session(user_id, session_id)

    history = list_messages(user_id, session_id)
    messages: list[dict[str, str]] = []
    for item in history:
        role = "assistant" if item["role"] == "ai" else item["role"]
        messages.append({"role": role, "content": item["content"]})

    if req.mcp_enabled:
        mcp_context = run_mcp_tools(req.question)
        if mcp_context:
            messages.insert(0, {"role": "system", "content": f"[MCP]\n{mcp_context}"})

    if req.rag_enabled:
        chunks = retrieve(req.question, top_k=5)
        if chunks:
            context = "\n\n".join([f"来源: {c['filename']}\n{c['content']}" for c in chunks])
            messages.insert(0, {"role": "system", "content": RAG_SYSTEM_PROMPT})
            messages.insert(
                1, {"role": "system", "content": f"以下是可用资料，请优先基于它回答：\n\n{context}"}
            )

    provider = str(req.provider)

    def event_generator() -> Generator[str, None, None]:
        try:
            full_text = run_chat_with_langgraph(
                messages=messages,
                provider=provider,
                question=req.question,
                username=str(user.get("email") or ""),
            )
            yield _sse({"delta": full_text, "session_id": session_id})
            add_message(session_id, "assistant", full_text)
            touch_session(user_id, session_id)
            yield "data: [DONE]\n\n"
        except Exception as exc:
            logger.exception("chat_stream failed")
            yield _sse({"error": str(exc)})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
