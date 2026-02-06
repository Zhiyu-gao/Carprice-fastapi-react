import os
from pathlib import Path
from app.storage.oss import upload_bytes

DATA_DIR = Path(os.getenv("DATA_DIR", "data")).resolve()
IMAGE_DIR = DATA_DIR / "crawl" / "images"
IMAGE_DIR.mkdir(parents=True, exist_ok=True)
AVATAR_DIR = DATA_DIR / "avatars"
AVATAR_DIR.mkdir(parents=True, exist_ok=True)

def save_image_local(image_bytes: bytes, filename: str) -> str:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    path = IMAGE_DIR / filename
    path.write_bytes(image_bytes)
    rel = str(path.relative_to(DATA_DIR))
    upload_bytes(rel, image_bytes, content_type="image/jpeg")

    # 🔥 返回相对 DATA_DIR 的路径，数据库/JSON 更干净
    return rel


def save_avatar_local(image_bytes: bytes, filename: str) -> str:
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    path = AVATAR_DIR / filename
    path.write_bytes(image_bytes)
    rel = str(path.relative_to(DATA_DIR))
    upload_bytes(rel, image_bytes, content_type="image/jpeg")
    return rel
