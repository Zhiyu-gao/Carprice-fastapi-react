from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.security.jwt import get_current_user_from_jwt
from app.storage.rag_store import delete_doc, list_docs, retrieve, save_document, save_upload_file

router = APIRouter()


class RagSearchRequest(BaseModel):
    query: str


def _read_text_from_upload(file: UploadFile) -> tuple[str, bytes]:
    name = file.filename or "upload"
    suffix = name.lower().rsplit(".", 1)[-1] if "." in name else ""

    data = file.file.read()
    if not data:
        return "", b""

    if suffix in {"txt", "md"}:
        return data.decode("utf-8", errors="ignore"), data

    if suffix == "pdf":
        try:
            from pypdf import PdfReader
        except ImportError as exc:
            raise HTTPException(status_code=400, detail=f"PDF 解析库不可用: {exc}")
        reader = PdfReader(BytesIO(data))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages), data

    if suffix in {"docx", "doc"}:
        try:
            from docx import Document
        except ImportError as exc:
            raise HTTPException(status_code=400, detail=f"Word 解析库不可用: {exc}")
        doc = Document(BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs if p.text), data

    raise HTTPException(status_code=400, detail="不支持的文件类型")


@router.post("/ai/rag/upload")
def upload_rag_file(
    file: UploadFile = File(...),
    user: dict[str, int | str | None] = Depends(get_current_user_from_jwt),
):
    _ = user
    filename = file.filename or "upload"
    content, raw = _read_text_from_upload(file)
    if not content.strip():
        raise HTTPException(status_code=400, detail="文件内容为空")

    upload_path = save_upload_file(filename, raw)
    return save_document(filename, content, upload_path=upload_path)


@router.get("/ai/rag/docs")
def get_rag_docs(user: dict[str, int | str | None] = Depends(get_current_user_from_jwt)):
    _ = user
    return list_docs()


@router.delete("/ai/rag/docs/{doc_id}")
def delete_rag_doc(
    doc_id: str,
    user: dict[str, int | str | None] = Depends(get_current_user_from_jwt),
):
    _ = user
    delete_doc(doc_id)
    return {"ok": True}


@router.post("/ai/rag/search")
def search_rag(
    body: RagSearchRequest,
    user: dict[str, int | str | None] = Depends(get_current_user_from_jwt),
):
    _ = user
    return retrieve(body.query)
