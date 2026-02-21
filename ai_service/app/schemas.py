from enum import Enum

from pydantic import BaseModel


class VehicleFeatures(BaseModel):
    area_sqm: float
    bedrooms: int
    age_years: int


class AiProvider(str, Enum):
    kimi = "kimi"
    qwen = "qwen"
    deepseek = "deepseek"


class PriceAnalysisRequest(BaseModel):
    provider: AiProvider
    features: VehicleFeatures
    predicted_price: float   # 由 backend 算好，前端传进来


class PriceAnalysisResponse(BaseModel):
    provider: AiProvider
    predicted_price: float
    analysis_markdown: str

class ChatRequest(BaseModel):
    question: str
    provider: AiProvider = AiProvider.qwen
    session_id: str | None = None
    rag_enabled: bool = False
    mcp_enabled: bool = False


class ChatSessionCreate(BaseModel):
    title: str | None = None


class ChatSessionOut(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str


class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: str
