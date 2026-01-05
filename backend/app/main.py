# app/main.py
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, annotations, crawl_vehicle, predict, vehicle
from app.routers.auth import get_current_user
from app.schemas import UserOut
from app import models

app = FastAPI(title="Vehicle Price API")
from fastapi.staticfiles import StaticFiles
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

# 把 data 目录暴露成 /files
app.mount(
    "/files",
    StaticFiles(directory=DATA_DIR),
    name="files",
)

# ======================
# 路由注册
# ======================
app.include_router(auth.router)
app.include_router(annotations.router)
app.include_router(crawl_vehicle.router)
app.include_router(predict.router)
# app.include_router(vehicle.router)

# ======================
# CORS
# ======================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================
# 当前用户
# ======================
@app.get("/me", response_model=UserOut)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user
