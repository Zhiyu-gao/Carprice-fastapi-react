# ai_service/app/price_analysis_service.py
from typing import Dict, Any

from app.schemas import VehicleFeatures, AiProvider
from app.prompts.price_analysis import (
    SYSTEM_PROMPT,
    build_price_analysis_user_prompt,
)
from app.providers.kimi_client import kimi_chat
from app.providers.qwen_client import qwen_chat_messages
from app.providers.deepseek_client import deepseek_chat


def _call_provider(provider: AiProvider, messages: list[dict[str, str]]) -> str:
    if provider == AiProvider.kimi:
        return kimi_chat(messages)
    if provider == AiProvider.qwen:
        return qwen_chat_messages(messages)
    if provider == AiProvider.deepseek:
        return deepseek_chat(messages)
    raise ValueError(f"unsupported provider: {provider}")


def analyze_price_with_ai(
    provider: AiProvider,
    features: VehicleFeatures,
    predicted_price: float,
) -> str:
    """
    统一入口：给定 provider + 车辆特征 + 预测价格，返回 AI 分析结果（Markdown 文本）
    """
    features_dict: Dict[str, Any] = {
        "area_sqm": features.area_sqm,
        "bedrooms": features.bedrooms,
        "age_years": features.age_years,
    }

    user_prompt = build_price_analysis_user_prompt(
        features=features_dict,
        predicted_price=predicted_price,
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    content = _call_provider(provider, messages)
    return content.strip()
