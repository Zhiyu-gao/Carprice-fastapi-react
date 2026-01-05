# app/models/car.py
from sqlalchemy import Column, Integer, Float, String
from app.db import Base

class Car(Base):
    __tablename__ = "cars"

    id = Column(Integer, primary_key=True, index=True)

    # 和 CrawlCar 关联
    source_car_id = Column(String(32), unique=True, index=True)

    brand = Column(String(64), nullable=False)
    model = Column(String(128), nullable=False)

    year = Column(Integer, nullable=False)          # 上牌年
    mileage_km = Column(Float)                      # 行驶里程（后续可加）
    displacement = Column(Float)                    # 排量（3.6）
    gearbox = Column(String(32))                    # 自动 / 手动

    transfer_count = Column(Integer)                # 过户次数
    city = Column(String(64))                       # 车源地

    price_wan = Column(Float, nullable=False)
