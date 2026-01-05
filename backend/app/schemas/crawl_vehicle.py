# app/schemas/crawl_vehicle.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class CrawlVehicleOut(BaseModel):
    car_id: str = Field(alias="source_car_id")
    title: Optional[str] = None
    tags: Optional[List[str]] = None

    # 🔥 关键修复点
    info: Optional[Dict[str, Any]] = None

    image_url: Optional[str] = None
    image_path: Optional[str] = None
    crawl_time: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True
