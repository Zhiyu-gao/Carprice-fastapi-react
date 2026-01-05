import joblib
import numpy as np
from sqlalchemy.orm import Session
from sklearn.linear_model import LinearRegression
from app.db import SessionLocal
from app.models import car

MODEL_PATH = "model.pkl"

def train_and_save():
    db: Session = SessionLocal()
    vehicles = db.query(car).all()

    X = np.array([[v.area_sqm, v.bedrooms, v.age_years] for v in vehicles])
    y = np.array([v.price for v in vehicles])

    model = LinearRegression()
    model.fit(X, y)

    joblib.dump(model, MODEL_PATH)
    print("✅ model.pkl saved")

def load_model():
    return joblib.load(MODEL_PATH)
