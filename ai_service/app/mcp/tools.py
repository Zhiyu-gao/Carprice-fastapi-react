import os
from typing import Any
import httpx

BACKEND_API_BASE = os.getenv("BACKEND_API_BASE_URL", "http://127.0.0.1:8000")


def _get(url: str) -> Any:
    with httpx.Client(timeout=10) as client:
        r = client.get(url)
        r.raise_for_status()
        return r.json()


def tool_latest_tasks() -> str:
    try:
        data = _get(f"{BACKEND_API_BASE}/crawl-tasks")
        if not data:
            return "暂无爬虫任务。"
        lines = []
        for t in data[:5]:
            lines.append(f"- {t.get('name')} | {t.get('status')} | {t.get('updated_at')}")
        return "最近任务：\n" + "\n".join(lines)
    except Exception as e:
        return f"获取任务失败: {e}"


def tool_find_cars(keyword: str) -> str:
    try:
        data = _get(f"{BACKEND_API_BASE}/crawl-cars?page=1&page_size=200")
        items = data.get("items") or []
        matches = [c for c in items if keyword in (c.get("title") or "")]
        if not matches:
            return f"未找到包含 '{keyword}' 的车辆。"
        lines = []
        for c in matches[:5]:
            lines.append(f"- {c.get('car_id')}: {c.get('title')}")
        return "匹配车辆：\n" + "\n".join(lines)
    except Exception as e:
        return f"查询车辆失败: {e}"


def tool_car_detail(source_id: str) -> str:
    try:
        data = _get(f"{BACKEND_API_BASE}/crawl-cars/{source_id}")
        title = data.get("title") or ""
        info = data.get("info") or {}
        key_info = []
        for k in ["上牌时间", "表显里程", "当前售价", "新车指导价", "比新车省"]:
            if k in info:
                key_info.append(f"{k}:{info[k]}")
        detail = ", ".join(key_info) if key_info else "暂无详细信息"
        return f"车辆 {source_id}：{title}。{detail}"
    except Exception as e:
        return f"获取车辆详情失败: {e}"


def run_mcp_tools(question: str) -> str:
    q = (question or "").strip()
    if not q:
        return ""

    # 简单规则路由
    if "爬虫任务" in q or "任务" in q:
        return tool_latest_tasks()

    import re
    m = re.search(r"\b\d{6,}\b", q)
    if m:
        return tool_car_detail(m.group(0))

    if "查" in q or "搜索" in q or "找" in q:
        keyword = q.replace("搜索", "").replace("查", "").replace("找", "").strip()
        if keyword:
            return tool_find_cars(keyword)

    return ""
