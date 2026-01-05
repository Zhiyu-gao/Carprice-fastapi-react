import os
from pathlib import Path

DATA_DIR = Path(os.getenv("DATA_DIR", "data")).resolve()
IMAGE_DIR = DATA_DIR / "crawl" / "images"
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

def save_image_local(image_bytes: bytes, filename: str) -> str:
    path = IMAGE_DIR / filename
    path.write_bytes(image_bytes)

    # 🔥 返回相对 DATA_DIR 的路径，数据库/JSON 更干净
    return str(path.relative_to(DATA_DIR))
