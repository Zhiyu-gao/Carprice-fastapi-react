# app/services/dataset.py
from pathlib import Path
import json
import pandas as pd

ANNOTATION_DIR = Path("data/annotations")

def load_training_df() -> pd.DataFrame:
    rows = []

    for p in ANNOTATION_DIR.glob("*.json"):
        ann = json.loads(p.read_text(encoding="utf-8"))
        rows.append({
            "area_sqm": ann["features"]["area_sqm"],
            "bedrooms": ann["features"]["bedrooms"],
            "age_years": ann["features"]["age_years"],
            "price": ann["label"]["price"],
        })

    return pd.DataFrame(rows)
