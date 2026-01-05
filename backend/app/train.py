import joblib
import pandas as pd
from sqlalchemy.orm import Session
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

from app.db import SessionLocal
from app import models
import re
from datetime import datetime

def parse_float(val):
    if val is None:
        return None
    m = re.search(r"([\d.]+)", str(val))
    return float(m.group(1)) if m else None

def parse_transfer_count(val):
    # "1次" -> 1
    if not val:
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
    now_year = datetime.now().year
    return max(now_year - year, 0)


MODEL_PATH = "car_price_model.pkl"

def build_row(c: models.CrawlCar):
    info = c.info or {}

    brand = "未知"
    if c.title:
        brand = c.title.split()[0]  # “传祺M8 ...” -> “传祺M8”(有些会带系列)
        # 你也可以更严谨：取第一个词或用正则提品牌

    age_years = parse_age_years_from_plate(info.get("上牌时间"))
    engine = parse_float(info.get("排量"))           # "2.0T" -> 2.0
    gearbox = info.get("变速箱", "未知")             # "自动"
    transfer_cnt = parse_transfer_count(info.get("过户次数"))

    price_new = info.get("新车指导价")              # 24.98
    price_used = info.get("当前售价")               # 18.28

    return {
        "brand": brand,
        "age_years": age_years,
        "engine": engine,
        "gearbox": gearbox,
        "transfer_cnt": transfer_cnt,
        "price_new": price_new,
        "y": price_used,
    }

def train_and_save():
    db: Session = SessionLocal()
    cars = db.query(models.CrawlCar).all()

    rows = []
    for c in cars:
        r = build_row(c)
        # 过滤缺失值（第一版先简单点）
        if any(r[k] is None for k in ["age_years", "engine", "price_new", "y"]):
            continue
        rows.append(r)

    df = pd.DataFrame(rows)
    if df.empty:
        raise RuntimeError("训练数据为空：检查 CrawlCar.info 是否包含 当前售价/新车指导价/上牌时间/排量 等字段")

    X = df.drop(columns=["y"])
    y = df["y"]

    num_cols = ["age_years", "engine", "transfer_cnt", "price_new"]
    cat_cols = ["brand", "gearbox"]

    pre = ColumnTransformer([
        ("num", "passthrough", num_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
    ])

    model = Pipeline([
        ("preprocess", pre),
        ("reg", LinearRegression()),
    ])

    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    print(f"✅ saved: {MODEL_PATH}, samples={len(df)}")

def load_model():
    return joblib.load(MODEL_PATH)

if __name__ == "__main__":
    train_and_save()
