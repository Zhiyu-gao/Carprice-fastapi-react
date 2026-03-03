import os
import re
from typing import Any

import httpx

BACKEND_API_BASE = os.getenv("BACKEND_API_BASE_URL", "http://127.0.0.1:8000")
TIMEOUT_SECONDS = 10
MAX_QUERY_SIZE = 200

COMMON_BRANDS = [
    "特斯拉",
    "比亚迪",
    "大众",
    "丰田",
    "本田",
    "宝马",
    "奔驰",
    "奥迪",
    "理想",
    "蔚来",
    "小鹏",
    "问界",
    "极氪",
    "福特",
    "日产",
]


def _get(url: str) -> Any:
    with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
        resp = client.get(url)
        resp.raise_for_status()
        return resp.json()


def tool_latest_tasks() -> str:
    try:
        data = _get(f"{BACKEND_API_BASE}/crawl-tasks")
    except httpx.HTTPError as exc:
        return f"获取任务失败: {exc}"

    if not data:
        return "暂无爬虫任务。"

    lines = [
        f"- {task.get('name')} | {task.get('status')} | {task.get('updated_at')}"
        for task in data[:5]
    ]
    return "最近任务：\n" + "\n".join(lines)


def tool_find_cars(keyword: str) -> str:
    try:
        data = _get(f"{BACKEND_API_BASE}/crawl-cars?page=1&page_size={MAX_QUERY_SIZE}&keyword={keyword}")
    except httpx.HTTPError as exc:
        return f"查询车辆失败: {exc}"

    items = data.get("items") or []
    matches = [car for car in items if keyword in (car.get("title") or "")]
    if not matches:
        return f"未找到包含 '{keyword}' 的车辆。"

    lines = [f"- {car.get('car_id')}: {car.get('title')}" for car in matches[:8]]
    return f"数据库匹配车辆（关键词: {keyword}）：\n" + "\n".join(lines)


def _parse_price_wan(info: dict[str, Any]) -> float | None:
    raw = info.get("当前售价")
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return float(raw)
    text = str(raw).strip()
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    if not match:
        return None
    return float(match.group(1))


def _extract_keyword(question: str) -> str:
    q = (question or "").strip()
    if not q:
        return ""

    for brand in COMMON_BRANDS:
        if brand in q:
            return brand

    cleaned = q
    for token in [
        "数据库中",
        "数据库",
        "二手车",
        "价格",
        "均价",
        "多少钱",
        "多少",
        "查询下",
        "查询",
        "查一下",
        "查下",
        "查",
        "搜索",
        "找一下",
        "找",
        "的",
        "？",
        "?",
    ]:
        cleaned = cleaned.replace(token, " ")

    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if not cleaned:
        return ""
    return cleaned.split(" ")[0]


def tool_car_price_summary(keyword: str) -> str:
    try:
        data = _get(f"{BACKEND_API_BASE}/crawl-cars?page=1&page_size={MAX_QUERY_SIZE}&keyword={keyword}")
    except httpx.HTTPError as exc:
        return f"查询车辆价格失败: {exc}"

    items = data.get("items") or []
    matches = [car for car in items if keyword in (car.get("title") or "")]
    if not matches:
        return f"未找到包含 '{keyword}' 的车辆。"

    priced: list[tuple[str, str, float]] = []
    for car in matches:
        info = car.get("info") if isinstance(car.get("info"), dict) else {}
        price_wan = _parse_price_wan(info)
        if price_wan is None:
            continue
        priced.append((str(car.get("car_id") or ""), str(car.get("title") or ""), price_wan))

    if not priced:
        return f"找到 {len(matches)} 条 '{keyword}' 车辆，但没有可解析的“当前售价”字段。"

    prices = [p[2] for p in priced]
    avg_price = sum(prices) / len(prices)
    min_price = min(prices)
    max_price = max(prices)
    top_lines = [
        f"- {cid}: {title} | {price:.2f}万"
        for cid, title, price in priced[:8]
    ]
    return (
        f"已查询数据库，关键词“{keyword}”共匹配 {len(matches)} 条，"
        f"其中 {len(priced)} 条有价格。\n"
        f"价格统计（单位：万）：均价 {avg_price:.2f}，最低 {min_price:.2f}，最高 {max_price:.2f}。\n"
        f"样例记录：\n" + "\n".join(top_lines)
    )


def tool_car_detail(source_id: str) -> str:
    try:
        data = _get(f"{BACKEND_API_BASE}/crawl-cars/{source_id}")
    except httpx.HTTPError as exc:
        return f"获取车辆详情失败: {exc}"

    title = data.get("title") or ""
    info = data.get("info") or {}
    key_info: list[str] = []
    for key in ["上牌时间", "表显里程", "当前售价", "新车指导价", "比新车省"]:
        if key in info:
            key_info.append(f"{key}:{info[key]}")
    detail = ", ".join(key_info) if key_info else "暂无详细信息"
    return f"车辆 {source_id}：{title}。{detail}"


def run_mcp_tools(question: str) -> str:
    q = (question or "").strip()
    if not q:
        return ""

    if "爬虫任务" in q or "任务" in q:
        return tool_latest_tasks()

    match = re.search(r"\b\d{6,}\b", q)
    if match:
        return tool_car_detail(match.group(0))

    if any(k in q for k in ["价格", "均价", "多少钱"]):
        keyword = _extract_keyword(q)
        if keyword:
            return tool_car_price_summary(keyword)

    if "查" in q or "搜索" in q or "找" in q or "查询" in q:
        keyword = _extract_keyword(q)
        if keyword:
            return tool_find_cars(keyword)

    return ""
