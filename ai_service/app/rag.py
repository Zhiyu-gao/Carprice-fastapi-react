from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from io import BytesIO
from app.security.jwt import get_current_user_from_jwt
from app.storage.rag_store import save_document, list_docs, delete_doc, retrieve, save_upload_file

router = APIRouter()


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
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDF 解析库不可用: {e}")
        reader = PdfReader(BytesIO(data))
        pages = [p.extract_text() or "" for p in reader.pages]
        return "\n".join(pages), data

    if suffix in {"docx", "doc"}:
        try:
            from docx import Document
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Word 解析库不可用: {e}")
        # python-docx 不支持 .doc，先按 docx 尝试
        doc = Document(BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs if p.text), data

    raise HTTPException(status_code=400, detail="不支持的文件类型")


@router.post("/ai/rag/upload")
def upload_rag_file(
    file: UploadFile = File(...),
    user=Depends(get_current_user_from_jwt),
):
    content, raw = _read_text_from_upload(file)
    if not content.strip():
        raise HTTPException(status_code=400, detail="文件内容为空")

    # 保存原文件（可选）
    save_upload_file(file.filename or "upload", raw)
    doc = save_document(file.filename or "upload", content)
    return doc


@router.get("/ai/rag/docs")
def get_rag_docs(
    user=Depends(get_current_user_from_jwt),
):
    return list_docs()


@router.delete("/ai/rag/docs/{doc_id}")
def delete_rag_doc(
    doc_id: str,
    user=Depends(get_current_user_from_jwt),
):
    delete_doc(doc_id)
    return {"ok": True}


@router.post("/ai/rag/search")
def search_rag(
    query: dict,
    user=Depends(get_current_user_from_jwt),
):
    q = (query or {}).get("query", "")
    return retrieve(q)
