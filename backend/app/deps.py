# app/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")  # 登录接口地址


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    from app.schemas import TokenData  # 防循环引用，如有需要

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭证",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token_data: TokenData | None = decode_access_token(token)
    if not token_data or token_data.user_id is None:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
    if user is None or user.is_active != 1:
        raise credentials_exception
    return user
