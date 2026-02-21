import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.config import ALGORITHM, SECRET_KEY

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
logger = logging.getLogger(__name__)


def get_current_user_from_jwt(token: str = Depends(oauth2_scheme)) -> dict[str, int | str | None]:
    """Decode backend JWT and return user identity payload."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭证",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        email = payload.get("email")
        if user_id is None:
            raise credentials_exception
        return {
            "user_id": int(user_id),
            "email": email,
        }
    except (JWTError, ValueError):
        logger.warning("JWT decode failed")
        raise credentials_exception
