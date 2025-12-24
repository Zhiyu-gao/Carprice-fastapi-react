from pydantic import BaseModel

class HouseCreate(BaseModel):
    area_sqm: float
    bedrooms: int
    age_years: int
    price: float

class HouseOut(HouseCreate):
    id: int

    class Config:
        orm_mode = True
