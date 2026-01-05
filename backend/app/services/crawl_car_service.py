from sqlalchemy.orm import Session
from app.models.crawl_car import CrawlCar
from datetime import datetime

# app/services/crawl_car_service.py
def save_crawl_car(db, data: dict) -> bool:
    car_id = data.get("car_id")
    if not car_id:
        return False

    exists = (
        db.query(CrawlCar)
        .filter(CrawlCar.source_car_id == car_id)
        .first()
    )
    if exists:
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

