# ai_service/app/schemas.py
from enum import Enum
from pydantic import BaseModel


class HouseFeatures(BaseModel):
    area_sqm: float
    bedrooms: int
    age_years: int
    distance_to_metro_km: float


class AiProvider(str, Enum):
    kimi = "kimi"
    qwen = "qwen"
    deepseek = "deepseek"


class PriceAnalysisRequest(BaseModel):
    provider: AiProvider
    features: HouseFeatures
    predicted_price: float   # 由 backend 算好，前端传进来


class PriceAnalysisResponse(BaseModel):
    provider: AiProvider
    predicted_price: float
    analysis_markdown: str

class ChatRequest(BaseModel):
    question: str
    # history: list[dict] | None = None
