import pandas as pd
from fastapi import APIRouter
from app.schemas.predict import CarPredictIn
from app.train import load_model

router = APIRouter(tags=["predict"])

@router.post("/predict")
def predict_car_price(data: CarPredictIn):
    model = load_model()
    X = pd.DataFrame([data.dict()])
    y_pred = float(model.predict(X)[0])
    return {"predicted_price": round(y_pred, 2), "price_unit": "万"}
