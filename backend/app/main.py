# app/main.py
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, annotations, crawl_vehicle, crawl_task, predict, vehicle, admin, train_car, forum, user_profile, chat, oss_files
from app.routers.auth import get_current_user
from app.schemas import UserOut, UserUpdate, PasswordUpdate
from app import models
from app.db import get_db
from sqlalchemy.orm import Session
from app.services.user_service import update_profile, change_password

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
app.include_router(crawl_task.router)
app.include_router(predict.router)
app.include_router(admin.router)
app.include_router(train_car.router)
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
        exists = (
            db.query(models.User)
            .filter(models.User.email == payload.email)
            .first()
        )
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
