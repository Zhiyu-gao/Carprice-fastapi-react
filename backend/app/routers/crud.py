# app/crud.py
from sqlalchemy.orm import Session
from . import models, schemas


def get_house(db: Session, house_id: int):
    return db.query(models.House).filter(models.House.id == house_id).first()


def get_houses(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.House).offset(skip).limit(limit).all()


def create_house(db: Session, house: schemas.HouseCreate):
    db_house = models.House(**house.model_dump())
    db.add(db_house)
    db.commit()
    db.refresh(db_house)
    return db_house


def update_house(db: Session, house_id: int, house: schemas.HouseUpdate):
    db_house = get_house(db, house_id)
    if not db_house:
        return None
    for field, value in house.model_dump().items():
        setattr(db_house, field, value)
    db.commit()
    db.refresh(db_house)
    return db_house


def delete_house(db: Session, house_id: int):
    db_house = get_house(db, house_id)
    if not db_house:
        return None
    db.delete(db_house)
    db.commit()
    return db_house
