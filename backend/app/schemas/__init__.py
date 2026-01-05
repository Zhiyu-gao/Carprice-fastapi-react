# app/schemas/__init__.py

from .user import UserCreate, UserRead, UserOut, UserUpdate, PasswordUpdate
from .auth import Token, TokenData

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
    "CarAnnotationCreate",
    "CrawlVehicleOut",
    "CarPredictIn",
]
