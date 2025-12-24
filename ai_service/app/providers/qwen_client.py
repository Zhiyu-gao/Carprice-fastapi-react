from openai import OpenAI
from app.config import QWEN_CONFIG
from typing import Iterator

client = OpenAI(
    api_key=QWEN_CONFIG.api_key,
    base_url=QWEN_CONFIG.base_url,
)


def qwen_chat(prompt: str) -> str:
    """
    非流式（保持不变）
    """
    completion = client.chat.completions.create(
        model=QWEN_CONFIG.model,
        messages=[{"role": "user", "content": prompt}],
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

