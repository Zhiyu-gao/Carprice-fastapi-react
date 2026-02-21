from fastapi import APIRouter, Query

from app.storage.oss import sign_url

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/oss-url")
def get_oss_url(path: str = Query(..., description="相对 data 的路径")):
    url = sign_url(path)
    return {"url": url}
