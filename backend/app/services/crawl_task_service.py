import json
import os
import threading
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from app.spider.dongchedi.dongchedi_spider import run as run_spider

DATA_DIR = Path(os.getenv("DATA_DIR", "data")).resolve()
TASKS_DIR = DATA_DIR / "crawl"
TASKS_FILE = TASKS_DIR / "tasks.json"
LOG_DIR = DATA_DIR / "logs" / "crawl"

_lock = threading.Lock()
_cancel_flags: dict[str, threading.Event] = {}


def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _read_tasks() -> list[dict[str, Any]]:
    if not TASKS_FILE.exists():
        return []
    try:
        return json.loads(TASKS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def _write_tasks(tasks: list[dict[str, Any]]) -> None:
    TASKS_DIR.mkdir(parents=True, exist_ok=True)
    TASKS_FILE.write_text(
        json.dumps(tasks, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def list_tasks() -> list[dict[str, Any]]:
    with _lock:
        tasks = _read_tasks()
    return sorted(tasks, key=lambda t: t.get("created_at", ""), reverse=True)


def get_task(task_id: str) -> dict[str, Any] | None:
    with _lock:
        tasks = _read_tasks()
    for task in tasks:
        if task.get("id") == task_id:
            return task
    return None


def _update_task(task_id: str, **fields: Any) -> None:
    with _lock:
        tasks = _read_tasks()
        for task in tasks:
            if task.get("id") == task_id:
                task.update(fields)
                break
        _write_tasks(tasks)


def _task_logger(task_id: str, log_path: Path):
    def _log(msg: str) -> None:
        log_path.parent.mkdir(parents=True, exist_ok=True)
        line = f"[{_now()}] {msg}"
        with log_path.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
    return _log


def start_task(
    city_code: str,
    city_name: str,
    start_page: int,
    end_page: int,
) -> dict[str, Any]:
    task_id = uuid4().hex
    log_rel = f"logs/crawl/{task_id}.log"
    task = {
        "id": task_id,
        "name": f"懂车帝二手车 - {city_name}",
        "city_code": city_code,
        "city_name": city_name,
        "start_page": start_page,
        "end_page": end_page,
        "status": "running",
        "created_at": _now(),
        "updated_at": _now(),
        "log_path": log_rel,
        "log_url": f"/files/{log_rel}",
    }

    with _lock:
        tasks = _read_tasks()
        tasks.append(task)
        _write_tasks(tasks)

    log_path = DATA_DIR / log_rel
    log = _task_logger(task_id, log_path)
    cancel_event = threading.Event()
    _cancel_flags[task_id] = cancel_event

    def _runner():
        log("[TASK] start")
        try:
            run_spider(
                city_code=city_code,
                start_page=start_page,
                end_page=end_page,
                log_fn=log,
                save_to_db=True,
                should_stop=cancel_event.is_set,
            )
            status = "canceled" if cancel_event.is_set() else "success"
            _update_task(task_id, status=status, updated_at=_now())
            log(f"[TASK] {status}")
        except Exception as e:
            _update_task(task_id, status="failed", updated_at=_now(), error=str(e))
            log(f"[TASK] failed: {e}")
        finally:
            _cancel_flags.pop(task_id, None)

    thread = threading.Thread(target=_runner, daemon=True)
    thread.start()

    return task


def cancel_task(task_id: str) -> dict[str, Any] | None:
    task = get_task(task_id)
    if not task:
        return None
    if task.get("status") not in {"running"}:
        return task

    flag = _cancel_flags.get(task_id)
    if flag:
        flag.set()
    _update_task(task_id, status="canceled", updated_at=_now())
    return get_task(task_id)


def read_task_log(task_id: str, max_lines: int = 2000) -> str:
    task = get_task(task_id)
    if not task:
        return ""
    log_rel = task.get("log_path")
    if not log_rel:
        return ""
    log_path = DATA_DIR / log_rel
    if not log_path.exists():
        return ""

    content = log_path.read_text(encoding="utf-8", errors="ignore")
    lines = content.splitlines()
    if len(lines) > max_lines:
        lines = lines[-max_lines:]
    return "\n".join(lines)
