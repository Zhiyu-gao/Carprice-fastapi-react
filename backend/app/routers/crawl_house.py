from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app import models, old_schemas

router = APIRouter(prefix="/crawl-houses", tags=["crawl"])

@router.get("", response_model=list[old_schemas.CrawlHouseOut])
def list_crawl_houses(db: Session = Depends(get_db)):
    return db.query(models.CrawlHouse).order_by(
        models.CrawlHouse.crawl_time.desc()
    ).limit(100).all()
