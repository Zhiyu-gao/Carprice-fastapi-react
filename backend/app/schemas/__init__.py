# app/schemas/__init__.py

from .annotation import CarAnnotationCreate
from .auth import (
    EmailCodeLoginRequest,
    EmailCodeRequest,
    EmailPasswordResetRequest,
    EmailRegisterRequest,
    Token,
    TokenData,
)
from .crawl_vehicle import CrawlVehicleOut
from .predict import CarPredictIn
from .user import PasswordUpdate, UserCreate, UserOut, UserRead, UserUpdate

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
