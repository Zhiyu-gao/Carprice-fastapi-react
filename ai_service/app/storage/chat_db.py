import os
import sqlite3
from datetime import datetime
from pathlib import Path
from uuid import uuid4

DATA_DIR = Path(os.getenv("AI_DATA_DIR", "data")).resolve()
DB_PATH = DATA_DIR / "chat.db"
RowDict = dict[str, str]


def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _get_conn() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = _get_conn()
    try:
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS chat_sessions (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              title TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS chat_messages (
              id TEXT PRIMARY KEY,
              session_id TEXT NOT NULL,
              role TEXT NOT NULL,
              content TEXT NOT NULL,
              created_at TEXT NOT NULL,
              FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
            );
            """
        )
        conn.commit()
    finally:
        conn.close()


def create_session(user_id: str, title: str) -> RowDict:
    init_db()
    session_id = uuid4().hex
    now = _now()
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (session_id, user_id, title, now, now),
        )
        conn.commit()
    finally:
        conn.close()
    return {
        "id": session_id,
        "title": title,
        "created_at": now,
        "updated_at": now,
    }


def list_sessions(user_id: str) -> list[RowDict]:
    init_db()
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT id, title, created_at, updated_at FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC",
            (user_id,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_session(user_id: str, session_id: str) -> RowDict | None:
    init_db()
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT id, title, created_at, updated_at FROM chat_sessions WHERE user_id = ? AND id = ?",
            (user_id, session_id),
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def touch_session(user_id: str, session_id: str) -> None:
    init_db()
    conn = _get_conn()
    try:
        conn.execute(
            "UPDATE chat_sessions SET updated_at = ? WHERE user_id = ? AND id = ?",
            (_now(), user_id, session_id),
        )
        conn.commit()
    finally:
        conn.close()


def update_session_title(user_id: str, session_id: str, title: str) -> None:
    init_db()
    conn = _get_conn()
    try:
        conn.execute(
            "UPDATE chat_sessions SET title = ?, updated_at = ? WHERE user_id = ? AND id = ?",
            (title, _now(), user_id, session_id),
        )
        conn.commit()
    finally:
        conn.close()


def add_message(session_id: str, role: str, content: str) -> None:
    init_db()
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO chat_messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
            (uuid4().hex, session_id, role, content, _now()),
        )
        conn.commit()
    finally:
        conn.close()


def list_messages(user_id: str, session_id: str) -> list[RowDict]:
    init_db()
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT id FROM chat_sessions WHERE user_id = ? AND id = ?",
            (user_id, session_id),
        ).fetchone()
        if not row:
            return []
        rows = conn.execute(
            "SELECT id, role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def delete_session(user_id: str, session_id: str) -> None:
    init_db()
    conn = _get_conn()
    try:
        conn.execute(
            "DELETE FROM chat_sessions WHERE user_id = ? AND id = ?",
            (user_id, session_id),
        )
        conn.commit()
    finally:
        conn.close()
