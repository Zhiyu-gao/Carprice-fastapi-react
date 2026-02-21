from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app import models
from app.db import get_db
from app.routers.auth import get_current_user
from app.storage.local import save_avatar_local

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
def list_users(
    db: Session = Depends(get_db),
    _current=Depends(get_current_user),
):
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "role": u.role,
            "avatar_path": u.avatar_path,
        }
        for u in users
    ]


@router.get("/{user_id}")
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    _current=Depends(get_current_user),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_path": user.avatar_path,
        "created_at": user.created_at,
    }


@router.post("/me/avatar")
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="空文件")
    ext = (file.filename or "").split(".")[-1].lower() or "png"
    filename = f"user_{current_user.id}.{ext}"
    rel = save_avatar_local(data, filename)
    current_user.avatar_path = rel
    db.commit()
    return {"ok": True, "avatar_path": rel}
