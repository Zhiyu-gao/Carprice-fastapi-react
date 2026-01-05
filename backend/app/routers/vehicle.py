# app/routers/vehicle.py
# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from typing import List

# from app import models, schemas
# from app.db import get_db
# from app.routers.auth import get_current_user

# router = APIRouter(prefix="/vehicles", tags=["vehicle"])


# @router.get("", response_model=List[schemas.VehicleOut])
# def read_vehicles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
#     vehicles = db.query(models.Vehicle).offset(skip).limit(limit).all()
#     return vehicles


# @router.get("/{vehicle_id}", response_model=schemas.VehicleOut)
# def read_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
#     vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
#     if vehicle is None:
#         raise HTTPException(status_code=404, detail="Vehicle not found")
#     return vehicle


# @router.post("", response_model=schemas.VehicleOut)
# def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
#     db_vehicle = models.Vehicle(**vehicle.model_dump())
#     db.add(db_vehicle)
#     db.commit()
#     db.refresh(db_vehicle)
#     return db_vehicle


# @router.put("/{vehicle_id}", response_model=schemas.VehicleOut)
# def update_vehicle(vehicle_id: int, vehicle: schemas.VehicleUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
#     db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
#     if db_vehicle is None:
#         raise HTTPException(status_code=404, detail="Vehicle not found")
    
#     for field, value in vehicle.model_dump().items():
#         if value is not None:
#             setattr(db_vehicle, field, value)
    
#     db.commit()
#     db.refresh(db_vehicle)
#     return db_vehicle


# @router.delete("/{vehicle_id}", response_model=schemas.VehicleOut)
# def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
#     db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
#     if db_vehicle is None:
#         raise HTTPException(status_code=404, detail="Vehicle not found")
    
#     db.delete(db_vehicle)
#     db.commit()
#     return db_vehicle
