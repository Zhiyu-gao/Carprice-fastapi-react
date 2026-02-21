import json
import sys
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from jose import jwt

# 支持 `python app/smoke_rag_langgraph.py` 直接运行
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.ai.graph import run_chat_with_langgraph
from app.config import ALGORITHM, SECRET_KEY
from app.main import app


def _token() -> str:
    payload = {"sub": "1", "email": "smoke@example.com"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _assert_langgraph_router() -> None:
    messages = [{"role": "user", "content": "hello"}]

    with (
        patch("app.ai.graph.qwen_chat_messages", return_value="qwen-ok"),
        patch("app.ai.graph.kimi_chat", return_value="kimi-ok"),
        patch("app.ai.graph.deepseek_chat", return_value="deepseek-ok"),
    ):
        assert run_chat_with_langgraph(messages, "qwen", question="你好") == "qwen-ok"
        assert run_chat_with_langgraph(messages, "kimi", question="hello") == "kimi-ok"
        assert run_chat_with_langgraph(messages, "deepseek", question="hey") == "deepseek-ok"


def _assert_rag_and_chat_flow() -> None:
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {_token()}"}
    fake_hits = [
        {
            "filename": "kb.txt",
            "content": "车辆A成交价约10万元",
            "score": 0.91,
        }
    ]

    def _fake_qwen(messages: list[dict[str, str]]) -> str:
        assert any("以下是可用资料" in m["content"] for m in messages if m["role"] == "system")
        return "基于RAG：车辆A成交价约10万元。"

    with (
        patch("app.rag.retrieve", return_value=fake_hits),
        patch("app.chat.retrieve", return_value=fake_hits),
        patch("app.ai.graph.qwen_chat_messages", side_effect=_fake_qwen),
    ):
        rag_resp = client.post("/ai/rag/search", json={"query": "车辆A价格"}, headers=headers)
        assert rag_resp.status_code == 200
        assert rag_resp.json() == fake_hits

        stream_resp = client.post(
            "/ai/chat/stream",
            json={
                "question": "车辆A多少钱？",
                "provider": "qwen",
                "rag_enabled": True,
                "mcp_enabled": False,
            },
            headers=headers,
        )
        assert stream_resp.status_code == 200

        deltas: list[str] = []
        for block in stream_resp.text.split("\n\n"):
            block = block.strip()
            if not block.startswith("data: {"):
                continue
            payload = json.loads(block[6:])
            if "delta" in payload:
                deltas.append(payload["delta"])

        assert deltas
        assert "RAG" in deltas[0]
        assert "data: [DONE]" in stream_resp.text


if __name__ == "__main__":
    _assert_langgraph_router()
    _assert_rag_and_chat_flow()
    print("OK: RAG + LangGraph smoke check passed")
