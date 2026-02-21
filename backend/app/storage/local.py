import os
from pathlib import Path

from app.storage.oss import is_oss_ready, object_url, sign_url, upload_bytes

DATA_DIR = Path(os.getenv("DATA_DIR", "data")).resolve()
IMAGE_DIR = DATA_DIR / "crawl" / "images"
IMAGE_DIR.mkdir(parents=True, exist_ok=True)
AVATAR_DIR = DATA_DIR / "avatars"
AVATAR_DIR.mkdir(parents=True, exist_ok=True)


def _resolve_storage_ref(relative_path: str) -> str:
    """
    FILE_URL_MODE:
    - relative: 返回相对路径（兼容旧逻辑）
    - oss_public: 返回 OSS 公网 URL
    - oss_signed: 返回 OSS 临时签名 URL
    - auto: OSS 可用时返回公网 URL，否则返回相对路径
    """
    mode = os.getenv("FILE_URL_MODE", "auto").strip().lower()

    if mode == "relative":
        return relative_path
    if mode == "oss_signed":
        return sign_url(relative_path) or relative_path
    if mode == "oss_public":
        return object_url(relative_path) or relative_path
    if mode == "auto" and is_oss_ready():
        return object_url(relative_path) or relative_path
    return relative_path

def save_image_local(image_bytes: bytes, filename: str) -> str:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    path = IMAGE_DIR / filename
    path.write_bytes(image_bytes)
    rel = str(path.relative_to(DATA_DIR))
    upload_bytes(rel, image_bytes, content_type="image/jpeg")

    return _resolve_storage_ref(rel)


def save_avatar_local(image_bytes: bytes, filename: str) -> str:
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    path = AVATAR_DIR / filename
    path.write_bytes(image_bytes)
    rel = str(path.relative_to(DATA_DIR))
    upload_bytes(rel, image_bytes, content_type="image/jpeg")
    return _resolve_storage_ref(rel)
