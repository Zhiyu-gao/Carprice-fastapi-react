# ai_service/app/providers/kimi_client.py
from typing import List, Dict
from openai import OpenAI

from app.config import KIMI_CONFIG


def get_kimi_client() -> OpenAI:
    return OpenAI(
        base_url=KIMI_CONFIG.base_url,
        api_key=KIMI_CONFIG.api_key,
    )


def kimi_chat(messages: List[Dict[str, str]]) -> str:
    client = get_kimi_client()
    completion = client.chat.completions.create(
        model=KIMI_CONFIG.model,
        messages=messages,
    )
    return completion.choices[0].message.content or ""
