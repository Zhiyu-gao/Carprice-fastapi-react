from app.db import engine, Base

# ⚠️ 必须 import 模型，让它们注册到 Base.metadata
from app.models.crawl_car import CrawlCar
from app.models.user import User  # 如果你要 user 表，取消注释

if __name__ == "__main__":
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Done.")
