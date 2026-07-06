import pandas as pd
from fastapi import APIRouter

from app.schemas.predict import CarPredictIn
from app.train import load_model

router = APIRouter(tags=["predict"])


@router.post("/predict")
def predict_car_price(data: CarPredictIn):
    model = load_model()
    X = pd.DataFrame([data.model_dump()])
    breakdown = model.predict_breakdown(X)

    model_predictions = {
        name: round(values[0], 2) for name, values in breakdown["models"].items()
    }
    y_pred = round(float(breakdown["final"][0]), 2)

    return {
        "predicted_price": y_pred,
        "price_unit": "万",
        "model": "LightGBM + XGBoost + LinearRegression weighted ensemble",
        "weights": breakdown["weights"],
        "model_predictions": model_predictions,
    }
