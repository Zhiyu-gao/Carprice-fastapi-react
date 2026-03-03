from collections.abc import Iterator

from openai import OpenAI

from app.config import DEEPSEEK_CONFIG

ChatMessage = dict[str, str]

_client = OpenAI(
    base_url=DEEPSEEK_CONFIG.base_url,
    api_key=DEEPSEEK_CONFIG.api_key,
)


def deepseek_chat(messages: list[ChatMessage]) -> str:
    completion = _client.chat.completions.create(
        model=DEEPSEEK_CONFIG.model,
        messages=messages,
    )
    return completion.choices[0].message.content or ""


def deepseek_chat_stream_messages(messages: list[ChatMessage]) -> Iterator[str]:
    stream = _client.chat.completions.create(
        model=DEEPSEEK_CONFIG.model,
        messages=messages,
        stream=True,
    )
    for chunk in stream:
        if not chunk.choices:
            continue
        content = getattr(chunk.choices[0].delta, "content", None)
        if content:
            yield content
