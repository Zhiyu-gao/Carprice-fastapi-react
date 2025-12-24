# app/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
# ===== 用户相关 =====
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    is_active: int

    class Config:
        from_attributes = True  # SQLAlchemy 2.x: 原来的 orm_mode=True

class UserOut(UserBase):
    id: int
    is_active: int
    created_at: datetime

    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    email: EmailStr
    full_name: str | None = None

class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str

# ===== JWT Token 相关 =====
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[EmailStr] = None

# ========== 爬虫 ==========
class CrawlHouseOut(BaseModel):
    house_id: str
    title: str
    area_sqm: float
    layout: str
    build_year: int
    total_price_wan: float
    unit_price: float
    district: str

    class Config:
        orm_mode = True


# ========== 标注 ==========
class AnnotationFeatures(BaseModel):
    area_sqm: float
    bedrooms: int
    age_years: int

class AnnotationLabel(BaseModel):
    price: float

class AnnotationCreate(BaseModel):
    source_house_id: str
    features: AnnotationFeatures
    label: AnnotationLabel


# ========== 训练 / 预测 ==========
class HouseCreate(BaseModel):
    area_sqm: float
    bedrooms: int
    age_years: int
    price: float


class HouseOut(HouseCreate):
    id: int

    class Config:
        orm_mode = True


class PredictRequest(BaseModel):
    area_sqm: float
    bedrooms: int
    age_years: int
