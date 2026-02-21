from collections.abc import Iterator

from openai import OpenAI

from app.config import QWEN_CONFIG

ChatMessage = dict[str, str]

_client = OpenAI(
    api_key=QWEN_CONFIG.api_key,
    base_url=QWEN_CONFIG.base_url,
)


def qwen_chat(prompt: str) -> str:
    completion = _client.chat.completions.create(
        model=QWEN_CONFIG.model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )
    return completion.choices[0].message.content or ""


def qwen_chat_messages(messages: list[ChatMessage]) -> str:
    if not isinstance(messages, list):
        raise TypeError("messages must be a list")
    for m in messages:
        if not isinstance(m, dict) or not isinstance(m.get("content"), str):
            raise TypeError("each message must be dict with string content")

    completion = _client.chat.completions.create(
        model=QWEN_CONFIG.model,
        messages=messages,
        temperature=0.7,
    )
    return completion.choices[0].message.content or ""


def qwen_chat_stream(prompt: str) -> Iterator[str]:
    stream = _client.chat.completions.create(
        model=QWEN_CONFIG.model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        stream=True,
    )
    for chunk in stream:
        if not chunk.choices:
            continue
        content = getattr(chunk.choices[0].delta, "content", None)
        if content:
            yield content


def qwen_chat_stream_messages(messages: list[ChatMessage]) -> Iterator[str]:
    stream = _client.chat.completions.create(
        model=QWEN_CONFIG.model,
        messages=messages,
        temperature=0.7,
        stream=True,
    )
    for chunk in stream:
        if not chunk.choices:
            continue
        content = getattr(chunk.choices[0].delta, "content", None)
        if content:
            yield content
