# app/schemas/car_annotation.py
from typing import Optional

from pydantic import BaseModel


class CarAnnotationCreate(BaseModel):
    source_car_id: str

    price_wan: float

    brand: Optional[str] = None
    brand_confidence: Optional[float] = None
    brand_source: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    mileage_km: Optional[float] = None
    displacement: Optional[float] = None
    gearbox: Optional[str] = None
    transfer_count: Optional[int] = None
    city: Optional[str] = None
