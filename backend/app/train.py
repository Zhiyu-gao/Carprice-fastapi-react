import re
import sys
import warnings
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from lightgbm import LGBMRegressor
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sqlalchemy.orm import Session
from xgboost import XGBRegressor

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app import models
from app.db import SessionLocal

MODEL_PATH = BACKEND_ROOT / "car_price_model.pkl"

FEATURE_COLUMNS = ["brand", "age_years", "engine", "gearbox", "transfer_cnt", "price_new"]
NUM_COLS = ["age_years", "engine", "transfer_cnt", "price_new"]
CAT_COLS = ["brand", "gearbox"]
MODEL_WEIGHTS = {"lightgbm": 0.45, "xgboost": 0.45, "linear": 0.10}
MIN_TRAINING_SAMPLES = 2


def parse_float(val):
    if val is None:
        return None
    m = re.search(r"([\d.]+)", str(val))
    return float(m.group(1)) if m else None


def parse_transfer_count(val):
    # "1次" -> 1
    if val is None:
        return 0
    m = re.search(r"(\d+)", str(val))
    return int(m.group(1)) if m else 0


def parse_age_years_from_plate(val):
    # "2023年11月" -> 车龄（年）
    if not val:
        return None
    m = re.search(r"(\d{4})年", str(val))
    if not m:
        return None
    year = int(m.group(1))
    return max(datetime.now().year - year, 0)


def age_years_from_year(year: int | None):
    if not year:
        return None
    return max(datetime.now().year - int(year), 0)


def build_row(c: models.CrawlCar):
    info = c.info or {}

    brand = str(info.get("品牌") or "").strip()
    if not brand or brand == "未知":
        brand = c.title.split()[0] if c.title else "未知"

    age_years = parse_age_years_from_plate(info.get("上牌时间"))
    engine = parse_float(info.get("排量"))  # "2.0T" -> 2.0
    gearbox = info.get("变速箱", "未知")  # "自动"
    transfer_cnt = parse_transfer_count(info.get("过户次数"))

    price_new = parse_float(info.get("新车指导价"))
    price_used = parse_float(info.get("当前售价"))

    return {
        "source_car_id": c.source_car_id,
        "title": c.title,
        "brand": brand,
        "age_years": age_years,
        "engine": engine,
        "gearbox": gearbox,
        "transfer_cnt": transfer_cnt,
        "price_new": price_new,
        "y": price_used,
    }


def build_annotation_row(train_car: models.TrainCar, crawl_car: models.CrawlCar | None):
    info = crawl_car.info if crawl_car and isinstance(crawl_car.info, dict) else {}

    brand = (train_car.brand or info.get("品牌") or "未知").strip()
    title = crawl_car.title if crawl_car else train_car.model
    age_years = age_years_from_year(train_car.year) or parse_age_years_from_plate(
        info.get("上牌时间")
    )
    engine = train_car.displacement or parse_float(info.get("排量"))
    gearbox = train_car.gearbox or info.get("变速箱") or "未知"
    transfer_cnt = (
        train_car.transfer_count
        if train_car.transfer_count is not None
        else parse_transfer_count(info.get("过户次数"))
    )
    price_new = parse_float(info.get("新车指导价"))
    price_used = train_car.price_wan

    return {
        "source_car_id": train_car.source_car_id,
        "title": title,
        "brand": brand or "未知",
        "model": train_car.model,
        "age_years": age_years,
        "engine": engine,
        "gearbox": gearbox,
        "transfer_cnt": transfer_cnt,
        "price_new": price_new,
        "y": price_used,
    }


def missing_training_fields(row: dict[str, Any]):
    required = ["age_years", "engine", "price_new", "y"]
    return [field_name for field_name in required if row.get(field_name) is None]


def build_preprocessor(*, scale_numeric: bool = False):
    num_transformer = StandardScaler() if scale_numeric else "passthrough"
    return ColumnTransformer(
        [
            ("num", num_transformer, NUM_COLS),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CAT_COLS),
        ]
    )


def make_linear_model():
    return Pipeline(
        [
            ("preprocess", build_preprocessor(scale_numeric=True)),
            ("reg", LinearRegression()),
        ]
    )


def make_lightgbm_model():
    return Pipeline(
        [
            ("preprocess", build_preprocessor()),
            (
                "reg",
                LGBMRegressor(
                    n_estimators=220,
                    learning_rate=0.05,
                    num_leaves=15,
                    min_child_samples=3,
                    subsample=0.9,
                    colsample_bytree=0.9,
                    random_state=42,
                    verbosity=-1,
                ),
            ),
        ]
    )


def make_xgboost_model():
    return Pipeline(
        [
            ("preprocess", build_preprocessor()),
            (
                "reg",
                XGBRegressor(
                    n_estimators=220,
                    learning_rate=0.05,
                    max_depth=4,
                    subsample=0.9,
                    colsample_bytree=0.9,
                    objective="reg:squarederror",
                    random_state=42,
                    n_jobs=1,
                ),
            ),
        ]
    )


@dataclass
class EnsemblePriceModel:
    weights: dict[str, float] = field(default_factory=lambda: MODEL_WEIGHTS.copy())
    feature_columns: list[str] = field(default_factory=lambda: FEATURE_COLUMNS.copy())
    models: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        if not self.models:
            self.models = {
                "lightgbm": make_lightgbm_model(),
                "xgboost": make_xgboost_model(),
                "linear": make_linear_model(),
            }

    def fit(self, X: pd.DataFrame, y: pd.Series):
        X = self._prepare_features(X)
        for model in self.models.values():
            model.fit(X, y)
        return self

    def predict(self, X: pd.DataFrame):
        breakdown = self.predict_breakdown(X)
        return np.array(breakdown["final"])

    def predict_breakdown(self, X: pd.DataFrame):
        X = self._prepare_features(X)
        model_predictions: dict[str, list[float]] = {}
        for name, model in self.models.items():
            with warnings.catch_warnings():
                warnings.filterwarnings(
                    "ignore",
                    message="X does not have valid feature names.*",
                    category=UserWarning,
                )
                raw_pred = model.predict(X)
            model_predictions[name] = [max(float(value), 0.0) for value in raw_pred]

        sample_count = len(X)
        final = []
        for row_idx in range(sample_count):
            value = sum(
                model_predictions[name][row_idx] * self.weights.get(name, 0.0)
                for name in model_predictions
            )
            final.append(max(float(value), 0.0))

        return {
            "final": final,
            "models": model_predictions,
            "weights": self.weights,
            "feature_columns": self.feature_columns,
        }

    def _prepare_features(self, X: pd.DataFrame):
        prepared = X.copy()
        for col in self.feature_columns:
            if col not in prepared.columns:
                prepared[col] = 0 if col in NUM_COLS else "未知"
        return prepared[self.feature_columns]

    def to_artifact(self):
        return {
            "version": 3,
            "model_type": "weighted_ensemble",
            "models": self.models,
            "weights": self.weights,
            "feature_columns": self.feature_columns,
            "metadata": self.metadata,
        }


def rows_to_frame(rows: list[dict[str, Any]]):
    return pd.DataFrame(rows)


def build_training_frame(cars: list[models.CrawlCar]):
    rows = []
    skipped = []
    for c in cars:
        row = build_row(c)
        missing = missing_training_fields(row)
        if missing:
            skipped.append(
                {
                    "source_car_id": c.source_car_id,
                    "title": c.title,
                    "reason": f"缺少字段：{', '.join(missing)}",
                }
            )
            continue
        rows.append(row)
    return rows_to_frame(rows), skipped


def build_annotation_training_frame(db: Session):
    train_cars = db.query(models.TrainCar).all()
    source_ids = [car.source_car_id for car in train_cars if car.source_car_id]
    crawl_map = {
        car.source_car_id: car
        for car in db.query(models.CrawlCar).filter(models.CrawlCar.source_car_id.in_(source_ids)).all()
    } if source_ids else {}

    rows = []
    skipped = []
    for train_car in train_cars:
        crawl_car = crawl_map.get(train_car.source_car_id)
        row = build_annotation_row(train_car, crawl_car)
        missing = missing_training_fields(row)
        if missing:
            skipped.append(
                {
                    "source_car_id": train_car.source_car_id,
                    "title": row.get("title"),
                    "reason": f"缺少字段：{', '.join(missing)}",
                }
            )
            continue
        rows.append(row)
    return rows_to_frame(rows), skipped, len(train_cars)


def frame_to_training_rows(df: pd.DataFrame, limit: int = 50):
    if df.empty:
        return []
    rows = df.head(limit).copy()
    rows = rows.rename(columns={"y": "price_wan"})
    return rows[
        [
            "source_car_id",
            "brand",
            "model",
            "age_years",
            "engine",
            "gearbox",
            "transfer_cnt",
            "price_new",
            "price_wan",
        ]
    ].where(pd.notna(rows), None).to_dict(orient="records")


def calculate_metrics(y_true, y_pred):
    mse = float(mean_squared_error(y_true, y_pred))
    return {
        "mse": round(mse, 4),
        "rmse": round(float(np.sqrt(mse)), 4),
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 4),
    }


def evaluate_training_frame(df: pd.DataFrame):
    if len(df) >= 5:
        train_df, eval_df = train_test_split(df, test_size=0.2, random_state=42)
        evaluation_mode = "holdout"
    else:
        train_df = df
        eval_df = df
        evaluation_mode = "in_sample_small_dataset"

    eval_model = EnsemblePriceModel()
    eval_model.fit(train_df[FEATURE_COLUMNS], train_df["y"])
    breakdown = eval_model.predict_breakdown(eval_df[FEATURE_COLUMNS])

    metrics = calculate_metrics(eval_df["y"], breakdown["final"])
    model_metrics = {
        name: calculate_metrics(eval_df["y"], values)
        for name, values in breakdown["models"].items()
    }

    return {
        "metrics": metrics,
        "model_metrics": model_metrics,
        "train_count": len(train_df),
        "eval_count": len(eval_df),
        "evaluation_mode": evaluation_mode,
    }


def get_training_dataset(limit: int = 50):
    db: Session = SessionLocal()
    try:
        df, skipped, total_annotated = build_annotation_training_frame(db)
    finally:
        db.close()

    model_metadata = get_saved_model_metadata()
    trained_source_ids = set(model_metadata.get("trained_source_ids") or [])
    usable_source_ids = set(df["source_car_id"].astype(str).tolist()) if not df.empty else set()
    new_source_ids = usable_source_ids - trained_source_ids if trained_source_ids else usable_source_ids

    return {
        "total_annotated": total_annotated,
        "usable_count": len(df),
        "skipped_count": len(skipped),
        "new_count": len(new_source_ids),
        "new_source_ids": sorted(new_source_ids),
        "skipped_examples": skipped[:20],
        "rows": frame_to_training_rows(df, limit=limit),
        "model_metadata": model_metadata,
    }


def train_and_save():
    db: Session = SessionLocal()
    try:
        df, skipped, total_annotated = build_annotation_training_frame(db)
        if len(df) < MIN_TRAINING_SAMPLES:
            crawl_cars = db.query(models.CrawlCar).all()
            df, skipped = build_training_frame(crawl_cars)
            source = "crawl_cars_fallback"
            total_annotated = len(crawl_cars)
        else:
            source = "train_cars"
    finally:
        db.close()

    if len(df) < MIN_TRAINING_SAMPLES:
        raise RuntimeError("训练数据不足：至少需要 2 条可训练数据")

    evaluation = evaluate_training_frame(df)

    model = EnsemblePriceModel()
    model.fit(df[FEATURE_COLUMNS], df["y"])

    trained_at = datetime.now().isoformat(timespec="seconds")
    metadata = {
        "trained_at": trained_at,
        "training_source": source,
        "sample_count": len(df),
        "total_annotated": total_annotated,
        "skipped_count": len(skipped),
        "trained_source_ids": df["source_car_id"].astype(str).tolist(),
        "metrics": evaluation["metrics"],
        "model_metrics": evaluation["model_metrics"],
        "train_count": evaluation["train_count"],
        "eval_count": evaluation["eval_count"],
        "evaluation_mode": evaluation["evaluation_mode"],
        "weights": MODEL_WEIGHTS,
    }
    model.metadata = metadata

    joblib.dump(model.to_artifact(), MODEL_PATH)
    print(
        f"✅ saved: {MODEL_PATH}, samples={len(df)}, metrics={evaluation['metrics']}, models={list(model.models)}"
    )
    return model


def get_saved_model_metadata():
    if not MODEL_PATH.exists():
        return {}
    try:
        artifact = joblib.load(MODEL_PATH)
    except (AttributeError, ModuleNotFoundError):
        return {}
    if isinstance(artifact, dict):
        return artifact.get("metadata") or {}
    return getattr(artifact, "metadata", {}) or {}


def load_model():
    if not MODEL_PATH.exists():
        return train_and_save()

    try:
        artifact = joblib.load(MODEL_PATH)
    except (AttributeError, ModuleNotFoundError):
        print("检测到不可加载的旧模型文件，正在重新训练融合模型...")
        return train_and_save()

    if isinstance(artifact, dict) and artifact.get("version") in {2, 3}:
        return EnsemblePriceModel(
            weights=artifact.get("weights", MODEL_WEIGHTS.copy()),
            feature_columns=artifact.get("feature_columns", FEATURE_COLUMNS.copy()),
            models=artifact["models"],
            metadata=artifact.get("metadata") or {},
        )

    if hasattr(artifact, "predict_breakdown"):
        return artifact

    print("检测到旧版单模型文件，正在重新训练 LightGBM + XGBoost + Linear 融合模型...")
    return train_and_save()


if __name__ == "__main__":
    train_and_save()
