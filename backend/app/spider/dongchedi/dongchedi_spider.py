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

import html
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
    "https://www.dongchedi.com/usedcar/x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-{}-{}-x-x-x-x-x"
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
DEFAULT_COOKIE_POOL_DIR = CRAWL_DIR / "cookie_pool"

JSON_DIR.mkdir(parents=True, exist_ok=True)
IMG_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_COOKIE_POOL_DIR.mkdir(parents=True, exist_ok=True)

# =========================
# 工具函数
# =========================


def normalize_img_url(url: str | None) -> str | None:
    if not url:
        return None
    url = html.unescape(url).strip()
    if not url or url.startswith("data:"):
        return None
    if url.startswith("//"):
        return "https:" + url
    return url


def _pick_srcset_url(srcset: str | None) -> str | None:
    if not srcset:
        return None
    candidates = []
    for item in html.unescape(srcset).split(","):
        parts = item.strip().split()
        if parts:
            candidates.append(parts[0])
    return normalize_img_url(candidates[-1]) if candidates else None


def extract_image_url_from_locator(locator) -> str | None:
    for attr in ("src", "data-src", "data-original", "data-url"):
        try:
            url = normalize_img_url(locator.get_attribute(attr))
            if url:
                return url
        except Exception:
            continue

    for attr in ("srcset", "data-srcset"):
        try:
            url = _pick_srcset_url(locator.get_attribute(attr))
            if url:
                return url
        except Exception:
            continue
    return None


def extract_page_image_url(page) -> str | None:
    urls = []
    try:
        imgs = page.locator("img")
        count = min(imgs.count(), 30)
    except Exception:
        return None

    for i in range(count):
        url = extract_image_url_from_locator(imgs.nth(i))
        if url:
            urls.append(url)

    for url in urls:
        if any(token in url for token in ("byteimg", "tos-cn", "motor.sh.item")):
            return url
    return urls[0] if urls else None


def _image_filename(car_id: str, url: str, content_type: str) -> str:
    ext = ".jpg"
    normalized_type = content_type.lower().split(";")[0].strip()
    if normalized_type == "image/png":
        ext = ".png"
    elif normalized_type == "image/webp":
        ext = ".webp"
    else:
        match = re.search(r"\.(jpe?g|png|webp)(?:[?#]|$)", url, flags=re.IGNORECASE)
        if match:
            suffix = match.group(1).lower()
            ext = ".jpg" if suffix in {"jpg", "jpeg"} else f".{suffix}"
    return f"{car_id}{ext}"


def download_image_bytes(url: str, referer: str) -> tuple[bytes, str, str]:
    normalized_url = normalize_img_url(url)
    if not normalized_url:
        raise ValueError("empty image url")

    r = requests.get(
        normalized_url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Referer": referer,
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
        timeout=20,
    )
    r.raise_for_status()
    if not r.content:
        raise ValueError("empty image body")
    content_type = r.headers.get("content-type", "image/jpeg")
    return r.content, normalized_url, content_type


PARAM_SECTION_TITLES = {
    "基本信息",
    "车身",
    "发动机",
    "变速箱",
    "底盘/转向",
    "车轮/制动",
    "主动安全",
    "被动安全",
    "辅助/操控配置",
    "外部配置",
    "内部配置",
    "舒适/防盗配置",
    "座椅配置",
    "智能互联",
    "影音娱乐",
    "灯光配置",
    "玻璃/后视镜",
    "空调/冰箱",
    "智能化配置",
}


def extract_params_url(page) -> str | None:
    try:
        links = page.locator("a[href*='/auto/params-carIds-']")
        if links.count() == 0:
            return None
        href = links.first.get_attribute("href")
    except Exception:
        return None
    return urljoin(BASE_URL, href) if href else None


def _parse_param_sections(raw_text: str) -> list[dict]:
    sections = []
    current = None
    pending_name = None

    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    for line in lines:
        if line in PARAM_SECTION_TITLES:
            if current and current["items"]:
                sections.append(current)
            current = {"title": line, "items": []}
            pending_name = None
            continue

        if not current:
            continue
        if line in {"搜索", "业务合作", "小程序", "登录", "+对比", "钉在左侧"}:
            continue
        if line.startswith("共 ") or line.startswith("隐藏相同参数"):
            continue

        if pending_name is None:
            pending_name = line
        else:
            current["items"].append({"name": pending_name, "value": line})
            pending_name = None

    if current and current["items"]:
        sections.append(current)
    return sections


def _html_to_text(markup: str) -> str:
    text = re.sub(r"<(script|style)\b[^>]*>.*?</\1>", "\n", markup, flags=re.DOTALL)
    text = re.sub(r"<[^>]+>", "\n", text)
    lines = [html.unescape(line).strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line)


def _fetch_params_static_text(context, params_url: str, referer: str) -> str | None:
    cookies = {cookie["name"]: cookie["value"] for cookie in context.cookies(params_url)}
    try:
        r = requests.get(
            params_url,
            cookies=cookies,
            headers={
                "User-Agent": "Mozilla/5.0",
                "Referer": referer,
            },
            timeout=20,
        )
        r.raise_for_status()
    except Exception:
        return None
    return _html_to_text(r.text)


def parse_vehicle_params_page(context, params_url: str, car_id: str, log) -> dict | None:
    params_page = context.new_page()
    try:
        params_page.goto(params_url, timeout=30000, wait_until="domcontentloaded")
        params_page.wait_for_load_state("domcontentloaded")
        time.sleep(random.uniform(0.8, 1.4))

        raw_text = params_page.locator("body").inner_text(timeout=15000)
        rows = params_page.evaluate(
            """
            () => Array.from(document.querySelectorAll('tr'))
              .map((row) => Array.from(row.querySelectorAll('th,td'))
                .map((cell) => (cell.innerText || '').trim())
                .filter(Boolean))
              .filter((row) => row.length > 1)
            """
        )
        param_car_id_match = re.search(r"params-carIds-(\d+)", params_url)
        raw_lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        sections = _parse_param_sections(raw_text)

        if len(raw_lines) < 10 or (not rows and not sections):
            static_text = _fetch_params_static_text(context, params_url, referer=BASE_URL)
            static_lines = [line.strip() for line in (static_text or "").splitlines() if line.strip()]
            if len(static_lines) > len(raw_lines):
                raw_text = static_text or raw_text
                raw_lines = static_lines
                sections = _parse_param_sections(raw_text)

        if len(raw_lines) < 10 or "/login-required" in params_page.url:
            log(f"[PARAM FAIL] {car_id}: 参数页需要有效 Cookie 或内容为空")
            return None

        return {
            "param_car_id": param_car_id_match.group(1) if param_car_id_match else None,
            "params_url": params_url,
            "source_car_id": car_id,
            "title": params_page.title(),
            "rows": rows,
            "sections": sections,
            "raw_lines": raw_lines,
            "raw_text": raw_text[:60000],
            "fetched_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
    except Exception as e:
        log(f"[PARAM FAIL] {car_id}: {e}")
        return None
    finally:
        params_page.close()


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
        card,
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

    ps = page.locator("p").filter(has_text=re.compile("新车|比新车省|售价"))
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
        price["price_after_discount"] = round(price["price_new_car"] - price["price_discount"], 2)

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


def _load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _has_local_image(path_value: str | None) -> bool:
    if not path_value or re.match(r"^https?://", path_value, flags=re.IGNORECASE):
        return False
    return (DATA_DIR / path_value.lstrip("/")).exists()


def _is_crawl_json_complete(path: Path) -> bool:
    try:
        data = _load_json(path)
    except Exception:
        return False
    return _has_local_image(data.get("image_path")) and isinstance(
        data.get("vehicle_params"),
        dict,
    )


def _is_cookie_state_file(path: Path) -> bool:
    try:
        raw = _load_json(path)
    except Exception:
        return False
    if isinstance(raw, dict) and isinstance(raw.get("cookies"), list):
        return True
    return isinstance(raw, list) and len(raw) > 0


def _choose_cookie_from_pool(pool_dir: Path) -> Path | None:
    if not pool_dir.exists():
        return None
    candidates = [
        path
        for path in pool_dir.glob("*.json")
        if path.is_file() and _is_cookie_state_file(path)
    ]
    if not candidates:
        return None
    return random.choice(sorted(candidates))


def _new_context_with_cookie_file(browser, user_agent: str, cookie_path: Path, log):
    raw_state = _load_json(cookie_path)
    if isinstance(raw_state, dict) and isinstance(raw_state.get("cookies"), list):
        context = browser.new_context(
            user_agent=user_agent,
            storage_state=str(cookie_path),
        )
        log(f"[COOKIE] 已加载 storage_state: {cookie_path}")
        return context

    context = browser.new_context(user_agent=user_agent)
    cookies = raw_state if isinstance(raw_state, list) else []
    if not cookies:
        log(f"[COOKIE] 文件格式不支持，按无 cookie 继续: {cookie_path}")
    else:
        context.add_cookies(cookies)
        log(f"[COOKIE] 已加载 cookies: {cookie_path}")
    return context


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
    headless: bool | None = None,
    use_cookie_pool: bool = False,
    cookie_pool_dir: str | None = None,
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
            actual_headless = HEADLESS if headless is None else headless
            log(f"[INFO] 启动 Playwright Chromium headless={actual_headless}")
            browser = p.chromium.launch(headless=actual_headless, args=BROWSER_ARGS)
            user_agent = (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
            cookie_path = (
                Path(cookie_json_path).expanduser() if cookie_json_path else DEFAULT_COOKIE_JSON
            )
            pool_dir = Path(cookie_pool_dir).expanduser() if cookie_pool_dir else DEFAULT_COOKIE_POOL_DIR

            selected_cookie_path = None
            if use_cookie_pool:
                selected_cookie_path = _choose_cookie_from_pool(pool_dir)
                if selected_cookie_path:
                    log(f"[COOKIE_POOL] 已选择 cookie: {selected_cookie_path.name}")
                else:
                    log(f"[COOKIE_POOL] 已启用，但目录中没有可用 cookie: {pool_dir}")

            if selected_cookie_path:
                try:
                    context = _new_context_with_cookie_file(
                        browser,
                        user_agent,
                        selected_cookie_path,
                        log,
                    )
                except Exception as e:
                    log(f"[COOKIE_POOL] 读取失败，按无 cookie 继续: {selected_cookie_path} ({e})")
                    context = browser.new_context(user_agent=user_agent)
            elif use_cookie_json and cookie_path.exists():
                try:
                    context = _new_context_with_cookie_file(browser, user_agent, cookie_path, log)
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

                    # 断点续爬：旧 JSON 没有本地图或参数页时允许重抓补齐
                    if json_path.exists() and _is_crawl_json_complete(json_path):
                        skipped += 1
                        continue

                    title = card.locator("dt p").inner_text().strip()
                    img_url = extract_image_url_from_locator(card.locator("img").first)

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
                    detail_img_url = extract_page_image_url(page)

                    params_url = extract_params_url(page)
                    vehicle_params = None
                    param_car_id = None
                    if params_url:
                        log(f"[PARAM] {car_id} -> {params_url}")
                        vehicle_params = parse_vehicle_params_page(context, params_url, car_id, log)
                        if vehicle_params:
                            param_car_id = vehicle_params.get("param_car_id")

                    # 🔥 把价格字段塞进 info
                    info.update(
                        {
                            "新车指导价": price_info.get("price_new_car"),
                            "比新车省": price_info.get("price_discount"),
                            "当前售价": price_info.get("price_after_discount"),
                            "价格单位": price_info.get("price_unit"),
                        }
                    )

                    image_path = None
                    image_candidates = []
                    for candidate in (img_url, detail_img_url):
                        normalized = normalize_img_url(candidate)
                        if normalized and normalized not in image_candidates:
                            image_candidates.append(normalized)

                    data = {
                        "car_id": car_id,
                        "title": title,
                        "tags": tags,
                        "image_url": image_candidates[0] if image_candidates else None,
                        "info": info,
                        **price_info,
                        "source_url": detail_url,
                        "params_url": params_url,
                        "param_car_id": param_car_id,
                        "vehicle_params": vehicle_params,
                        "crawl_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "image_path": image_path,
                        "page_no": page_no,
                    }

                    for candidate in image_candidates:
                        try:
                            image_bytes, saved_url, content_type = download_image_bytes(
                                candidate,
                                referer=detail_url,
                            )
                            image_path = save_image_local(
                                image_bytes=image_bytes,
                                filename=_image_filename(car_id, saved_url, content_type),
                                force_relative=True,
                                content_type=content_type,
                            )
                            data["image_url"] = saved_url
                            data["image_path"] = image_path
                            log(f"[IMG] {car_id} -> {image_path}")
                            break

                        except Exception as e:
                            log(f"[IMG FAIL] {car_id}: {candidate} ({e})")

                    # 写 JSON
                    json_path.write_text(
                        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
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
