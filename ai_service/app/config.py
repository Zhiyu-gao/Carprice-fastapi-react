# ai_service/app/config.py
import os
from dataclasses import dataclass


@dataclass
class ProviderConfig:
    base_url: str
    api_key: str
    model: str


def _get_env(name: str, default: str | None = None) -> str:
    value = os.environ.get(name, default)
    if value is None:
        raise RuntimeError(f"环境变量 {name} 未配置")
    return value


KIMI_CONFIG = ProviderConfig(
    base_url=_get_env("KIMI_BASE_URL", "https://api.kimi.example/v1"),  # TODO:换真实地址
    api_key=_get_env("KIMI_API_KEY", "dummy-kimi-key"),
    model=_get_env("KIMI_MODEL", "kimi-default-model"),
)

QWEN_CONFIG = ProviderConfig(
    base_url=_get_env("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
    api_key=_get_env("QWEN_API_KEY", "dummy-qwen-key"),
    model=_get_env("QWEN_MODEL", "qwen-plus"),
)

DEEPSEEK_CONFIG = ProviderConfig(
    base_url=_get_env("DEEPSEEK_BASE_URL", "https://api.deepseek.example/v1"),
    api_key=_get_env("DEEPSEEK_API_KEY", "dummy-deepseek-key"),
    model=_get_env("DEEPSEEK_MODEL", "deepseek-default-model"),
)

# ======================
# JWT 配置（必须和 backend 一致）
# ======================

SECRET_KEY = _get_env(
    "SECRET_KEY",
    "CHANGE_ME_PLEASE",  # 兜底，防止本地炸
)

ALGORITHM = _get_env(
    "ALGORITHM",
    "HS256",
)

