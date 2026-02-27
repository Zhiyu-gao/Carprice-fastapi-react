from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.db import get_db
from app.routers.auth import get_current_user

router = APIRouter(prefix="/forum", tags=["forum"])


class PostCreate(BaseModel):
    content: str


class CommentCreate(BaseModel):
    content: str


@router.get("/posts")
def list_posts(db: Session = Depends(get_db)):
    posts = db.query(models.ForumPost).order_by(models.ForumPost.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "content": p.content,
            "created_at": p.created_at,
            "user": {
                "id": p.user.id,
                "username": p.user.username,
                "role": p.user.role,
                "avatar_path": p.user.avatar_path,
            },
        }
        for p in posts
    ]


@router.post("/posts")
def create_post(
    payload: PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="内容不能为空")
    post = models.ForumPost(user_id=current_user.id, content=content)
    db.add(post)
    db.commit()
    db.refresh(post)
    return {"ok": True, "id": post.id}


@router.get("/posts/{post_id}/comments")
def list_comments(post_id: int, db: Session = Depends(get_db)):
    comments = (
        db.query(models.ForumComment)
        .filter(models.ForumComment.post_id == post_id)
        .order_by(models.ForumComment.created_at.asc())
        .all()
    )
    return [
        {
            "id": c.id,
            "post_id": c.post_id,
            "content": c.content,
            "created_at": c.created_at,
            "user": {
                "id": c.user.id,
                "username": c.user.username,
                "role": c.user.role,
                "avatar_path": c.user.avatar_path,
            },
        }
        for c in comments
    ]


@router.post("/posts/{post_id}/comments")
def create_comment(
    post_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="内容不能为空")
    exists = db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first()
    if not exists:
        raise HTTPException(status_code=404, detail="帖子不存在")
    comment = models.ForumComment(post_id=post_id, user_id=current_user.id, content=content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return {"ok": True, "id": comment.id}
