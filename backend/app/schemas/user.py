from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    is_active: int

    model_config = {"from_attributes": True}

class UserOut(UserBase):
    id: int
    is_active: int
    created_at: datetime

    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    email: EmailStr
    full_name: str | None = None

class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str
