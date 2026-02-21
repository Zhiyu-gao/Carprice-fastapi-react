# app/schemas/car_annotation.py
from typing import Optional

from pydantic import BaseModel


class CarAnnotationCreate(BaseModel):
    source_car_id: str

    # 🔥 必填（你说了：先跑通）
    price_wan: float

    # 可选（后续慢慢加）
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    displacement: Optional[float] = None
    gearbox: Optional[str] = None
    transfer_count: Optional[int] = None
    city: Optional[str] = None
