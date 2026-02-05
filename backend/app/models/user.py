
from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from app.db import Base

from sqlalchemy import func

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(64), unique=True, index=True, nullable=False)
    role = Column(String(16), default="buyer", index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    avatar_path = Column(String(512), nullable=True)
    is_active = Column(Integer, default=1)  # 1 表示可用，0 表示禁用
    created_at = Column(DateTime(timezone=True), server_default=func.now())
