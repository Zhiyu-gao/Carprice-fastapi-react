# app/routers/annotations.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.car import Car
from app.schemas import CarAnnotationCreate

router = APIRouter(prefix="/annotations", tags=["annotations"])


@router.post("")
def create_annotation(
    data: CarAnnotationCreate,
    db: Session = Depends(get_db),
):
    """
    标注一个车辆（车价）：
    - 幂等：同一个 source_car_id 只能标注一次
    - 写入 cars 表（作为训练数据）
    """

    exists = (
        db.query(Car)
        .filter(Car.source_car_id == data.source_car_id)
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="该车辆已标注")

    car = Car(
        source_car_id=data.source_car_id,
        price_wan=data.price_wan,

        # 可选字段（先跑通）
        brand=data.brand,
        model=data.model,
        year=data.year,
        displacement=data.displacement,
        gearbox=data.gearbox,
        transfer_count=data.transfer_count,
        city=data.city,
    )

    db.add(car)
    db.commit()
    db.refresh(car)

    return {"ok": True, "car_id": car.id}


@router.get("/ids")
def get_annotated_source_ids(db: Session = Depends(get_db)):
    rows = db.query(Car.source_car_id).all()
    return [r[0] for r in rows]
