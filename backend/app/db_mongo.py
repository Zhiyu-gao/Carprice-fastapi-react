import os
from datetime import UTC, datetime
from typing import Any

from dotenv import load_dotenv
from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "vehicle_intelligence")

_client: MongoClient | None = None
_indexes_ready = False


def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=3000)
    return _client


def get_mongo_db() -> Database:
    return get_mongo_client()[MONGODB_DB]


def get_purchase_collection() -> Collection:
    return get_mongo_db()["purchase_intents"]


def get_crawl_raw_collection() -> Collection:
    return get_mongo_db()["crawl_raw_cars"]


def get_vehicle_params_collection() -> Collection:
    return get_mongo_db()["vehicle_params"]


def utc_now() -> datetime:
    return datetime.now(UTC)


def prepare_mongo_indexes() -> None:
    global _indexes_ready
    if _indexes_ready:
        return

    purchases = get_purchase_collection()
    purchases.create_index(
        [("user_id", ASCENDING), ("source_car_id", ASCENDING), ("status", ASCENDING)],
        name="idx_user_car_status",
    )
    purchases.create_index([("created_at", ASCENDING)], name="idx_purchase_created_at")

    crawl_raw = get_crawl_raw_collection()
    crawl_raw.create_index([("car_id", ASCENDING)], name="idx_crawl_raw_car_id", unique=True)
    crawl_raw.create_index([("crawl_time", ASCENDING)], name="idx_crawl_raw_time")

    vehicle_params = get_vehicle_params_collection()
    vehicle_params.create_index([("car_id", ASCENDING)], name="idx_vehicle_params_car_id", unique=True)
    vehicle_params.create_index([("param_car_id", ASCENDING)], name="idx_vehicle_params_param_car_id")
    vehicle_params.create_index([("fetched_at", ASCENDING)], name="idx_vehicle_params_fetched_at")

    _indexes_ready = True


def mongo_healthcheck() -> dict[str, Any]:
    client = get_mongo_client()
    client.admin.command("ping")
    return {"ok": True, "db": MONGODB_DB}
