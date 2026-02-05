from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.db import get_db
from app.routers.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])


class MessageCreate(BaseModel):
    content: str


@router.get("/inbox")
def inbox(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    msgs = (
        db.query(models.DirectMessage)
        .filter(
            (models.DirectMessage.sender_id == current_user.id)
            | (models.DirectMessage.receiver_id == current_user.id)
        )
        .order_by(models.DirectMessage.created_at.desc())
        .all()
    )

    seen = set()
    items = []
    for m in msgs:
        other_id = m.receiver_id if m.sender_id == current_user.id else m.sender_id
        if other_id in seen:
            continue
        seen.add(other_id)
        user = db.query(models.User).filter(models.User.id == other_id).first()
        if not user:
            continue
        items.append(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "role": user.role,
                    "avatar_path": user.avatar_path,
                },
                "last_message": m.content,
                "last_time": m.created_at,
            }
        )
    return items


@router.get("/{user_id}")
def get_messages(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="用户不存在")

    msgs = (
        db.query(models.DirectMessage)
        .filter(
            ((models.DirectMessage.sender_id == current_user.id) & (models.DirectMessage.receiver_id == user_id))
            | ((models.DirectMessage.sender_id == user_id) & (models.DirectMessage.receiver_id == current_user.id))
        )
        .order_by(models.DirectMessage.created_at.asc())
        .all()
    )
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "content": m.content,
            "created_at": m.created_at,
        }
        for m in msgs
    ]


@router.post("/{user_id}")
def send_message(
    user_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="内容不能为空")
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="用户不存在")
    msg = models.DirectMessage(
        sender_id=current_user.id,
        receiver_id=user_id,
        content=content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"ok": True, "id": msg.id}
