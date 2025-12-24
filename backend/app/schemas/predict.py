from pydantic import BaseModel

class PredictRequest(BaseModel):
    area_sqm: float
    bedrooms: int
    age_years: int
