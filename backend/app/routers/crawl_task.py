from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.crawl_task_service import (
    cancel_task,
    delete_task,
    get_task,
    list_tasks,
    read_task_log,
    start_task,
)

router = APIRouter(prefix="/crawl-tasks", tags=["crawl"])


class StartTaskIn(BaseModel):
    city_code: str = Field(..., description="例如 110000")
    city_name: str = Field(..., description="例如 北京")
    start_page: int = 1
    end_page: int = 1
    write_local_db: bool = True
    write_cloud_db: bool = False
    use_cookie_json: bool = False
    cookie_json_path: str | None = None


@router.get("")
def list_crawl_tasks():
    return list_tasks()


@router.post("/start")
def start_crawl_task(payload: StartTaskIn):
    if payload.start_page < 1 or payload.end_page < payload.start_page:
        raise HTTPException(status_code=400, detail="页码范围不合法")
    if not payload.write_local_db and not payload.write_cloud_db:
        raise HTTPException(status_code=400, detail="至少选择一个数据库写入目标")
    return start_task(
        city_code=payload.city_code,
        city_name=payload.city_name,
        start_page=payload.start_page,
        end_page=payload.end_page,
        write_local_db=payload.write_local_db,
        write_cloud_db=payload.write_cloud_db,
        use_cookie_json=payload.use_cookie_json,
        cookie_json_path=payload.cookie_json_path,
    )


@router.get("/{task_id}")
def get_crawl_task(task_id: str):
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    return task


@router.get("/{task_id}/log")
def get_crawl_task_log(task_id: str):
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    return {"task_id": task_id, "log": read_task_log(task_id)}


@router.post("/{task_id}/cancel")
def cancel_crawl_task(task_id: str):
    task = cancel_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    return task


@router.delete("/{task_id}")
def delete_crawl_task(task_id: str):
    ok = delete_task(task_id)
    if not ok:
        raise HTTPException(status_code=404, detail="任务不存在")
    return {"ok": True}
