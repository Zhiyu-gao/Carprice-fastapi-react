from pydantic import BaseModel, EmailStr
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[EmailStr] = None

class EmailCodeRequest(BaseModel):
    email: str

class EmailCodeLoginRequest(BaseModel):
    email: str
    code: str
