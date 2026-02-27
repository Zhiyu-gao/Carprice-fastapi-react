# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt  # 新增
from sqlalchemy.orm import Session

from app import models
from app.core.security import ALGORITHM, SECRET_KEY, get_password_hash
from app.db import get_db
from app.schemas import (
    EmailCodeLoginRequest,
    EmailCodeRequest,
    EmailPasswordResetRequest,
    EmailRegisterRequest,
    Token,
    UserRead,
)
from app.services.auth_service import authenticate_user, create_login_token
from app.services.auth_service import register_user as register_user_svc
from app.utils.aliyun_email import send_email_code
from app.utils.email_store import generate_and_store_code, verify_code

print("🔐 BACKEND SECRET_KEY =", SECRET_KEY)
router = APIRouter(prefix="/auth", tags=["auth"])

# 用于从 Authorization 头里抽 token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")  # 注意路径要跟登录接口对应


@router.post("/register", response_model=UserRead)
def register_user(user_in: EmailRegisterRequest, db: Session = Depends(get_db)):
    if not verify_code(user_in.email, user_in.code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="验证码错误或已过期")

    # 检查邮箱是否已存在
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="邮箱已注册")

    if user_in.username.strip().lower() == "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户名已被占用")

    if user_in.role == "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="管理员账号禁止注册")

    existing_name = db.query(models.User).filter(models.User.username == user_in.username).first()
    if existing_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户名已被占用")

    user = register_user_svc(
        db,
        email=user_in.email,
        username=user_in.username,
        role=user_in.role,
        full_name=user_in.full_name,
        password=user_in.password,
    )
    return user


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # OAuth2PasswordRequestForm 里 username 字段就当 email 用
    user = authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="邮箱或密码错误")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户已被禁用")

    access_token = create_login_token(user=user)

    return Token(access_token=access_token, token_type="bearer")


@router.post("/email/code")
def send_email_code_api(data: EmailCodeRequest):
    code = generate_and_store_code(str(data.email))
    send_email_code(str(data.email), code)
    return {"message": "验证码已发送，请查收邮箱"}


@router.post("/email/code-login", response_model=Token)
def email_code_login(
    data: EmailCodeLoginRequest,
    db: Session = Depends(get_db),
):
    if not verify_code(str(data.email), data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误或已过期",
        )

    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户不存在，请先注册",
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户已被禁用")

    access_token = create_login_token(user=user)
    return Token(access_token=access_token, token_type="bearer")


@router.post("/password/reset")
def reset_password_with_code(
    data: EmailPasswordResetRequest,
    db: Session = Depends(get_db),
):
    if not verify_code(str(data.email), data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误或已过期",
        )
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户不存在",
        )
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"ok": True}


# ------------ 依赖：通过 token 获取当前用户 ------------


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭证",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # 解码 JWT，拿到 payload
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exception
        user_id = int(sub)
    except JWTError, ValueError:
        # JWT 格式错误 / sub 不是数字
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户已被禁用",
        )

    return user


def get_current_admin(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限",
        )
    return current_user


# @router.post("/email/code")
# def send_email_code_api(data: EmailCodeRequest):
#     code = generate_and_store_code(data.email)
#     send_email_code(data.email, code)

#     # 统一返回，不暴露邮箱是否存在
#     return {"message": "验证码已发送，请查收邮箱"}

# @router.post("/email/code-login", response_model=Token)
# def email_code_login(
#     data: EmailCodeLoginRequest,
#     db: Session = Depends(get_db),
# ):
#     from app.utils.email_code import verify_code

#     if not verify_code(data.email, data.code):
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="验证码错误或已过期",
#         )

#     user = db.query(models.User).filter(models.User.email == data.email).first()

#     if not user:
#         # 自动注册（无密码）
#         user = models.User(
#             email=data.email,
#             full_name=None,
#             hashed_password=None,
#             is_active=True,
#         )
#         db.add(user)
#         db.commit()
#         db.refresh(user)

#     access_token = create_access_token(
#         data={"sub": str(user.id), "email": user.email},
#         expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
#     )

#     return Token(access_token=access_token, token_type="bearer")
