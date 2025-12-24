# app/ai_service/providers/deepseek_client.py
from typing import List, Dict
from openai import OpenAI

from app.config import DEEPSEEK_CONFIG


def get_deepseek_client() -> OpenAI:
  return OpenAI(
    base_url=DEEPSEEK_CONFIG.base_url,
    api_key=DEEPSEEK_CONFIG.api_key,
  )


def deepseek_chat(messages: List[Dict[str, str]]) -> str:
  client = get_deepseek_client()
  completion = client.chat.completions.create(
    model=DEEPSEEK_CONFIG.model,
    messages=messages,
  )
  return completion.choices[0].message.content or ""
