from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.schemas import ChatRequest
from app.ai.graph import chat_graph
from app.security.jwt import get_current_user_from_jwt
import json

router = APIRouter()


@router.post("/ai/chat")
def chat(
    req: ChatRequest,
    user = Depends(get_current_user_from_jwt),
):
    result = chat_graph.invoke({
        "question": req.question,
        "username": user["email"],  # 或 user_id
    })

    return {"answer": result["answer"]}

@router.post("/ai/chat/stream")
def chat_stream(
    req: ChatRequest,
    user=Depends(get_current_user_from_jwt),
):
    if not req.question:
        raise HTTPException(status_code=400, detail="question required")

    # ✅ 第一步：用 LangGraph 判断意图（一次性）
    result = chat_graph.invoke({
        "question": req.question,
        "username": user["email"],
    })

    intent = result["intent"]

    # 非 chat 的，直接一次性返回（不用 stream）
    if intent != "chat":
        answer = result["answer"]

        def once():
            yield f"data: {json.dumps({'delta': answer})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(once(), media_type="text/event-stream")

    # ✅ 第二步：真正的流式 —— 直接用 Qwen
    def event_generator():
        print("🔥 SSE stream started")
        try:
            from app.providers.qwen_client import qwen_chat_stream

            for token in qwen_chat_stream(req.question):
                print("➡️ token:", repr(token))
                yield f"data: {json.dumps({'delta': token})}\n\n"

            print("✅ stream done")
            yield "data: [DONE]\n\n"

        except Exception as e:
            print("❌ stream error:", e)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
