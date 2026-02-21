from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.schemas import ChatRequest, ChatSessionCreate
from app.security.jwt import get_current_user_from_jwt
from app.storage.chat_db import (
    create_session,
    list_sessions,
    list_messages,
    add_message,
    touch_session,
    update_session_title,
    get_session,
    delete_session,
)
from app.storage.rag_store import retrieve
from app.mcp.tools import run_mcp_tools
import json

router = APIRouter()


@router.get("/ai/chat/sessions")
def get_chat_sessions(
    user=Depends(get_current_user_from_jwt),
):
    return list_sessions(str(user["user_id"]))


@router.post("/ai/chat/sessions")
def create_chat_session(
    body: ChatSessionCreate,
    user=Depends(get_current_user_from_jwt),
):
    title = (body.title or "新对话").strip() or "新对话"
    return create_session(str(user["user_id"]), title)


@router.get("/ai/chat/sessions/{session_id}/messages")
def get_chat_messages(
    session_id: str,
    user=Depends(get_current_user_from_jwt),
):
    rows = list_messages(str(user["user_id"]), session_id)
    # 前端仍然使用 ai 角色
    for r in rows:
        if r.get("role") == "assistant":
            r["role"] = "ai"
    return rows


@router.delete("/ai/chat/sessions/{session_id}")
def delete_chat_session(
    session_id: str,
    user=Depends(get_current_user_from_jwt),
):
    delete_session(str(user["user_id"]), session_id)
    return {"ok": True}

@router.post("/ai/chat/stream")
def chat_stream(
    req: ChatRequest,
    user=Depends(get_current_user_from_jwt),
):
    if not req.question:
        raise HTTPException(status_code=400, detail="question required")
    user_id = str(user["user_id"])
    session_id = req.session_id

    if session_id:
        session = get_session(user_id, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="session not found")
    else:
        # 自动创建新会话
        session = create_session(user_id, req.question[:20].strip() or "新对话")
        session_id = session["id"]

    # 保存用户消息
    add_message(session_id, "user", req.question)
    touch_session(user_id, session_id)

    # 构建历史消息
    history = list_messages(user_id, session_id)
    messages = []
    for m in history:
        role = m["role"]
        if role == "ai":
            role = "assistant"
        messages.append({"role": role, "content": m["content"]})

    # MCP / RAG
    if req.mcp_enabled:
        mcp_context = run_mcp_tools(req.question)
        if mcp_context:
            messages.insert(0, {"role": "system", "content": f"[MCP]\n{mcp_context}"})

    if req.rag_enabled:
        chunks = retrieve(req.question, top_k=5)
        if chunks:
            context = "\n\n".join(
                [f"来源: {c['filename']}\n{c['content']}" for c in chunks]
            )
            messages.insert(
                0,
                {
                    "role": "system",
                    "content": (
                        "你正在执行基于用户上传资料的RAG问答。"
                        "当资料中有明确答案时，必须直接回答该答案；"
                        "不要泛化为法律或隐私说教，不要拒答。"
                        "仅在资料中确实找不到答案时，才说明未找到。"
                    ),
                },
            )
            messages.insert(
                1,
                {
                    "role": "system",
                    "content": "以下是可用资料，请优先基于它回答：\n\n" + context,
                },
            )

    provider = req.provider

    def event_generator():
        try:
            full_text = ""
            if provider == "qwen":
                from app.providers.qwen_client import qwen_chat_stream_messages

                for token in qwen_chat_stream_messages(messages):
                    full_text += token
                    yield f"data: {json.dumps({'delta': token, 'session_id': session_id})}\n\n"
            elif provider == "kimi":
                from app.providers.kimi_client import kimi_chat
                full_text = kimi_chat(messages)
                yield f"data: {json.dumps({'delta': full_text, 'session_id': session_id})}\n\n"
            elif provider == "deepseek":
                from app.providers.deepseek_client import deepseek_chat
                full_text = deepseek_chat(messages)
                yield f"data: {json.dumps({'delta': full_text, 'session_id': session_id})}\n\n"
            else:
                raise ValueError(f"unknown provider: {provider}")

            add_message(session_id, "assistant", full_text)
            touch_session(user_id, session_id)
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
