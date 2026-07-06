from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError, PyMongoError
from sqlalchemy.orm import Session

from app import models
from app.core.redis_lock import LockBackendError, LockBusyError, redis_lock
from app.db import get_db
from app.db_mongo import get_purchase_collection, prepare_mongo_indexes, utc_now
from app.routers.auth import get_current_user

router = APIRouter(prefix="/buyer", tags=["buyer"])

ACTIVE_PURCHASE_STATUSES = {"pending", "contacted"}


class PurchaseIntentCreate(BaseModel):
    train_car_id: int = Field(..., ge=1)
    note: str | None = Field(default=None, max_length=500)


def _serialize_doc(doc: dict[str, Any]) -> dict[str, Any]:
    out = dict(doc)
    raw_id = out.pop("_id", None)
    out["id"] = str(raw_id) if raw_id is not None else ""
    for key in ["created_at", "updated_at"]:
        value = out.get(key)
        if hasattr(value, "isoformat"):
            out[key] = value.isoformat()
    return out


def _car_snapshot(car: models.TrainCar) -> dict[str, Any]:
    return {
        "train_car_id": car.id,
        "source_car_id": car.source_car_id,
        "brand": car.brand,
        "model": car.model,
        "year": car.year,
        "mileage_km": car.mileage_km,
        "displacement": car.displacement,
        "gearbox": car.gearbox,
        "transfer_count": car.transfer_count,
        "city": car.city,
        "price_wan": car.price_wan,
    }


@router.post("/purchase-intents", status_code=status.HTTP_201_CREATED)
def create_purchase_intent(
    payload: PurchaseIntentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    car = db.query(models.TrainCar).filter(models.TrainCar.id == payload.train_car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="车辆不存在")

    source_car_id = car.source_car_id or f"train:{car.id}"
    lock_name = f"lock:buyer:purchase:{current_user.id}:{source_car_id}"

    try:
        with redis_lock(lock_name, ttl_seconds=15, wait_seconds=2):
            prepare_mongo_indexes()
            collection = get_purchase_collection()
            existing = collection.find_one(
                {
                    "user_id": current_user.id,
                    "source_car_id": source_car_id,
                    "status": {"$in": sorted(ACTIVE_PURCHASE_STATUSES)},
                }
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="你已经提交过这辆车的购买意向",
                )

            now = utc_now()
            doc = {
                "user_id": current_user.id,
                "username": current_user.username,
                "email": current_user.email,
                "train_car_id": car.id,
                "source_car_id": source_car_id,
                "status": "pending",
                "note": payload.note,
                "car": _car_snapshot(car),
                "created_at": now,
                "updated_at": now,
            }
            result = collection.insert_one(doc)
            doc["_id"] = result.inserted_id
            return _serialize_doc(doc)
    except LockBusyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="购买请求正在处理中，请稍后再试",
        ) from exc
    except LockBackendError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redis 分布式锁不可用，请确认 Redis 已启动",
        ) from exc
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="购买意向已存在",
        ) from exc
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"MongoDB 不可用: {exc}",
        ) from exc


@router.get("/purchase-intents")
def list_my_purchase_intents(
    current_user: models.User = Depends(get_current_user),
):
    try:
        prepare_mongo_indexes()
        docs = (
            get_purchase_collection()
            .find({"user_id": current_user.id})
            .sort("created_at", -1)
            .limit(100)
        )
        return [_serialize_doc(doc) for doc in docs]
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"MongoDB 不可用: {exc}",
        ) from exc


@router.delete("/purchase-intents/{intent_id}")
def cancel_purchase_intent(
    intent_id: str,
    current_user: models.User = Depends(get_current_user),
):
    try:
        object_id = ObjectId(intent_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="无效的购买意向 ID") from exc

    try:
        now = utc_now()
        result = get_purchase_collection().update_one(
            {
                "_id": object_id,
                "user_id": current_user.id,
                "status": {"$in": sorted(ACTIVE_PURCHASE_STATUSES)},
            },
            {"$set": {"status": "canceled", "updated_at": now}},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="购买意向不存在")
        return {"ok": True}
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"MongoDB 不可用: {exc}",
        ) from exc
