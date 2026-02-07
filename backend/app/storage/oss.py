import os
import oss2

OSS_ENABLED = os.getenv("OSS_ENABLED", "false").lower() in {"1", "true", "yes"}
OSS_BUCKET = os.getenv("OSS_BUCKET", "")
OSS_ENDPOINT = os.getenv("OSS_ENDPOINT", "")
OSS_PREFIX = os.getenv("OSS_PREFIX", "car-price")
OSS_URL_EXPIRE = int(os.getenv("OSS_URL_EXPIRE", "600"))
OSS_AUTH_MODE = os.getenv("OSS_AUTH_MODE", "ram").lower()
OSS_ACCESS_KEY_ID = os.getenv("OSS_ACCESS_KEY_ID", "")
OSS_ACCESS_KEY_SECRET = os.getenv("OSS_ACCESS_KEY_SECRET", "")


def _get_bucket() -> oss2.Bucket:
    if OSS_AUTH_MODE == "keys":
        if not OSS_ACCESS_KEY_ID or not OSS_ACCESS_KEY_SECRET:
            raise RuntimeError("OSS_ACCESS_KEY_ID/OSS_ACCESS_KEY_SECRET 未配置")
        auth = oss2.Auth(OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)
    else:
        auth = oss2.CredentialsProviderAuth(oss2.EcsRamRoleCredentialProvider())
    return oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET)


def _build_key(relative_path: str) -> str:
    rel = relative_path.lstrip("/")
    prefix = OSS_PREFIX.strip("/")
    if prefix:
        return f"{prefix}/{rel}"
    return rel


def upload_bytes(relative_path: str, data: bytes, content_type: str | None = None) -> None:
    if not OSS_ENABLED or not OSS_BUCKET or not OSS_ENDPOINT:
        return
    bucket = _get_bucket()
    key = _build_key(relative_path)
    headers = {}
    if content_type:
        headers["Content-Type"] = content_type
    bucket.put_object(key, data, headers=headers)


def sign_url(relative_path: str) -> str:
    if not OSS_ENABLED or not OSS_BUCKET or not OSS_ENDPOINT:
        return ""
    bucket = _get_bucket()
    key = _build_key(relative_path)
    return bucket.sign_url("GET", key, OSS_URL_EXPIRE)
