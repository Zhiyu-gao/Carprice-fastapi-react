from pydantic import BaseModel

class VehicleCreate(BaseModel):
    area_sqm: float
    bedrooms: int
    age_years: int
    price: float

class VehicleOut(VehicleCreate):
    id: int

    class Config:
        orm_mode = True