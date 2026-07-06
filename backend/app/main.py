# app/main.py
from dotenv import load_dotenv

load_dotenv()

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy.orm import Session

from app import models
from app.db import get_db
from app.routers import (
    admin,
    annotations,
    auth,
    buyer,
    chat,
    crawl_task,
    crawl_vehicle,
    forum,
    oss_files,
    predict,
    train_car,
    user_profile,
)
from app.routers.auth import get_current_user
from app.schemas import PasswordUpdate, UserOut, UserUpdate
from app.services.user_service import change_password, update_profile

app = FastAPI(title="Vehicle Price API")
Instrumentator().instrument(app).expose(app, endpoint="/metrics")
import os
from pathlib import Path

from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
PROJECT_DIR = BASE_DIR.parent

# StaticFiles 要求目录在挂载时就存在，本地首次启动时自动补齐。
DATA_DIR.mkdir(parents=True, exist_ok=True)

# 把 data 目录暴露成 /files
app.mount(
    "/files",
    StaticFiles(directory=DATA_DIR),
    name="files",
)


@app.get("/public/preview/video")
def preview_video():
    candidates = []

    configured_path = os.getenv("PREVIEW_VIDEO_PATH")
    if configured_path:
        candidates.append(Path(configured_path).expanduser())

    candidates.extend(
        [
            BASE_DIR / "remotion" / "out" / "video.mp4",
            PROJECT_DIR / "remotion" / "out" / "video.mp4",
            Path("/root/Carprice-fastapi-react/remotion/out/video.mp4"),
        ]
    )

    video_path = next((path for path in candidates if path.exists()), None)
    if video_path is None:
        raise HTTPException(status_code=404, detail="预览视频不存在")
    return FileResponse(video_path, media_type="video/mp4")


# ======================
# 路由注册
# ======================
app.include_router(auth.router)
app.include_router(annotations.router)
app.include_router(crawl_vehicle.router)
app.include_router(crawl_task.router)
app.include_router(predict.router)
app.include_router(admin.router)
app.include_router(train_car.router)
app.include_router(buyer.router)
app.include_router(forum.router)
app.include_router(user_profile.router)
app.include_router(chat.router)
app.include_router(oss_files.router)
# app.include_router(vehicle.router)

# ======================
# CORS
# ======================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nrydawang.shop",
        "https://www.nrydawang.shop",
        "http://nrydawang.shop",
        "http://www.nrydawang.shop",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:19006",
        "http://127.0.0.1:19006",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_origin_regex=(
        r"^https?://("
        r"localhost|127\.0\.0\.1|"
        r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
        r"192\.168\.\d{1,3}\.\d{1,3}|"
        r"172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}"
        r")(:\d+)?$"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================
# 当前用户
# ======================
@app.get("/me", response_model=UserOut)
def read_me(current_user: models.User = Depends(get_current_user)):
    # 兼容旧数据：若 username 为空，自动回填并避免 500
    if not current_user.username:
        fallback = current_user.email.split("@")[0] if current_user.email else "user"
        current_user.username = fallback
    if not current_user.role:
        current_user.role = "buyer"
    return current_user


@app.put("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if payload.email != current_user.email:
        exists = db.query(models.User).filter(models.User.email == payload.email).first()
        if exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被占用",
            )
    return update_profile(
        db,
        user=current_user,
        email=payload.email,
        full_name=payload.full_name,
    )


@app.put("/me/password")
def update_password(
    payload: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ok = change_password(
        db,
        user=current_user,
        old_password=payload.old_password,
        new_password=payload.new_password,
    )
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="原密码错误",
        )
    return {"ok": True}
