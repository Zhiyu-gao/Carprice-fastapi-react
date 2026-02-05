from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.crawl_task_service import (
    list_tasks,
    start_task,
    get_task,
    read_task_log,
    cancel_task,
)

router = APIRouter(prefix="/crawl-tasks", tags=["crawl"])


class StartTaskIn(BaseModel):
    city_code: str = Field(..., description="例如 110000")
    city_name: str = Field(..., description="例如 北京")
    start_page: int = 1
    end_page: int = 1


@router.get("")
def list_crawl_tasks():
    return list_tasks()


@router.post("/start")
def start_crawl_task(payload: StartTaskIn):
    if payload.start_page < 1 or payload.end_page < payload.start_page:
        raise HTTPException(status_code=400, detail="页码范围不合法")
    return start_task(
        city_code=payload.city_code,
        city_name=payload.city_name,
        start_page=payload.start_page,
        end_page=payload.end_page,
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
