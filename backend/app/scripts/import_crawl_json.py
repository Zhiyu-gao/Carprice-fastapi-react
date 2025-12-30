#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session

from app.db import SessionLocal, Base, engine
from app.models import CrawlVehicle

# 🔧 改成你的真实路径
CRAWL_FOLDER = Path("/Users/zhiyu/Documents/Vehicle-Intelligence-Platform/backend/app/spider/lianjia/lianjia_json")

def main():
    # 确保表存在
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    json_files = list(CRAWL_FOLDER.glob("*.json"))
    print(f"📂 发现 {len(json_files)} 个 JSON 文件")

    inserted = 0
    skipped = 0

    for json_path in json_files:
        try:
            data = json.loads(json_path.read_text(encoding="utf-8"))

            # 兼容house_id和vehicle_id字段
            vehicle_id = data.get("vehicle_id") or data.get("house_id")
            if not vehicle_id:
                print(f"⚠️ 缺少 vehicle_id/house_id，跳过：{json_path.name}")
                skipped += 1
                continue

            # 防止重复导入
            exists = (
                db.query(CrawlVehicle)
                .filter(CrawlVehicle.vehicle_id == vehicle_id)
                .first()
            )
            if exists:
                skipped += 1
                continue

            vehicle = CrawlVehicle(
                vehicle_id=vehicle_id,
                title=data.get("title"),
                area_sqm=data.get("area_sqm"),
                layout=data.get("layout"),
                build_year=data.get("build_year"),
                total_price_wan=data.get("total_price_wan"),
                unit_price=data.get("unit_price"),
                district=data.get("district"),
                crawl_time=datetime.strptime(
                    data["crawl_time"], "%Y-%m-%d %H:%M:%S"
                )
                if data.get("crawl_time")
                else None,
            )

            db.add(vehicle)
            inserted += 1

        except Exception as e:
            print(f"❌ 导入失败 {json_path.name}: {e}")
            skipped += 1

    db.commit()
    db.close()

    print("✅ 导入完成")
    print(f"   新增：{inserted}")
    print(f"   跳过：{skipped}")

if __name__ == "__main__":
    main()
