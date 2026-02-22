#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
懂车帝二手车 爬虫（列表页 + 详情页 car-archives 最终整合版）

- CDP 有头浏览器
- 列表页：发现 car_id / title / image / tags
- 详情页：解析 car-archives 档案（无字体反爬）
- 推荐分割线：上面爬，下面停
- 断点续爬：car_id 已存在直接跳过
"""

import json
import os
import random
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Callable
from urllib.parse import urljoin

import requests
from playwright.sync_api import sync_playwright

from app.db import get_session_by_target
from app.services.crawl_car_service import save_crawl_car
from app.storage.local import save_image_local

# =========================
# 配置区
# =========================

# 服务器环境下建议使用 Playwright 自己拉起浏览器
HEADLESS = False
BROWSER_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--no-sandbox",
    "--disable-setuid-sandbox",
]

BASE_URL = "https://www.dongchedi.com"
LIST_URL_TEMPLATE = (
    "https://www.dongchedi.com/usedcar/"
    "x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-{}-{}-x-x-x-x-x"
)

START_PAGE = 1
END_PAGE = 2
CITY_CODE = "110000"

SLEEP_PER_PAGE = (2.5, 4.0)
SLEEP_DETAIL = (1.2, 2.0)

DATA_DIR = Path(os.getenv("DATA_DIR", "data")).resolve()

CRAWL_DIR = DATA_DIR / "crawl"
JSON_DIR = CRAWL_DIR / "json"
IMG_DIR = CRAWL_DIR / "images"
DEFAULT_COOKIE_JSON = CRAWL_DIR / "cookies" / "dongchedi_storage_state.json"

JSON_DIR.mkdir(parents=True, exist_ok=True)
IMG_DIR.mkdir(parents=True, exist_ok=True)

# =========================
# 工具函数
# =========================

def normalize_img_url(url: str | None) -> str | None:
    if not url:
        return None
    if url.startswith("//"):
        return "https:" + url
    return url


# def download_image(url: str, save_path: Path):
#     url = normalize_img_url(url)
#     if not url:
#         return

#     headers = {
#         "User-Agent": "Mozilla/5.0",
#         "Referer": "https://www.dongchedi.com/",
#     }
#     r = requests.get(url, headers=headers, timeout=20)
#     r.raise_for_status()
#     save_path.write_bytes(r.content)


# =========================
# 推荐分割线判断
# =========================

def is_card_after_recommend(page, card):
    """
    判断 card 是否位于“为您推荐全国优质二手车”之后
    """
    return page.evaluate(
        """
        (card) => {
          const h1 = Array.from(document.querySelectorAll('h1'))
            .find(el => (el.innerText || '').includes('为您推荐全国优质二手车'));
          if (!h1) return false;
          return !!(h1.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING);
        }
        """,
        card
    )

def parse_price_block(page) -> dict:
    """
    解析价格区块：
    - 新车指导价
    - 比新车省
    - 计算优惠后价格
    """
    price = {
        "price_new_car": None,
        "price_discount": None,
        "price_after_discount": None,
        "price_unit": "万",
    }

    ps = page.locator("p").filter(
        has_text=re.compile("新车|比新车省|售价")
    )
    count = ps.count()

    for i in range(count):
        text = ps.nth(i).inner_text().strip()

        # 新车指导价：10.98万
        if "新车指导价" in text:
            m = re.search(r"([\d.]+)\s*万", text)
            if m:
                price["price_new_car"] = float(m.group(1))

        # 比新车省：7.20万
        elif "比新车省" in text or "省" in text:
            m = re.search(r"([\d.]+)\s*万", text)
            if m:
                price["price_discount"] = float(m.group(1))

        # 有些页面是：售价：3.78万
        elif "售价" in text or "价格" in text:
            m = re.search(r"([\d.]+)\s*万", text)
            if m:
                price["price_after_discount"] = float(m.group(1))

    # 如果没直接给成交价，就计算
    if (
        price["price_after_discount"] is None
        and price["price_new_car"] is not None
        and price["price_discount"] is not None
    ):
        price["price_after_discount"] = round(
            price["price_new_car"] - price["price_discount"], 2
        )

    return price


# =========================
# 详情页解析（核心）
# =========================

def parse_car_archives(page) -> dict:
    """
    解析详情页 car-archives 档案区
    """
    info = {}

    items = page.locator("div.car-archives_item__1Y2Vp")
    count = items.count()

    for i in range(count):
        item = items.nth(i)
        try:
            name = item.locator("p.car-archives_name__1QrJz").inner_text().strip()
            value = item.locator("p.car-archives_value__3YXEW").inner_text().strip()
            if name and value:
                info[name] = value
        except Exception:
            continue

    return info


# =========================
# 主流程
# =========================

def run(
    city_code: str,
    start_page: int,
    end_page: int,
    log_fn: Callable[[str], None] | None = None,
    save_to_db: bool = False,
    db_targets: list[str] | None = None,
    use_cookie_json: bool = False,
    cookie_json_path: str | None = None,
    should_stop: Callable[[], bool] | None = None,
):
    log = log_fn or (lambda msg: print(msg, flush=True))
    targets = db_targets or ["local"]
    db_sessions = []
    if save_to_db:
        for target in targets:
            db_sessions.append((target, get_session_by_target(target)))

    # 运行时再次确保目录存在（防止 data 被手动删除）
    JSON_DIR.mkdir(parents=True, exist_ok=True)
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    if db_sessions:
        log(f"[DB] 写入目标: {[t for t, _ in db_sessions]}")

    try:
        with sync_playwright() as p:
            log("[INFO] 启动 Playwright Chromium")
            browser = p.chromium.launch(headless=HEADLESS, args=BROWSER_ARGS)
            user_agent = (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
            cookie_path = Path(cookie_json_path).expanduser() if cookie_json_path else DEFAULT_COOKIE_JSON

            if use_cookie_json and cookie_path.exists():
                try:
                    raw_state = json.loads(cookie_path.read_text(encoding="utf-8"))
                    if isinstance(raw_state, dict) and isinstance(raw_state.get("cookies"), list):
                        context = browser.new_context(
                            user_agent=user_agent,
                            storage_state=str(cookie_path),
                        )
                        log(f"[COOKIE] 已加载 storage_state: {cookie_path}")
                    else:
                        context = browser.new_context(user_agent=user_agent)
                        cookies = raw_state if isinstance(raw_state, list) else []
                        if not cookies:
                            log(f"[COOKIE] 文件格式不支持，按无 cookie 继续: {cookie_path}")
                        else:
                            context.add_cookies(cookies)
                            log(f"[COOKIE] 已加载 cookies: {cookie_path}")
                except Exception as e:
                    log(f"[COOKIE] 读取失败，按无 cookie 继续: {cookie_path} ({e})")
                    context = browser.new_context(user_agent=user_agent)
            else:
                if use_cookie_json:
                    log(f"[COOKIE] 开关已开启，但文件不存在: {cookie_path}")
                context = browser.new_context(user_agent=user_agent)

            page = context.new_page()

            for page_no in range(start_page, end_page + 1):
                if should_stop and should_stop():
                    log("[TASK] canceled before page start")
                    break

                list_url = LIST_URL_TEMPLATE.format(city_code, page_no)
                log(f"\n[PAGE] {list_url}")

                page.goto(list_url, timeout=30000, wait_until="domcontentloaded")
                time.sleep(random.uniform(*SLEEP_PER_PAGE))

                cards = page.locator("a.usedcar-card_card__3vUrx")
                total = cards.count()
                log(f"[INFO] 本页发现卡片 {total}")

                scraped = 0
                skipped = 0

                for i in range(total):
                    if should_stop and should_stop():
                        log("[TASK] canceled during page")
                        break

                    card = cards.nth(i)

                    # 推荐分割线
                    try:
                        if is_card_after_recommend(page, card):
                            log("[STOP] 进入推荐区，停止本页")
                            break
                    except Exception:
                        pass

                    href = card.get_attribute("href")
                    if not href or not href.startswith("/usedcar/"):
                        continue

                    car_id = href.split("/")[-1]
                    json_path = JSON_DIR / f"{car_id}.json"

                    # 断点续爬
                    if json_path.exists():
                        skipped += 1
                        continue

                    title = card.locator("dt p").inner_text().strip()
                    img_url = card.locator("img").first.get_attribute("src")

                    tags = []
                    try:
                        tags = [
                            s.inner_text().strip()
                            for s in card.locator("dd").nth(1).locator("span").all()
                            if s.inner_text().strip()
                        ]
                    except Exception:
                        pass

                    # === 进入详情页 ===
                    detail_url = urljoin(BASE_URL, href)
                    page.goto(detail_url, timeout=30000, wait_until="domcontentloaded")
                    page.wait_for_load_state("domcontentloaded")
                    time.sleep(random.uniform(*SLEEP_DETAIL))

                    info = parse_car_archives(page)
                    price_info = parse_price_block(page)

                    # 🔥 把价格字段塞进 info
                    info.update({
                        "新车指导价": price_info.get("price_new_car"),
                        "比新车省": price_info.get("price_discount"),
                        "当前售价": price_info.get("price_after_discount"),
                        "价格单位": price_info.get("price_unit"),
                    })

                    image_path = None
                    data = {
                        "car_id": car_id,
                        "title": title,
                        "tags": tags,
                        "image_url": img_url,
                        "info": info,
                        **price_info,
                        "source_url": detail_url,
                        "crawl_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "image_path": image_path,
                        "page_no": page_no,
                    }

                    if img_url:
                        try:
                            img_url = normalize_img_url(img_url)
                            r = requests.get(img_url, headers={
                                "User-Agent": "Mozilla/5.0",
                                "Referer": "https://www.dongchedi.com/",
                            }, timeout=20)
                            r.raise_for_status()

                            image_path = save_image_local(
                                image_bytes=r.content,
                                filename=f"{car_id}.jpg",
                            )
                            data["image_path"] = image_path

                        except Exception as e:
                            log(f"[IMG FAIL] {car_id}: {e}")

                    # 写 JSON
                    json_path.write_text(
                        json.dumps(data, ensure_ascii=False, indent=2),
                        encoding="utf-8"
                    )

                    for _target, db in db_sessions:
                        save_crawl_car(db, data)

                    scraped += 1
                    log(f"[OK] {car_id} | {title}")

                    # 回到列表页（重要）
                    page.go_back(wait_until="domcontentloaded")
                    page.wait_for_load_state("domcontentloaded")
                    time.sleep(0.6)

                for _target, db in db_sessions:
                    db.commit()

                log(f"[SUMMARY] page={page_no} scraped={scraped} skipped={skipped}")

            log("\n[DONE] 全部完成")
            browser.close()
    except Exception:
        for _target, db in db_sessions:
            db.rollback()
        raise
    finally:
        for _target, db in db_sessions:
            db.close()


def main():
    run(CITY_CODE, START_PAGE, END_PAGE)


if __name__ == "__main__":
    main()
