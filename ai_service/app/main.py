# ai_service/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()   # 👈 这一行是“生死线”
from app.schemas import PriceAnalysisRequest, PriceAnalysisResponse
from app.price_analysis_service import analyze_price_with_ai
from app.chat import router as chat_router
from app.rag import router as rag_router
from app.config import KIMI_CONFIG, QWEN_CONFIG, DEEPSEEK_CONFIG

app = FastAPI(title="AI Vehicle Price Service")# 允许前端访问（和你 backend 的 CORS 一样）
origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://47.83.219.94",
    "http://www.nrydawang.shop",
    "https://www.nrydawang.shop",
    "http://nrydawang.shop",
    "https://nrydawang.shop",
]


app.include_router(chat_router)
app.include_router(rag_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ai/debug/config")
def debug_config():
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
def price_analysis(body: PriceAnalysisRequest):
    """
    输入：
    - provider: kimi / qwen / deepseek
    - features: 房屋特征（面积/卧室/房龄/距离地铁）
    - predicted_price: 已经由 backend 预测好的价格

    输出：
    - provider
    - predicted_price
    - analysis_markdown: AI 生成的分析（Markdown 文本）
    """
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
