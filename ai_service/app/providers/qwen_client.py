from openai import OpenAI
from app.config import QWEN_CONFIG
from typing import Iterator

client = OpenAI(
    api_key=QWEN_CONFIG.api_key,
    base_url=QWEN_CONFIG.base_url,
)


def qwen_chat(prompt: str) -> str:
    completion = client.chat.completions.create(
        model=QWEN_CONFIG.model,
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
    )
    return completion.choices[0].message.content

def qwen_chat_messages(messages: list[dict]) -> str:
    if not isinstance(messages, list):
        raise TypeError("messages must be list")

    for i, m in enumerate(messages):
        assert isinstance(m, dict)
        assert isinstance(m.get("content"), str)

    completion = client.chat.completions.create(
        model=QWEN_CONFIG.model,
        messages=messages,
        temperature=0.7,
    )
    return completion.choices[0].message.content

def qwen_chat_stream(prompt: str):
    stream = client.chat.completions.create(
        model=QWEN_CONFIG.model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        stream=True,
    )

    for chunk in stream:
        if not chunk.choices:
            continue

        delta = chunk.choices[0].delta

        # ✅ 关键在这里
        content = getattr(delta, "content", None)

        if content:
            yield content

