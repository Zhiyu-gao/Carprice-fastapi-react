import os
import re
from typing import Any

import httpx

BACKEND_API_BASE = os.getenv("BACKEND_API_BASE_URL", "http://127.0.0.1:8000")
TIMEOUT_SECONDS = 10


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

    lines = [f"- {task.get('name')} | {task.get('status')} | {task.get('updated_at')}" for task in data[:5]]
    return "最近任务：\n" + "\n".join(lines)


def tool_find_cars(keyword: str) -> str:
    try:
        data = _get(f"{BACKEND_API_BASE}/crawl-cars?page=1&page_size=200")
    except httpx.HTTPError as exc:
        return f"查询车辆失败: {exc}"

    items = data.get("items") or []
    matches = [car for car in items if keyword in (car.get("title") or "")]
    if not matches:
        return f"未找到包含 '{keyword}' 的车辆。"

    lines = [f"- {car.get('car_id')}: {car.get('title')}" for car in matches[:5]]
    return "匹配车辆：\n" + "\n".join(lines)


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

    if "查" in q or "搜索" in q or "找" in q:
        keyword = q.replace("搜索", "").replace("查", "").replace("找", "").strip()
        if keyword:
            return tool_find_cars(keyword)

    return ""
