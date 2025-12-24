import redis
import random
import time
import os

r = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))


def generate_and_store_code(email: str) -> str:
    code = f"{random.randint(100000, 999999)}"
    key = f"email_code:{email}"
    r.setex(key, 300, code)  # 5 分钟
    return code


def verify_code(email: str, code: str) -> bool:
    key = f"email_code:{email}"
    stored = r.get(key)
    if not stored:
        return False
    if stored.decode() != code:
        return False
    r.delete(key)
    return True
