from app.core.redis_lock import redis_lock
from app.db_mongo import (
    get_crawl_raw_collection,
    get_vehicle_params_collection,
    prepare_mongo_indexes,
    utc_now,
)
from app.models.crawl_car import CrawlCar


def _save_crawl_raw_to_mongo(data: dict) -> None:
    car_id = data.get("car_id")
    if not car_id:
        return

    prepare_mongo_indexes()
    doc = dict(data)
    doc["car_id"] = str(car_id)
    doc["updated_at"] = utc_now()
    get_crawl_raw_collection().update_one(
        {"car_id": str(car_id)},
        {
            "$set": doc,
            "$setOnInsert": {"created_at": utc_now()},
        },
        upsert=True,
    )


def _save_vehicle_params_to_mongo(data: dict) -> None:
    car_id = data.get("car_id")
    params = data.get("vehicle_params")
    if not car_id or not isinstance(params, dict):
        return

    prepare_mongo_indexes()
    doc = dict(params)
    doc["car_id"] = str(car_id)
    doc["updated_at"] = utc_now()
    get_vehicle_params_collection().update_one(
        {"car_id": str(car_id)},
        {
            "$set": doc,
            "$setOnInsert": {"created_at": utc_now()},
        },
        upsert=True,
    )


# app/services/crawl_car_service.py
def save_crawl_car(db, data: dict) -> bool:
    car_id = data.get("car_id")
    if not car_id:
        return False

    lock_name = f"lock:crawl:car:{car_id}"
    with redis_lock(lock_name, ttl_seconds=60, wait_seconds=5):
        _save_crawl_raw_to_mongo(data)
        _save_vehicle_params_to_mongo(data)

        exists = db.query(CrawlCar).filter(CrawlCar.source_car_id == car_id).first()
        if exists:
            exists.title = data.get("title") or exists.title
            exists.source_url = data.get("source_url") or exists.source_url
            exists.image_url = data.get("image_url") or exists.image_url
            exists.image_path = data.get("image_path") or exists.image_path
            exists.tags = data.get("tags") or exists.tags
            exists.info = data.get("info") or exists.info
            exists.page_no = data.get("page_no") or exists.page_no
            return False

        obj = CrawlCar(
            source_car_id=car_id,
            title=data.get("title"),
            source_url=data.get("source_url"),
            image_url=data.get("image_url"),
            image_path=data.get("image_path"),
            tags=data.get("tags"),
            info=data.get("info"),
            page_no=data.get("page_no"),
        )

        db.add(obj)
        return True
