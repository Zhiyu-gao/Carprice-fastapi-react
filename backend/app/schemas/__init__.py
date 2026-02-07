# app/schemas/__init__.py

from .user import UserCreate, UserRead, UserOut, UserUpdate, PasswordUpdate
from .auth import (
    Token,
    TokenData,
    EmailCodeRequest,
    EmailCodeLoginRequest,
    EmailRegisterRequest,
    EmailPasswordResetRequest,
)

from .annotation import CarAnnotationCreate
from .crawl_vehicle import CrawlVehicleOut
from .predict import CarPredictIn

__all__ = [
    "UserCreate",
    "UserRead",
    "UserOut",
    "UserUpdate",
    "PasswordUpdate",
    "Token",
    "TokenData",
    "EmailCodeRequest",
    "EmailCodeLoginRequest",
    "EmailRegisterRequest",
    "EmailPasswordResetRequest",
    "CarAnnotationCreate",
    "CrawlVehicleOut",
    "CarPredictIn",
]
