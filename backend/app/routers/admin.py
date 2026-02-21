from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models
from app.db import get_db
from app.routers.auth import get_current_admin
from app.services.admin_service import list_users as list_users_svc
from app.services.admin_service import metrics as metrics_svc
from app.services.admin_service import overview as overview_svc
from app.services.admin_service import set_user_active

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    items, total = list_users_svc(db, page=page, page_size=page_size)
    items_out = [
        {
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
        }
        for u in items
    ]
    return {"items": items_out, "page": page, "page_size": page_size, "total": total}


@router.post("/users/{user_id}/ban")
def ban_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="不能封禁管理员")
    set_user_active(db, user_id=user_id, active=0)
    return {"ok": True}


@router.post("/users/{user_id}/unban")
def unban_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    set_user_active(db, user_id=user_id, active=1)
    return {"ok": True}


@router.get("/overview")
def overview(
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    return overview_svc(db)


@router.get("/metrics")
def metrics(
    _admin=Depends(get_current_admin),
):
    return metrics_svc()
