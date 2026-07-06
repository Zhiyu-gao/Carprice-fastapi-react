from app.prompts.price_analysis import SYSTEM_PROMPT, build_price_analysis_user_prompt
from app.providers.deepseek_client import deepseek_chat
from app.providers.kimi_client import kimi_chat
from app.providers.qwen_client import qwen_chat_messages
from app.schemas import AiProvider, VehicleFeatures


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
    """Return markdown analysis for the predicted vehicle price."""
    user_prompt = build_price_analysis_user_prompt(
        features={
            "brand": features.brand,
            "age_years": features.age_years,
            "engine": features.engine,
            "gearbox": features.gearbox,
            "transfer_cnt": features.transfer_cnt,
            "price_new": features.price_new,
        },
        predicted_price=predicted_price,
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]
    return _call_provider(provider, messages).strip()
