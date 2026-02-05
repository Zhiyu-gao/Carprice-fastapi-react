# app/routers/annotations.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.car import TrainCar
from app.models.crawl_car import CrawlCar
from app.schemas import CarAnnotationCreate


def _pick_info_value(info: dict | None, keys: list[str]) -> str | None:
    if not info:
        return None
    for k in keys:
        v = info.get(k)
        if v is not None and str(v).strip():
            return str(v).strip()
    # 尝试模糊匹配
    for k, v in info.items():
        if any(key in k for key in keys) and v is not None and str(v).strip():
            return str(v).strip()
    return None


def _parse_year(text: str | None) -> int | None:
    if not text:
        return None
    import re
    m = re.search(r"(19|20)\d{2}", text)
    if m:
        return int(m.group(0))
    return None

router = APIRouter(prefix="/annotations", tags=["annotations"])


@router.post("")
def create_annotation(
    data: CarAnnotationCreate,
    db: Session = Depends(get_db),
):
    """
    标注一个车辆（车价）：
    - 幂等：同一个 source_car_id 只能标注一次
    - 写入 train_cars 表（作为训练数据）
    """

    exists = (
        db.query(TrainCar)
        .filter(TrainCar.source_car_id == data.source_car_id)
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="该车辆已标注")

    crawl = (
        db.query(CrawlCar)
        .filter(CrawlCar.source_car_id == data.source_car_id)
        .first()
    )
    info = crawl.info if crawl and isinstance(crawl.info, dict) else None

    brand = data.brand or _pick_info_value(info, ["品牌"])
    model = data.model or _pick_info_value(info, ["车型", "车系", "型号"])
    year = data.year or _parse_year(_pick_info_value(info, ["上牌时间", "上牌", "年份", "年款"]))
    if not year and crawl and crawl.title:
        year = _parse_year(crawl.title)

    # 数据库列可能是 NOT NULL，这里做保底
    brand = brand or "未知"
    model = model or "未知"
    year = year or 0

    car = TrainCar(
        source_car_id=data.source_car_id,
        price_wan=data.price_wan,

        # 可选字段（先跑通）
        brand=brand,
        model=model,
        year=year,
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
def get_annotated_source_ids(
    source_ids: str | None = Query(None, description="逗号分隔的 source_car_id 列表"),
    db: Session = Depends(get_db),
):
    q = db.query(TrainCar.source_car_id)
    if source_ids:
        ids = [s for s in source_ids.split(",") if s]
        if ids:
            q = q.filter(TrainCar.source_car_id.in_(ids))
    rows = q.all()
    return [r[0] for r in rows]
