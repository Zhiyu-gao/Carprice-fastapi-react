#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
from pathlib import Path

# 设置JSON文件所在目录
JSON_DIR = Path("/Users/zhiyu/Documents/Vehicle-Intelligence-Platform/backend/app/spider/lianjia/lianjia_json")

def main():
    json_files = list(JSON_DIR.glob("*.json"))
    print(f"📂 发现 {len(json_files)} 个 JSON 文件")
    
    processed = 0
    skipped = 0
    
    for json_path in json_files:
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # 检查是否有"house_id"字段
            if "house_id" in data:
                # 将"house_id"重命名为"vehicle_id"
                data["vehicle_id"] = data.pop("house_id")
                
                # 重命名文件（如果文件名包含house_id）
                old_filename = json_path.name
                if "house_id" in old_filename:
                    new_filename = old_filename.replace("house_id", "vehicle_id")
                    new_path = json_path.parent / new_filename
                    
                    with open(new_path, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                    
                    # 删除旧文件
                    json_path.unlink()
                else:
                    # 如果文件名不包含house_id，直接覆盖原文件
                    with open(json_path, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                
                processed += 1
            else:
                # 如果没有"house_id"字段，检查是否已经有"vehicle_id"字段
                if "vehicle_id" in data:
                    print(f"✅ 已包含 vehicle_id，跳过：{json_path.name}")
                else:
                    print(f"⚠️ 既没有 house_id 也没有 vehicle_id，跳过：{json_path.name}")
                skipped += 1
                
        except Exception as e:
            print(f"❌ 处理失败 {json_path.name}: {e}")
            skipped += 1
    
    print("✅ 批量处理完成")
    print(f"   处理：{processed}")
    print(f"   跳过：{skipped}")

if __name__ == "__main__":
    main()