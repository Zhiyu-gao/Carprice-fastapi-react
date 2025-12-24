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
    标注一个爬虫房源：
    - 幂等：同一个 source_house_id 只能标注一次
    - 成功后写入 houses 表（训练数据）
    """

    # 1️⃣ 防止重复标注
    exists = (
        db.query(models.House)
        .filter(models.House.source_house_id == data.source_house_id)
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="该房源已标注")

    # 2️⃣ 写入训练样本
    house = models.House(
        source_house_id=data.source_house_id,
        area_sqm=data.features.area_sqm,
        bedrooms=data.features.bedrooms,
        age_years=data.features.age_years,
        price=data.label.price,
    )

    db.add(house)
    db.commit()
    db.refresh(house)

    return {"ok": True, "house_id": house.id}


@router.get("/ids")
def get_annotated_source_ids(db: Session = Depends(get_db)):
    """
    返回所有已经标注过的爬虫 house_id
    给前端用来标记“已标注”
    """
    rows = db.query(models.House.source_house_id).all()
    return [r[0] for r in rows]
