from sqlalchemy.orm import Session
from app import models


def list_train_cars(db: Session, *, page: int, page_size: int):
    q = db.query(models.TrainCar)
    total = q.count()
    items = (
        q.order_by(models.TrainCar.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total
