from dotenv import load_dotenv

# Load .env as early as possible for config-dependent imports.
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.chat import router as chat_router
from app.config import DEEPSEEK_CONFIG, KIMI_CONFIG, QWEN_CONFIG
from app.price_analysis_service import analyze_price_with_ai
from app.rag import router as rag_router
from app.schemas import PriceAnalysisRequest, PriceAnalysisResponse

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://47.83.219.94",
    "http://www.nrydawang.shop",
    "https://www.nrydawang.shop",
    "http://nrydawang.shop",
    "https://nrydawang.shop",
]

app = FastAPI(title="AI Vehicle Price Service")
Instrumentator().instrument(app).expose(app, endpoint="/metrics")
app.include_router(chat_router)
app.include_router(rag_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/ai/debug/config")
def debug_config() -> dict[str, dict[str, str | bool]]:
    return {
        "kimi": {
            "base_url": KIMI_CONFIG.base_url,
            "model": KIMI_CONFIG.model,
            "api_key_present": bool(KIMI_CONFIG.api_key),
        },
        "qwen": {
            "base_url": QWEN_CONFIG.base_url,
            "model": QWEN_CONFIG.model,
            "api_key_present": bool(QWEN_CONFIG.api_key),
        },
        "deepseek": {
            "base_url": DEEPSEEK_CONFIG.base_url,
            "model": DEEPSEEK_CONFIG.model,
            "api_key_present": bool(DEEPSEEK_CONFIG.api_key),
        },
    }


@app.post("/price-analysis", response_model=PriceAnalysisResponse)
def price_analysis(body: PriceAnalysisRequest) -> PriceAnalysisResponse:
    analysis = analyze_price_with_ai(
        provider=body.provider,
        features=body.features,
        predicted_price=body.predicted_price,
    )
    return PriceAnalysisResponse(
        provider=body.provider,
        predicted_price=body.predicted_price,
        analysis_markdown=analysis,
    )
