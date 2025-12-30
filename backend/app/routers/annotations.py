from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app import models
from app.schemas import AnnotationCreate

router = APIRouter(prefix="/annotations", tags=["annotations"])


@router.post("")
def create_annotation(
    data: AnnotationCreate,
    db: Session = Depends(get_db),
):
    """
    标注一个爬虫车辆：
    - 幂等：同一个 source_vehicle_id 只能标注一次
    - 成功后写入 vehicles 表（训练数据）
    """

    # 1️⃣ 防止重复标注
    exists = (
        db.query(models.Vehicle)
        .filter(models.Vehicle.source_vehicle_id == data.source_vehicle_id)
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="该车辆已标注")

    # 2️⃣ 写入训练样本
    vehicle = models.Vehicle(
        source_vehicle_id=data.source_vehicle_id,
        area_sqm=data.features.area_sqm,
        bedrooms=data.features.bedrooms,
        age_years=data.features.age_years,
        price=data.label.price,
    )

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    return {"ok": True, "vehicle_id": vehicle.id}


@router.get("/ids")
def get_annotated_source_ids(db: Session = Depends(get_db)):
    """
    返回所有已经标注过的爬虫 vehicle_id
    给前端用来标记“已标注”
    """
    rows = db.query(models.Vehicle.source_vehicle_id).all()
    return [r[0] for r in rows]
