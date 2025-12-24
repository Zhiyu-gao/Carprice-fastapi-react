# app/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from app.schemas import TokenData
import os

SECRET_KEY = os.environ.get("SECRET_KEY")
ALGORITHM = os.environ.get("ALGORITHM", "HS256")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY not set")


ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 天

# app/core/security.py
import bcrypt

def get_password_hash(password: str) -> str:
    # bcrypt 要求 bytes
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    # 存到数据库里用 str
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[int] = payload.get("sub")
        email: Optional[str] = payload.get("email")
        if user_id is None and email is None:
            return None
        return TokenData(user_id=int(user_id) if user_id else None, email=email)
    except JWTError:
        return None
