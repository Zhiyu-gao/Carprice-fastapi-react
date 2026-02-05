from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app.services.train_car_service import list_train_cars as list_train_cars_svc

router = APIRouter(prefix="/train-cars", tags=["train"])


@router.get("")
def list_train_cars(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    items, total = list_train_cars_svc(db, page=page, page_size=page_size)
    items_out = [
        {
            "id": c.id,
            "source_car_id": c.source_car_id,
            "brand": c.brand,
            "model": c.model,
            "year": c.year,
            "displacement": c.displacement,
            "gearbox": c.gearbox,
            "transfer_count": c.transfer_count,
            "city": c.city,
            "price_wan": c.price_wan,
        }
        for c in items
    ]
    return {"items": items_out, "page": page, "page_size": page_size, "total": total}
