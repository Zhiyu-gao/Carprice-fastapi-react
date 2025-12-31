from pydantic import BaseModel

class VehicleCreate(BaseModel):
    area_sqm: float
    bedrooms: int
    age_years: int
    price: float

class VehicleUpdate(BaseModel):
    area_sqm: float | None = None
    bedrooms: int | None = None
    age_years: int | None = None
    price: float | None = None

class VehicleOut(VehicleCreate):
    id: int

    class Config:
        orm_mode = True