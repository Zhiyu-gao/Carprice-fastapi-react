# app/routers/auth.py
import json
import os
import secrets
from urllib.parse import urlencode
from urllib.request import urlopen

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
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

router = APIRouter(prefix="/auth", tags=["auth"])

# 用于从 Authorization 头里抽 token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")  # 注意路径要跟登录接口对应

WECHAT_APP_ID = os.getenv("WECHAT_APP_ID", "").strip()
WECHAT_APP_SECRET = os.getenv("WECHAT_APP_SECRET", "").strip()
WECHAT_REDIRECT_URI = os.getenv("WECHAT_REDIRECT_URI", "").strip()
WECHAT_FRONTEND_REDIRECT = os.getenv(
    "WECHAT_FRONTEND_REDIRECT", "http://localhost:5173/login"
).strip()
WECHAT_PROVIDER = "wechat"


def _http_get_json(url: str) -> dict:
    try:
        with urlopen(url, timeout=12) as resp:
            body = resp.read().decode("utf-8")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"微信服务请求失败: {exc}",
        ) from exc
    try:
        return json.loads(body)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="微信服务返回解析失败",
        ) from exc


def _make_unique_username(db: Session, preferred: str) -> str:
    base = (preferred or "wechat_user").strip()[:24] or "wechat_user"
    for i in range(100):
        candidate = base if i == 0 else f"{base}_{i}"
        exists = db.query(models.User).filter(models.User.username == candidate).first()
        if not exists:
            return candidate
    return f"wechat_{secrets.token_hex(6)}"


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
    # OAuth2PasswordRequestForm 的 username 字段承载“账号”（邮箱或用户名）
    user = authenticate_user(db, identifier=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="账号或密码错误")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户已被禁用")

    access_token = create_login_token(user=user)

    return Token(access_token=access_token, token_type="bearer")


@router.get("/wechat/url")
def get_wechat_login_url(state: str = Query(default="")):
    if not WECHAT_APP_ID or not WECHAT_REDIRECT_URI:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="微信登录未配置，请设置 WECHAT_APP_ID 和 WECHAT_REDIRECT_URI",
        )
    wx_state = (state or secrets.token_urlsafe(16))[:64]
    query = urlencode(
        {
            "appid": WECHAT_APP_ID,
            "redirect_uri": WECHAT_REDIRECT_URI,
            "response_type": "code",
            "scope": "snsapi_login",
            "state": wx_state,
        }
    )
    authorize_url = f"https://open.weixin.qq.com/connect/qrconnect?{query}#wechat_redirect"
    return {"authorize_url": authorize_url, "state": wx_state}


@router.get("/wechat/callback")
def wechat_callback(
    code: str,
    state: str = "",
    db: Session = Depends(get_db),
):
    if not WECHAT_APP_ID or not WECHAT_APP_SECRET or not WECHAT_REDIRECT_URI:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="微信登录未配置，请设置 WECHAT_APP_ID/WECHAT_APP_SECRET/WECHAT_REDIRECT_URI",
        )

    token_url = (
        "https://api.weixin.qq.com/sns/oauth2/access_token?"
        + urlencode(
            {
                "appid": WECHAT_APP_ID,
                "secret": WECHAT_APP_SECRET,
                "code": code,
                "grant_type": "authorization_code",
            }
        )
    )
    token_payload = _http_get_json(token_url)
    if token_payload.get("errcode"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"微信授权失败: {token_payload.get('errmsg', 'unknown error')}",
        )

    access_token = str(token_payload.get("access_token") or "")
    openid = str(token_payload.get("openid") or "")
    unionid = str(token_payload.get("unionid") or "")
    if not access_token or not openid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="微信授权结果缺失")

    userinfo_url = (
        "https://api.weixin.qq.com/sns/userinfo?"
        + urlencode(
            {
                "access_token": access_token,
                "openid": openid,
                "lang": "zh_CN",
            }
        )
    )
    userinfo = _http_get_json(userinfo_url)
    if userinfo.get("errcode"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"微信用户信息获取失败: {userinfo.get('errmsg', 'unknown error')}",
        )

    nickname = str(userinfo.get("nickname") or "微信用户").strip()
    wx_email = f"wx_{(unionid or openid).lower()}@wechat.local"

    # 兜底自动建表，避免环境未执行 migration 时无法绑定账号
    models.OAuthAccount.__table__.create(bind=db.get_bind(), checkfirst=True)

    oauth_query = db.query(models.OAuthAccount).filter(
        models.OAuthAccount.provider == WECHAT_PROVIDER
    )
    if unionid:
        oauth_query = oauth_query.filter(
            (models.OAuthAccount.openid == openid) | (models.OAuthAccount.unionid == unionid)
        )
    else:
        oauth_query = oauth_query.filter(models.OAuthAccount.openid == openid)
    oauth = oauth_query.first()

    user = None
    if oauth:
        user = db.query(models.User).filter(models.User.id == oauth.user_id).first()

    # 账号绑定逻辑：
    # 1) 先尝试复用“同一微信标识”历史绑定账号
    # 2) 无绑定则尝试复用 wechat 占位邮箱账号
    # 3) 都不存在则创建新账号并写入 oauth_accounts 绑定
    if not user:
        user = db.query(models.User).filter(models.User.email == wx_email).first()
        if not user:
            username = _make_unique_username(db, f"wx_{(unionid or openid)[:10]}")
            user = models.User(
                email=wx_email,
                username=username,
                role="buyer",
                full_name=nickname,
                hashed_password=get_password_hash(secrets.token_urlsafe(24)),
                is_active=1,
            )
            db.add(user)
            db.flush()

        if not oauth:
            oauth = models.OAuthAccount(
                provider=WECHAT_PROVIDER,
                openid=openid,
                unionid=unionid or None,
                user_id=user.id,
            )
            db.add(oauth)
        else:
            oauth.user_id = user.id
            oauth.unionid = unionid or oauth.unionid

        db.commit()
        db.refresh(user)

    jwt_token = create_login_token(user=user)

    redirect_query = urlencode(
        {
            "token": jwt_token,
            "login": "wechat",
            "state": state or "",
        }
    )
    return RedirectResponse(url=f"{WECHAT_FRONTEND_REDIRECT}?{redirect_query}", status_code=302)


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
