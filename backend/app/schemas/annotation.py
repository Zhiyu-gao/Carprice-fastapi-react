from pydantic import BaseModel

class AnnotationFeatures(BaseModel):
    area_sqm: float
    bedrooms: int
    age_years: int

class AnnotationLabel(BaseModel):
    price: float

class AnnotationCreate(BaseModel):
    source_vehicle_id: str
    features: AnnotationFeatures
    label: AnnotationLabel
