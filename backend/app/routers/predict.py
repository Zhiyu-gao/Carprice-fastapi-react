from fastapi import APIRouter
from app.schemas import PredictRequest
from app.train import load_model
import numpy as np

router = APIRouter(tags=["predict"])

model = load_model()

@router.post("/predict")
def predict(req: PredictRequest):
    X = np.array([[req.area_sqm, req.bedrooms, req.age_years]])
    price = model.predict(X)[0]
    return {"predicted_price": float(price)}
