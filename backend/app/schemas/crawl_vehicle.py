# app/schemas/crawl_vehicle.py
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class CrawlVehicleOut(BaseModel):
    car_id: str = Field(alias="source_car_id")
    title: Optional[str] = None
    tags: Optional[List[str]] = None

    # 🔥 关键修复点
    info: Optional[Dict[str, Any]] = None

    image_url: Optional[str] = None
    image_path: Optional[str] = None
    source_url: Optional[str] = None
    params_url: Optional[str] = None
    param_car_id: Optional[str] = None
    vehicle_params: Optional[Dict[str, Any]] = None
    raw_data: Optional[Dict[str, Any]] = None
    crawl_time: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class CrawlVehicleUpdate(BaseModel):
    title: Optional[str] = None
    tags: Optional[List[str]] = None
    info: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None
    image_path: Optional[str] = None
    source_url: Optional[str] = None
    params_url: Optional[str] = None
    param_car_id: Optional[str] = None
    vehicle_params: Optional[Dict[str, Any]] = None
