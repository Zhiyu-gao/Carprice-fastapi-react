import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.http import models as qm

DATA_DIR = Path(os.getenv("AI_DATA_DIR", "data")).resolve()
RAG_DIR = DATA_DIR / "rag"
DB_PATH = RAG_DIR / "rag.db"
UPLOAD_DIR = RAG_DIR / "uploads"
QDRANT_LOCAL_PATH = str(RAG_DIR / "qdrant")
QDRANT_URL = os.getenv("QDRANT_URL", "").strip()
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "").strip()
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "rag_chunks").strip() or "rag_chunks"

EMBED_BASE_URL = os.getenv("RAG_EMBEDDING_BASE_URL", os.getenv("QWEN_BASE_URL", "")).strip()
EMBED_API_KEY = os.getenv("RAG_EMBEDDING_API_KEY", os.getenv("QWEN_API_KEY", "")).strip()
EMBED_MODEL = os.getenv("RAG_EMBEDDING_MODEL", "text-embedding-v3").strip()


def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _get_conn() -> sqlite3.Connection:
    RAG_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _get_embed_client() -> OpenAI:
    if not EMBED_BASE_URL:
        raise RuntimeError("RAG_EMBEDDING_BASE_URL/QWEN_BASE_URL 未配置")
    if not EMBED_API_KEY:
        raise RuntimeError("RAG_EMBEDDING_API_KEY/QWEN_API_KEY 未配置")
    return OpenAI(base_url=EMBED_BASE_URL, api_key=EMBED_API_KEY)


def _get_qdrant_client() -> QdrantClient:
    if QDRANT_URL:
        return QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY or None)
    Path(QDRANT_LOCAL_PATH).mkdir(parents=True, exist_ok=True)
    return QdrantClient(path=QDRANT_LOCAL_PATH)


def _chunk_text(text: str, max_len: int = 800) -> list[str]:
    text = text.replace("\r\n", "\n")
    paras = [p.strip() for p in text.split("\n") if p.strip()]
    chunks: list[str] = []
    buf = ""
    for p in paras:
        if len(buf) + len(p) + 1 > max_len:
            if buf:
                chunks.append(buf.strip())
            buf = p
        else:
            buf = f"{buf}\n{p}" if buf else p
    if buf:
        chunks.append(buf.strip())
    return chunks


def _embed_texts(texts: list[str]) -> list[list[float]]:
    client = _get_embed_client()
    resp = client.embeddings.create(
        model=EMBED_MODEL,
        input=texts,
    )
    return [d.embedding for d in resp.data]


def _ensure_collection(vector_size: int) -> None:
    client = _get_qdrant_client()
    exists = client.collection_exists(QDRANT_COLLECTION)
    if exists:
        return
    client.create_collection(
        collection_name=QDRANT_COLLECTION,
        vectors_config=qm.VectorParams(
            size=vector_size,
            distance=qm.Distance.COSINE,
        ),
    )


def _reindex_from_sqlite() -> None:
    conn = _get_conn()
    try:
        rows = conn.execute(
            """
            SELECT rag_chunks.id, rag_chunks.doc_id, rag_chunks.content, rag_docs.filename
            FROM rag_chunks
            JOIN rag_docs ON rag_docs.id = rag_chunks.doc_id
            ORDER BY rag_docs.created_at ASC
            """
        ).fetchall()
    finally:
        conn.close()

    if not rows:
        return

    qdrant = _get_qdrant_client()
    batch_size = 64
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        texts = [str(r["content"]) for r in batch]
        vectors = _embed_texts(texts)
        _ensure_collection(len(vectors[0]))
        points = [
            qm.PointStruct(
                id=str(batch[j]["id"]),
                vector=vectors[j],
                payload={
                    "doc_id": str(batch[j]["doc_id"]),
                    "filename": str(batch[j]["filename"]),
                    "content": texts[j],
                },
            )
            for j in range(len(batch))
        ]
        qdrant.upsert(collection_name=QDRANT_COLLECTION, points=points, wait=True)


def init_db() -> None:
    conn = _get_conn()
    try:
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS rag_docs (
              id TEXT PRIMARY KEY,
              filename TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS rag_chunks (
              id TEXT PRIMARY KEY,
              doc_id TEXT NOT NULL,
              content TEXT NOT NULL,
              created_at TEXT NOT NULL,
              FOREIGN KEY(doc_id) REFERENCES rag_docs(id) ON DELETE CASCADE
            );
            """
        )
        conn.commit()
    finally:
        conn.close()


def save_document(filename: str, content: str) -> dict[str, Any]:
    init_db()
    doc_id = uuid4().hex
    chunks = _chunk_text(content)
    if not chunks:
        return {"id": doc_id, "filename": filename}

    vectors = _embed_texts(chunks)
    _ensure_collection(len(vectors[0]))
    qdrant = _get_qdrant_client()

    now = _now()
    point_ids: list[str] = []
    for _ in chunks:
        point_ids.append(uuid4().hex)

    points = [
        qm.PointStruct(
            id=point_ids[i],
            vector=vectors[i],
            payload={
                "doc_id": doc_id,
                "filename": filename,
                "content": chunks[i],
                "created_at": now,
            },
        )
        for i in range(len(chunks))
    ]
    qdrant.upsert(collection_name=QDRANT_COLLECTION, points=points, wait=True)

    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO rag_docs (id, filename, created_at) VALUES (?, ?, ?)",
            (doc_id, filename, now),
        )
        for i, chunk in enumerate(chunks):
            conn.execute(
                "INSERT INTO rag_chunks (id, doc_id, content, created_at) VALUES (?, ?, ?, ?)",
                (point_ids[i], doc_id, chunk, now),
            )
        conn.commit()
    finally:
        conn.close()
    return {"id": doc_id, "filename": filename}


def list_docs() -> list[dict[str, Any]]:
    init_db()
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT id, filename, created_at FROM rag_docs ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def delete_doc(doc_id: str) -> None:
    init_db()
    qdrant = _get_qdrant_client()
    if qdrant.collection_exists(QDRANT_COLLECTION):
        qdrant.delete(
            collection_name=QDRANT_COLLECTION,
            points_selector=qm.FilterSelector(
                filter=qm.Filter(
                    must=[qm.FieldCondition(key="doc_id", match=qm.MatchValue(value=doc_id))]
                )
            ),
            wait=True,
        )

    conn = _get_conn()
    try:
        conn.execute("DELETE FROM rag_docs WHERE id = ?", (doc_id,))
        conn.commit()
    finally:
        conn.close()


def retrieve(query: str, top_k: int = 5) -> list[dict[str, Any]]:
    init_db()
    query = (query or "").strip()
    if not query:
        return []

    q_vec = _embed_texts([query])[0]
    _ensure_collection(len(q_vec))
    qdrant = _get_qdrant_client()
    collection_info = qdrant.get_collection(QDRANT_COLLECTION)
    if (collection_info.points_count or 0) == 0:
        _reindex_from_sqlite()
    results = qdrant.search(
        collection_name=QDRANT_COLLECTION,
        query_vector=q_vec,
        limit=top_k,
        with_payload=True,
    )

    hits: list[dict[str, Any]] = []
    for r in results:
        payload = r.payload or {}
        content = str(payload.get("content") or "").strip()
        if not content:
            continue
        hits.append(
            {
                "content": content,
                "filename": str(payload.get("filename") or "unknown"),
                "score": float(r.score),
            }
        )
    return hits


def save_upload_file(filename: str, data: bytes) -> str:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    path = UPLOAD_DIR / filename
    path.write_bytes(data)
    return str(path)
