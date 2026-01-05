from pydantic import BaseModel

class CarPredictIn(BaseModel):
    brand: str
    age_years: float
    engine: float
    gearbox: str
    transfer_cnt: int
    price_new: float
