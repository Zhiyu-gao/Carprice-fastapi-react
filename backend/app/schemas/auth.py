from typing import Literal, Optional

from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[EmailStr] = None


class EmailCodeRequest(BaseModel):
    email: EmailStr


class EmailCodeLoginRequest(BaseModel):
    email: EmailStr
    code: str


class EmailRegisterRequest(BaseModel):
    email: EmailStr
    code: str
    username: str
    role: Literal["buyer", "seller"]
    full_name: Optional[str] = None
    password: str


class EmailPasswordResetRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str
