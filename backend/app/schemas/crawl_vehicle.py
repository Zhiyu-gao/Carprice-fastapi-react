from pydantic import BaseModel

class CrawlVehicleOut(BaseModel):
    vehicle_id: str
    title: str
    area_sqm: float
    layout: str
    build_year: int
    total_price_wan: float
    unit_price: float
    district: str

    class Config:
        orm_mode = True