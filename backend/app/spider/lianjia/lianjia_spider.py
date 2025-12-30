#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
链家二手房爬虫（CDP + 真 Chrome + 人工验证兜底）
"""

import json
import random
from pathlib import Path
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

# ======================
# 配置
# ======================

START_URL = "https://sh.lianjia.com/ershoufang/pudong/"

BASE_DIR = Path(__file__).resolve().parent
OUT_DIR = BASE_DIR / "lianjia_json"
OUT_DIR.mkdir(exist_ok=True)

CDP_ENDPOINT = "http://localhost:9222"

# ======================
# 工具函数
# ======================

def now_str():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def safe_filename(text: str, max_len=80):
    if not text:
        return "unknown"
    return "".join(c for c in text if c.isalnum() or c in " _-").strip()[:max_len]

def human_scroll_to_bottom(page, step=300, delay=0.15):
    last_height = page.evaluate("document.body.scrollHeight")
    while True:
        page.evaluate(f"window.scrollBy(0, {step})")
        page.wait_for_timeout(int(delay * 1000))
        new_height = page.evaluate("document.body.scrollHeight")
        scroll_y = page.evaluate("window.scrollY + window.innerHeight")
        if scroll_y >= new_height - 10 or new_height == last_height:
            break
        last_height = new_height

def detect_human_verify(page) -> bool:
    """
    检测是否出现人机验证相关内容
    """
    keywords = ["人机验证", "安全验证", "请完成验证", "verify"]
    try:
        body_text = page.inner_text("body")
    except Exception:
        return False

    return any(k in body_text for k in keywords)

# ======================
# 解析函数
# ======================

def parse_vehicle(li):
    def text(selector):
        el = li.query_selector(selector)
        return el.inner_text().strip() if el else None

    vehicle_id = li.get_attribute("data-lj_action_housedel_id")

    title_el = li.query_selector(".title a")
    title = title_el.inner_text().strip() if title_el else None
    detail_url = title_el.get_attribute("href") if title_el else None

    community_el = li.query_selector(".positionInfo a")
    community_name = community_el.inner_text().strip() if community_el else None
    community_url = community_el.get_attribute("href") if community_el else None

    district_els = li.query_selector_all(".positionInfo a")
    district = district_els[1].inner_text().strip() if len(district_els) > 1 else None

    vehicle_info = text(".vehicleInfo") or ""
    parts = [p.strip() for p in vehicle_info.split("|")]

    layout = parts[0] if len(parts) > 0 else None

    area_sqm = None
    if len(parts) > 1 and "平米" in parts[1]:
        try:
            area_sqm = float(parts[1].replace("平米", ""))
        except ValueError:
            pass

    orientation = parts[2] if len(parts) > 2 else None
    decoration = parts[3] if len(parts) > 3 else None
    floor = parts[4] if len(parts) > 4 else None

    build_year = None
    if len(parts) > 5 and "年" in parts[5]:
        try:
            build_year = int(parts[5].replace("年", ""))
        except ValueError:
            pass

    building_type = parts[6] if len(parts) > 6 else None

    total_price_text = text(".totalPrice span")
    total_price_wan = float(total_price_text) if total_price_text else None
    total_price_yuan = int(total_price_wan * 10_000) if total_price_wan else None

    unit_price_text = text(".unitPrice span")
    unit_price = (
        int(unit_price_text.replace("元/平", "").replace(",", ""))
        if unit_price_text else None
    )

    follow_info = text(".followInfo") or ""
    follow_count = int(follow_info.split("人关注")[0]) if "人关注" in follow_info else 0

    tags = [t.inner_text().strip() for t in li.query_selector_all(".tag span")]

    img = li.query_selector("img.lj-lazy")
    cover_image = (
        img.get_attribute("data-original") or img.get_attribute("src")
        if img else None
    )

    return {
        "vehicle_id": vehicle_id,
        "title": title,
        "detail_url": detail_url,
        "community_name": community_name,
        "community_url": community_url,
        "district": district,
        "layout": layout,
        "area_sqm": area_sqm,
        "orientation": orientation,
        "decoration": decoration,
        "floor": floor,
        "build_year": build_year,
        "building_type": building_type,
        "total_price_wan": total_price_wan,
        "total_price_yuan": total_price_yuan,
        "unit_price": unit_price,
        "follow_count": follow_count,
        "tags": tags,
        "cover_image": cover_image,
        "crawl_time": now_str(),
    }

# ======================
# 主流程
# ======================

def main():
    print("🔌 连接真实 Chrome（CDP）…")

    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp(CDP_ENDPOINT)

        context = browser.contexts[0]
        page = context.new_page()

        page.goto(START_URL, wait_until="domcontentloaded", timeout=60000)

        page_num = 1

        while True:
            print(f"📄 第 {page_num} 页")

            # ---------- 人机验证检测 ----------
            if detect_human_verify(page):
                print("🧠 检测到人机验证，请手动处理（等待 60 秒）")
                page.wait_for_timeout(60_000)

            try:
                page.wait_for_selector("li.clear.LOGCLICKDATA", timeout=15000)
            except PlaywrightTimeoutError:
                print("⚠️ 页面加载失败，停止")
                break

            items = page.query_selector_all("li.clear.LOGCLICKDATA")
            for li in items:
                data = parse_vehicle(li)
                if not data["vehicle_id"]:
                    continue

                fname = f"{data['vehicle_id']}_{safe_filename(data['title'])}.json"
                out_path = OUT_DIR / fname
                if out_path.exists():
                    continue

                with open(out_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)

            # ---------- 翻页前行为 ----------
            human_scroll_to_bottom(page)
            page.wait_for_timeout(1000)

            next_btn = page.query_selector('a:has-text("下一页")')
            if not next_btn:
                print("✅ 已到最后一页")
                break

            cls = next_btn.get_attribute("class") or ""
            if "disabled" in cls:
                print("✅ 已到最后一页")
                break

            next_btn.click()
            page.wait_for_timeout(random.randint(2500, 4000))
            page_num += 1

        print(f"🎉 完成，数据在 {OUT_DIR}")

# ======================
# 入口
# ======================

if __name__ == "__main__":
    main()
