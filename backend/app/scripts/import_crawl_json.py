import json
from pathlib import Path
from app.db import SessionLocal
from app.services.crawl_car_service import save_crawl_car


def import_json_folder(folder: str):
    db = SessionLocal()
    success = 0
    skipped = 0

    try:
        for path in Path(folder).rglob("*.json"):
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                ok = save_crawl_car(db, data)
                if ok:
                    success += 1
                else:
                    skipped += 1

            except Exception as e:
                print(f"[ERROR] {path}: {e}")

        db.commit()   # 🔥🔥🔥 关键就在这
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    print(f"✅ 成功插入 {success} 条，跳过 {skipped} 条")


if __name__ == "__main__":
    import_json_folder("/Users/zhiyu/Documents/Vehicle-Intelligence-Platform/backend/data/crawl/json")
