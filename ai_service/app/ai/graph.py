from typing import Literal, TypedDict

from langgraph.graph import END, StateGraph

from app.providers.deepseek_client import deepseek_chat
from app.providers.kimi_client import kimi_chat
from app.providers.qwen_client import qwen_chat_messages

ProviderName = Literal["qwen", "kimi", "deepseek"]
IntentName = Literal["who_am_i", "system_help", "price_analysis", "chat"]


class ChatState(TypedDict):
    question: str
    username: str | None
    messages: list[dict[str, str]]
    provider: ProviderName
    intent: IntentName
    answer: str


def _route_provider(state: ChatState) -> ProviderName:
    provider = state.get("provider", "qwen")
    if provider not in {"qwen", "kimi", "deepseek"}:
        return "qwen"
    return provider


def _qwen_node(state: ChatState) -> ChatState:
    answer = qwen_chat_messages(state["messages"]) or ""
    return {**state, "answer": answer}


def _kimi_node(state: ChatState) -> ChatState:
    answer = kimi_chat(state["messages"]) or ""
    return {**state, "answer": answer}


def _deepseek_node(state: ChatState) -> ChatState:
    answer = deepseek_chat(state["messages"]) or ""
    return {**state, "answer": answer}


def _intent_node(state: ChatState) -> ChatState:
    q = (state.get("question") or "").strip()
    if any(k in q for k in ["我是谁", "我的身份", "我登录的是谁"]):
        intent: IntentName = "who_am_i"
    elif any(k in q for k in ["系统功能", "你能做什么", "这个系统能做什么", "帮助"]):
        intent = "system_help"
    elif any(k in q for k in ["价格分析", "预测价格", "贵不贵", "车价分析"]):
        intent = "price_analysis"
    else:
        intent = "chat"
    return {**state, "intent": intent}


def _who_am_i_node(state: ChatState) -> ChatState:
    username = state.get("username")
    answer = f"你当前登录的账户名是：{username}" if username else "我暂时不知道你的身份，请先登录。"
    return {**state, "answer": answer}


def _system_help_node(state: ChatState) -> ChatState:
    return {
        **state,
        "answer": (
            "这是一个完整的全栈车辆价格预测与分析系统，技术栈包括：\n\n"
            "React + FastAPI + MySQL + SQLAlchemy + Machine Learning + AI Agent。\n\n"
            "系统主要包含：\n"
            "- 后端 RESTful API：车辆信息 CRUD、用户系统、传统机器学习车辆价格预测\n"
            "- 独立 AI 服务：Kimi / Qwen / DeepSeek 多模型问答\n"
            "- RAG / MCP：文档检索增强与工具调用\n"
            "- 前端可视化与多页面业务功能"
        ),
    }


def _price_analysis_node(state: ChatState) -> ChatState:
    return {**state, "answer": "这里将接入车辆价格预测与分析逻辑（下一步实现）。"}


def _chat_node(state: ChatState) -> ChatState:
    provider = _route_provider(state)
    if provider == "qwen":
        return _qwen_node(state)
    if provider == "kimi":
        return _kimi_node(state)
    return _deepseek_node(state)


def _route_intent(state: ChatState) -> IntentName:
    intent = state.get("intent", "chat")
    if intent not in {"who_am_i", "system_help", "price_analysis", "chat"}:
        return "chat"
    return intent


graph = StateGraph(ChatState)
graph.add_node("intent", _intent_node)
graph.add_node("who_am_i", _who_am_i_node)
graph.add_node("system_help", _system_help_node)
graph.add_node("price_analysis", _price_analysis_node)
graph.add_node("chat", _chat_node)
graph.set_entry_point("intent")
graph.add_conditional_edges(
    "intent",
    _route_intent,
    {
        "who_am_i": "who_am_i",
        "system_help": "system_help",
        "price_analysis": "price_analysis",
        "chat": "chat",
    },
)
graph.add_edge("who_am_i", END)
graph.add_edge("system_help", END)
graph.add_edge("price_analysis", END)
graph.add_edge("chat", END)
chat_graph = graph.compile()


def run_chat_with_langgraph(
    messages: list[dict[str, str]],
    provider: str,
    question: str,
    username: str | None = None,
) -> str:
    state = chat_graph.invoke(
        {
            "question": question,
            "username": username,
            "messages": messages,
            "provider": provider,
            "intent": "chat",
            "answer": "",
        }
    )
    return state.get("answer", "")
