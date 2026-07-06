from fastapi import APIRouter, HTTPException, Query

from app.train import get_training_dataset, train_and_save

router = APIRouter(prefix="/model-training", tags=["model-training"])


@router.get("/status")
def get_model_training_status(
    limit: int = Query(50, ge=1, le=200, description="返回多少条训练数据预览"),
):
    return get_training_dataset(limit=limit)


@router.post("/train")
def train_price_model():
    try:
        model = train_and_save()
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "ok": True,
        "model": "LightGBM + XGBoost + LinearRegression weighted ensemble",
        "metadata": model.metadata,
    }
