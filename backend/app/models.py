# app/models.py
from sqlalchemy import Column, Integer, Float, String, DateTime, JSON,func
from .db import Base
from datetime import datetime
# 爬虫车辆（原始数据）

class CrawlVehicle(Base):
    __tablename__ = "crawl_vehicles"

    id = Column(Integer, primary_key=True, index=True)

    # 核心标识
    vehicle_id = Column(String(32), unique=True, index=True, nullable=False)

    title = Column(String(255))
    detail_url = Column(String(512))

    community_name = Column(String(255))
    community_url = Column(String(512))

    district = Column(String(64))
    layout = Column(String(32))
    orientation = Column(String(32))
    decoration = Column(String(32))
    floor = Column(String(64))
    building_type = Column(String(32))

    area_sqm = Column(Float)
    build_year = Column(Integer)

    total_price_wan = Column(Float)
    total_price_yuan = Column(Integer)
    unit_price = Column(Integer)

    follow_count = Column(Integer)

    tags = Column(JSON)              # MySQL 5.7+ 支持 JSON
    cover_image = Column(String(512))

    crawl_time = Column(DateTime, default=datetime.utcnow)

    # 是否已被标注进训练集（非常重要）
    is_annotated = Column(Integer, default=0)  # 0 = 未标注，1 = 已标注


# 训练用车辆（干净样本）
class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)

    # 🔥 关键字段：用于和爬虫车辆关联
    source_vehicle_id = Column(String(64), unique=True, index=True)

    area_sqm = Column(Float, nullable=False)
    bedrooms = Column(Integer, nullable=False)
    age_years = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Integer, default=1)  # 1 表示可用，0 表示禁用
    created_at = Column(DateTime(timezone=True), server_default=func.now())