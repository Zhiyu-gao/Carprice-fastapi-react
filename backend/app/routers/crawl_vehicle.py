from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app.schemas.crawl_vehicle import CrawlVehicleOut

router = APIRouter(prefix="/crawl-cars", tags=["crawl"])

@router.get("", response_model=list[CrawlVehicleOut])
def list_crawl_cars(db: Session = Depends(get_db)):
    return db.query(models.CrawlCar).order_by(
        models.CrawlCar.crawl_time.desc()
    ).limit(100).all()