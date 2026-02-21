from openai import OpenAI

from app.config import KIMI_CONFIG

ChatMessage = dict[str, str]


_client = OpenAI(
    base_url=KIMI_CONFIG.base_url,
    api_key=KIMI_CONFIG.api_key,
)


def kimi_chat(messages: list[ChatMessage]) -> str:
    completion = _client.chat.completions.create(
        model=KIMI_CONFIG.model,
        messages=messages,
    )
    return completion.choices[0].message.content or ""
