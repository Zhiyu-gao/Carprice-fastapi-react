import os
import re
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

DATA_DIR = Path(os.getenv("AI_DATA_DIR", "data")).resolve()
RAG_DIR = DATA_DIR / "rag"
DB_PATH = RAG_DIR / "rag.db"
UPLOAD_DIR = RAG_DIR / "uploads"


def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _get_conn() -> sqlite3.Connection:
    RAG_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


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


def _tokenize(text: str) -> list[str]:
    parts = re.split(r"[^a-zA-Z0-9\u4e00-\u9fa5]+", text.lower())
    return [p for p in parts if len(p) >= 2]


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


def save_document(filename: str, content: str) -> dict[str, Any]:
    init_db()
    doc_id = uuid4().hex
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO rag_docs (id, filename, created_at) VALUES (?, ?, ?)",
            (doc_id, filename, _now()),
        )
        chunks = _chunk_text(content)
        now = _now()
        for chunk in chunks:
            conn.execute(
                "INSERT INTO rag_chunks (id, doc_id, content, created_at) VALUES (?, ?, ?, ?)",
                (uuid4().hex, doc_id, chunk, now),
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
    conn = _get_conn()
    try:
        conn.execute("DELETE FROM rag_docs WHERE id = ?", (doc_id,))
        conn.commit()
    finally:
        conn.close()


def retrieve(query: str, top_k: int = 5) -> list[dict[str, Any]]:
    init_db()
    q_tokens = _tokenize(query)
    if not q_tokens:
        return []

    conn = _get_conn()
    try:
        rows = conn.execute(
            """
            SELECT rag_chunks.content AS content, rag_docs.filename AS filename
            FROM rag_chunks
            JOIN rag_docs ON rag_docs.id = rag_chunks.doc_id
            """
        ).fetchall()
    finally:
        conn.close()

    scored = []
    for r in rows:
        content = r["content"]
        tokens = _tokenize(content)
        score = 0
        for t in q_tokens:
            score += tokens.count(t)
        if score > 0:
            scored.append({"content": content, "filename": r["filename"], "score": score})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]


def save_upload_file(filename: str, data: bytes) -> str:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    path = UPLOAD_DIR / filename
    path.write_bytes(data)
    return str(path)
