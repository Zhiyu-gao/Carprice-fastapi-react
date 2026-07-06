import os
import time
from collections.abc import Iterator
from contextlib import contextmanager
from uuid import uuid4

from dotenv import load_dotenv
from redis import Redis
from redis.exceptions import RedisError

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

_redis_client: Redis | None = None

_RELEASE_SCRIPT = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
"""


class DistributedLockError(RuntimeError):
    pass


class LockBusyError(DistributedLockError):
    pass


class LockBackendError(DistributedLockError):
    pass


def get_redis_client() -> Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client


@contextmanager
def redis_lock(
    name: str,
    *,
    ttl_seconds: int = 30,
    wait_seconds: float = 0,
    retry_interval: float = 0.1,
) -> Iterator[None]:
    token = uuid4().hex
    deadline = time.monotonic() + max(wait_seconds, 0)
    client = get_redis_client()

    acquired = False
    try:
        while True:
            try:
                acquired = bool(client.set(name, token, nx=True, ex=ttl_seconds))
            except RedisError as exc:
                raise LockBackendError(f"Redis lock backend unavailable: {exc}") from exc

            if acquired:
                break
            if time.monotonic() >= deadline:
                raise LockBusyError(f"Lock busy: {name}")
            time.sleep(retry_interval)

        yield
    finally:
        if acquired:
            try:
                client.eval(_RELEASE_SCRIPT, 1, name, token)
            except RedisError:
                pass
