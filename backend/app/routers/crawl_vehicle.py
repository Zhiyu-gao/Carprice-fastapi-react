import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app import models
from app.db import get_db
from app.db_mongo import (
    get_crawl_raw_collection,
    get_vehicle_params_collection,
    prepare_mongo_indexes,
    utc_now,
)
from app.routers.train_car import (
    LOW_CONFIDENCE_THRESHOLD,
    _brand_from_text,
    _brand_from_vehicle_params,
    _is_unknown_brand,
)
from app.schemas.crawl_vehicle import CrawlVehicleOut, CrawlVehicleUpdate

router = APIRouter(prefix="/crawl-cars", tags=["crawl"])


def _json_safe(value):
    if isinstance(value, dict):
        return {str(k): _json_safe(v) for k, v in value.items() if k != "_id"}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def _mongo_details_for(car_ids: list[str]) -> tuple[dict[str, dict], dict[str, dict]]:
    if not car_ids:
        return {}, {}

    try:
        prepare_mongo_indexes()
        raw_docs = {
            str(doc.get("car_id")): _json_safe(doc)
            for doc in get_crawl_raw_collection().find({"car_id": {"$in": car_ids}})
        }
        param_docs = {
            str(doc.get("car_id")): _json_safe(doc)
            for doc in get_vehicle_params_collection().find({"car_id": {"$in": car_ids}})
        }
        return raw_docs, param_docs
    except Exception:
        return {}, {}


def _vehicle_out(item: models.CrawlCar, raw_doc: dict | None = None, param_doc: dict | None = None) -> dict:
    data = CrawlVehicleOut.model_validate(item).model_dump(by_alias=True)
    raw_doc = raw_doc or {}
    param_doc = param_doc or {}
    data["raw_data"] = raw_doc or None
    data["vehicle_params"] = param_doc or raw_doc.get("vehicle_params")
    data["params_url"] = param_doc.get("params_url") or raw_doc.get("params_url")
    data["param_car_id"] = param_doc.get("param_car_id") or raw_doc.get("param_car_id")
    return data


def _parse_float(value):
    if value is None:
        return None
    match = re.search(r"([\d.]+)", str(value))
    return float(match.group(1)) if match else None


def _parse_int(value):
    if value is None:
        return None
    match = re.search(r"(\d+)", str(value))
    return int(match.group(1)) if match else None


def _pick_info_value(info: dict, keys: list[str]):
    for key in keys:
        value = info.get(key)
        if value is not None and str(value).strip():
            return value
    for key, value in info.items():
        if any(token in str(key) for token in keys) and value is not None and str(value).strip():
            return value
    return None


def _suggest_price(info: dict):
    current_price = _parse_float(info.get("当前售价"))
    if current_price is not None:
        return current_price
    price_new = _parse_float(info.get("新车指导价"))
    discount = _parse_float(info.get("比新车省"))
    if price_new is not None and discount is not None:
        return round(price_new - discount, 2)
    return None


def _parse_year_from_info(info: dict, title: str | None):
    text = str(_pick_info_value(info, ["上牌时间", "上牌", "年份", "年款"]) or title or "")
    match = re.search(r"(19|20)\d{2}", text)
    return int(match.group(0)) if match else None


def _promote_crawl_car_to_train(
    car: models.CrawlCar,
    info: dict,
    *,
    db: Session,
) -> tuple[bool, str]:
    brand = str(info.get("品牌") or "").strip()
    confidence = _parse_float(info.get("品牌置信度"))
    if not brand or brand == "未知":
        return False, "brand_unknown"
    if confidence is None or confidence < LOW_CONFIDENCE_THRESHOLD:
        return False, "low_confidence"

    price_wan = _suggest_price(info)
    if price_wan is None:
        return False, "missing_price"

    existing = db.query(models.TrainCar).filter(models.TrainCar.source_car_id == car.source_car_id).first()
    if existing:
        return False, "already_in_train"

    train_car = models.TrainCar(
        source_car_id=car.source_car_id,
        brand=brand,
        brand_confidence=round(confidence, 2),
        brand_source=str(info.get("品牌来源") or "auto_clean"),
        model=car.title or str(_pick_info_value(info, ["车型", "车系", "型号"]) or "未知"),
        year=_parse_year_from_info(info, car.title) or 0,
        mileage_km=_parse_float(_pick_info_value(info, ["表显里程", "里程"])),
        displacement=_parse_float(_pick_info_value(info, ["排量"])),
        gearbox=str(_pick_info_value(info, ["变速箱", "挡位"]) or "未知"),
        transfer_count=_parse_int(_pick_info_value(info, ["过户次数", "过户"])),
        city=str(_pick_info_value(info, ["车源地", "所在地", "城市"]) or ""),
        price_wan=price_wan,
    )
    db.add(train_car)
    car.is_annotated = 1
    return True, "promoted"


@router.get("")
def list_crawl_cars(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    keyword: str | None = Query(None, description="按车源ID或标题搜索"),
    needs_annotation: bool = Query(False, description="只返回尚未进入训练集、需要人工标注的车辆"),
    db: Session = Depends(get_db),
):
    q = db.query(models.CrawlCar)
    if needs_annotation:
        annotated_ids = db.query(models.TrainCar.source_car_id)
        q = q.filter(~models.CrawlCar.source_car_id.in_(annotated_ids))
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
    car_ids = [str(item.source_car_id) for item in items]
    raw_docs, param_docs = _mongo_details_for(car_ids)
    items_out = [
        _vehicle_out(
            item,
            raw_doc=raw_docs.get(str(item.source_car_id)),
            param_doc=param_docs.get(str(item.source_car_id)),
        )
        for item in items
    ]
    return {
        "items": items_out,
        "page": page,
        "page_size": page_size,
        "total": total,
    }


def _infer_crawl_brand(
    car: models.CrawlCar,
    *,
    trust_existing_info_brand: bool = True,
) -> tuple[str, float, str] | None:
    info = car.info if isinstance(car.info, dict) else {}

    for source, text, alias_confidence, model_confidence in [
        ("title", car.title, 0.90, 0.82),
    ]:
        match = _brand_from_text(
            text or "",
            source=source,
            alias_confidence=alias_confidence,
            model_confidence=model_confidence,
        )
        if match:
            return match

    if trust_existing_info_brand:
        for key, value in info.items():
            if any(token in str(key) for token in ["品牌", "厂商", "生产商"]):
                match = _brand_from_text(
                    str(value),
                    source=f"info:{key}",
                    alias_confidence=0.97,
                    model_confidence=0.88,
                )
                if match:
                    return match

    match = _brand_from_text(
        " ".join(str(value) for key, value in info.items() if key not in {"品牌", "品牌来源"}),
        source="info:raw",
        alias_confidence=0.84,
        model_confidence=0.74,
    )
    if match:
        return match

    params_match = _brand_from_vehicle_params(car.source_car_id)
    if params_match:
        return params_match

    return None


@router.post("/clean-brands")
def clean_crawl_car_brands(
    force: bool = Query(False, description="是否覆盖已有非未知品牌"),
    auto_promote: bool = Query(True, description="高置信且字段完整的数据是否自动进入训练集"),
    db: Session = Depends(get_db),
):
    rows = db.query(models.CrawlCar).all()
    total = len(rows)
    updated = 0
    skipped = 0
    unmatched = 0
    low_confidence = 0
    promoted = 0
    promote_skipped = 0
    promote_reasons: dict[str, int] = {}
    examples: list[dict[str, str | int | float | None]] = []

    for car in rows:
        info = dict(car.info or {})
        old_brand = str(info.get("品牌") or "").strip()

        if not force and not _is_unknown_brand(old_brand):
            if info.get("品牌置信度") is None:
                info["品牌置信度"] = 1.0
                info["品牌来源"] = info.get("品牌来源") or "existing"
                car.info = info
                flag_modified(car, "info")
            if auto_promote:
                ok, reason = _promote_crawl_car_to_train(car, info, db=db)
                if ok:
                    promoted += 1
                else:
                    promote_skipped += 1
                    promote_reasons[reason] = promote_reasons.get(reason, 0) + 1
            skipped += 1
            continue

        match = _infer_crawl_brand(car, trust_existing_info_brand=not force)
        if not match:
            info["品牌"] = "未知"
            info["品牌置信度"] = 0.0
            info["品牌来源"] = "unmatched"
            car.info = info
            flag_modified(car, "info")
            unmatched += 1
            continue

        brand, confidence, source = match
        info["品牌"] = brand
        info["品牌置信度"] = round(confidence, 2)
        info["品牌来源"] = source
        car.info = info
        flag_modified(car, "info")
        if confidence < LOW_CONFIDENCE_THRESHOLD:
            low_confidence += 1
        if auto_promote:
            ok, reason = _promote_crawl_car_to_train(car, info, db=db)
            if ok:
                promoted += 1
            else:
                promote_skipped += 1
                promote_reasons[reason] = promote_reasons.get(reason, 0) + 1
        updated += 1

        if len(examples) < 10:
            examples.append(
                {
                    "id": car.id,
                    "source_car_id": car.source_car_id,
                    "old_brand": old_brand or None,
                    "new_brand": brand,
                    "confidence": round(confidence, 2),
                    "source": source,
                    "title": car.title,
                }
            )

    db.commit()
    return {
        "ok": True,
        "total": total,
        "updated": updated,
        "skipped": skipped,
        "unmatched": unmatched,
        "low_confidence": low_confidence,
        "promoted": promoted,
        "promote_skipped": promote_skipped,
        "promote_reasons": promote_reasons,
        "low_confidence_threshold": LOW_CONFIDENCE_THRESHOLD,
        "examples": examples,
    }


@router.get("/{source_car_id}", response_model=CrawlVehicleOut)
def get_crawl_car(
    source_car_id: str,
    db: Session = Depends(get_db),
):
    item = db.query(models.CrawlCar).filter(models.CrawlCar.source_car_id == source_car_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="未找到车辆")
    raw_docs, param_docs = _mongo_details_for([source_car_id])
    return _vehicle_out(
        item,
        raw_doc=raw_docs.get(source_car_id),
        param_doc=param_docs.get(source_car_id),
    )


@router.put("/{source_car_id}")
def update_crawl_car(
    source_car_id: str,
    payload: CrawlVehicleUpdate,
    db: Session = Depends(get_db),
):
    item = db.query(models.CrawlCar).filter(models.CrawlCar.source_car_id == source_car_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="未找到车辆")

    update_data = payload.model_dump(exclude_unset=True)
    mysql_fields = {"title", "tags", "info", "image_url", "image_path", "source_url"}
    for field in mysql_fields:
        if field in update_data:
            setattr(item, field, update_data[field])

    db.commit()
    db.refresh(item)

    try:
        prepare_mongo_indexes()
        raw_update = {
            key: value
            for key, value in update_data.items()
            if key
            in {
                "title",
                "tags",
                "info",
                "image_url",
                "image_path",
                "source_url",
                "params_url",
                "param_car_id",
                "vehicle_params",
            }
        }
        if raw_update:
            raw_update["car_id"] = source_car_id
            raw_update["updated_at"] = utc_now()
            get_crawl_raw_collection().update_one(
                {"car_id": source_car_id},
                {
                    "$set": raw_update,
                    "$setOnInsert": {"created_at": utc_now()},
                },
                upsert=True,
            )

        if "vehicle_params" in update_data and isinstance(update_data["vehicle_params"], dict):
            params_doc = dict(update_data["vehicle_params"])
            params_doc["car_id"] = source_car_id
            params_doc["updated_at"] = utc_now()
            if "params_url" in update_data:
                params_doc["params_url"] = update_data["params_url"]
            if "param_car_id" in update_data:
                params_doc["param_car_id"] = update_data["param_car_id"]
            get_vehicle_params_collection().update_one(
                {"car_id": source_car_id},
                {
                    "$set": params_doc,
                    "$setOnInsert": {"created_at": utc_now()},
                },
                upsert=True,
            )
    except Exception as e:
        raw_docs, param_docs = _mongo_details_for([source_car_id])
        data = _vehicle_out(
            item,
            raw_doc=raw_docs.get(source_car_id),
            param_doc=param_docs.get(source_car_id),
        )
        data["mongo_error"] = str(e)
        return data

    raw_docs, param_docs = _mongo_details_for([source_car_id])
    return _vehicle_out(
        item,
        raw_doc=raw_docs.get(source_car_id),
        param_doc=param_docs.get(source_car_id),
    )


@router.delete("")
def delete_all_crawl_cars(
    include_mongo: bool = Query(True, description="是否同时清空 MongoDB 中的爬虫原始数据和参数页数据"),
    db: Session = Depends(get_db),
):
    train_deleted = db.query(models.TrainCar).delete()
    crawl_deleted = db.query(models.CrawlCar).delete()
    db.commit()

    mongo_deleted = {"crawl_raw_cars": 0, "vehicle_params": 0}
    if include_mongo:
        try:
            prepare_mongo_indexes()
            mongo_deleted["crawl_raw_cars"] = get_crawl_raw_collection().delete_many({}).deleted_count
            mongo_deleted["vehicle_params"] = get_vehicle_params_collection().delete_many({}).deleted_count
        except Exception as e:
            return {
                "ok": True,
                "crawl_deleted": crawl_deleted,
                "train_deleted": train_deleted,
                "mongo_deleted": mongo_deleted,
                "mongo_error": str(e),
            }
    return {
        "ok": True,
        "crawl_deleted": crawl_deleted,
        "train_deleted": train_deleted,
        "mongo_deleted": mongo_deleted,
    }


@router.delete("/{source_car_id}")
def delete_crawl_car(
    source_car_id: str,
    db: Session = Depends(get_db),
):
    item = db.query(models.CrawlCar).filter(models.CrawlCar.source_car_id == source_car_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="未找到车辆")

    # 删除关联标注，避免残留训练数据
    db.query(models.TrainCar).filter(models.TrainCar.source_car_id == source_car_id).delete()
    db.delete(item)
    db.commit()
    return {"ok": True}
