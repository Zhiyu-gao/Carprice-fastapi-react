from sqlalchemy.orm import Session
from app import models
from app.core.security import get_password_hash, verify_password


def update_profile(db: Session, *, user: models.User, email: str, full_name: str | None) -> models.User:
    user.email = email
    user.full_name = full_name
    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, *, user: models.User, old_password: str, new_password: str) -> bool:
    if not verify_password(old_password, user.hashed_password):
        return False
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    return True
