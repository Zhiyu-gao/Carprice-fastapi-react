import joblib
import numpy as np
from sqlalchemy.orm import Session
from sklearn.linear_model import LinearRegression
from app.db import SessionLocal
from app.models import House

MODEL_PATH = "model.pkl"

def train_and_save():
    db: Session = SessionLocal()
    houses = db.query(House).all()

    X = np.array([[h.area_sqm, h.bedrooms, h.age_years] for h in houses])
    y = np.array([h.price for h in houses])

    model = LinearRegression()
    model.fit(X, y)

    joblib.dump(model, MODEL_PATH)
    print("✅ model.pkl saved")

def load_model():
    return joblib.load(MODEL_PATH)
