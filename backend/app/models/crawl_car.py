# app/models/crawl_car.py
from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from app.db import Base

class CrawlCar(Base):
    __tablename__ = "crawl_cars"

    id = Column(Integer, primary_key=True, index=True)

    # 唯一来源 ID（懂车帝）
    source_car_id = Column(String(32), unique=True, index=True, nullable=False)

    title = Column(String(255))
    source_url = Column(String(512))

    image_url = Column(String(512))    # 原始图片 URL
    image_path = Column(String(512))   # 本地 / Blob 路径

    tags = Column(JSON)
    info = Column(JSON)

    page_no = Column(Integer)
    crawl_time = Column(DateTime, default=datetime.utcnow)

    is_annotated = Column(Integer, default=0)
