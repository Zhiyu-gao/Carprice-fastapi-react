from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db import get_db
from app import models
from app.schemas.crawl_vehicle import CrawlVehicleOut

router = APIRouter(prefix="/crawl-cars", tags=["crawl"])

@router.get("")
def list_crawl_cars(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    keyword: str | None = Query(None, description="按车源ID或标题搜索"),
    db: Session = Depends(get_db),
):
    q = db.query(models.CrawlCar)
    kw = (keyword or "").strip()
    if kw:
        q = q.filter(
            or_(
                models.CrawlCar.source_car_id.like(f"%{kw}%"),
                models.CrawlCar.title.like(f"%{kw}%"),
            )
        )
    total = q.count()
    items = (
        q.order_by(models.CrawlCar.crawl_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    items_out = [
        CrawlVehicleOut.model_validate(item).model_dump(by_alias=True)
        for item in items
    ]
    return {
        "items": items_out,
        "page": page,
        "page_size": page_size,
        "total": total,
    }


@router.get("/{source_car_id}", response_model=CrawlVehicleOut)
def get_crawl_car(
    source_car_id: str,
    db: Session = Depends(get_db),
):
    item = (
        db.query(models.CrawlCar)
        .filter(models.CrawlCar.source_car_id == source_car_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="未找到车辆")
    return CrawlVehicleOut.model_validate(item)


@router.delete("/{source_car_id}")
def delete_crawl_car(
    source_car_id: str,
    db: Session = Depends(get_db),
):
    item = (
        db.query(models.CrawlCar)
        .filter(models.CrawlCar.source_car_id == source_car_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="未找到车辆")

    # 删除关联标注，避免残留训练数据
    db.query(models.TrainCar).filter(
        models.TrainCar.source_car_id == source_car_id
    ).delete()
    db.delete(item)
    db.commit()
    return {"ok": True}
