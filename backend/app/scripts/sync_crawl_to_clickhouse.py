import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

from app.db import get_session_by_target
from app.models.crawl_car import CrawlCar

DEFAULT_CH_URL = "http://127.0.0.1:8123"
DEFAULT_DB = "crawl"
STATE_DIR = Path(__file__).resolve().parents[2] / "data" / "etl"
STATE_FILE = STATE_DIR / "clickhouse_crawl_last_id.txt"


def _env(name: str, default: str) -> str:
    val = os.getenv(name)
    return val.strip() if val and val.strip() else default


def _build_ch_url(base: str, query: str) -> str:
    user = _env("CLICKHOUSE_USER", "default")
    password = _env("CLICKHOUSE_PASSWORD", "")
    parsed = urllib.parse.urlsplit(base)
    params = {
        "query": query,
        "user": user,
    }
    if password:
        params["password"] = password
    new_query = urllib.parse.urlencode(params)
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path or "/", new_query, ""))


def _ch_exec(base: str, sql: str, data: bytes | None = None) -> None:
    url = _build_ch_url(base, sql)
    req = urllib.request.Request(url, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        resp.read()


def _ensure_db_and_table(ch_url: str, db: str) -> None:
    _ch_exec(ch_url, f"CREATE DATABASE IF NOT EXISTS {db}")
    _ch_exec(
        ch_url,
        f"""
        CREATE TABLE IF NOT EXISTS {db}.crawl_cars (
          source_car_id String,
          title String,
          source_url String,
          image_url String,
          image_path String,
          tags String,
          info String,
          page_no Int32,
          crawl_time DateTime,
          is_annotated UInt8,
          updated_at DateTime
        )
        ENGINE = ReplacingMergeTree(updated_at)
        ORDER BY source_car_id
        """.strip(),
    )


def _read_last_id() -> int:
    try:
        return int(STATE_FILE.read_text().strip())
    except Exception:
        return 0


def _write_last_id(last_id: int) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(str(last_id))


def _row_to_json(row: CrawlCar) -> dict:
    def _dump_json(val) -> str:
        if val is None:
            return ""
        return json.dumps(val, ensure_ascii=True, separators=(",", ":"))

    crawl_time = row.crawl_time or datetime.utcnow()
    return {
        "source_car_id": row.source_car_id or "",
        "title": row.title or "",
        "source_url": row.source_url or "",
        "image_url": row.image_url or "",
        "image_path": row.image_path or "",
        "tags": _dump_json(row.tags),
        "info": _dump_json(row.info),
        "page_no": int(row.page_no or 0),
        "crawl_time": crawl_time.strftime("%Y-%m-%d %H:%M:%S"),
        "is_annotated": int(row.is_annotated or 0),
        "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
    }


def sync(full: bool, chunk_size: int) -> None:
    ch_url = _env("CLICKHOUSE_URL", DEFAULT_CH_URL)
    db = _env("CLICKHOUSE_DB", DEFAULT_DB)
    _ensure_db_and_table(ch_url, db)

    since_id = 0 if full else _read_last_id()

    session = get_session_by_target("local")
    try:
        q = session.query(CrawlCar)
        if since_id > 0:
            q = q.filter(CrawlCar.id > since_id)
        q = q.order_by(CrawlCar.id.asc())

        last_id = since_id
        buffer: list[dict] = []

        for row in q:
            buffer.append(_row_to_json(row))
            last_id = max(last_id, int(row.id))
            if len(buffer) >= chunk_size:
                _flush(ch_url, db, buffer)
                buffer.clear()

        if buffer:
            _flush(ch_url, db, buffer)

        if last_id > since_id:
            _write_last_id(last_id)

    finally:
        session.close()


def _flush(ch_url: str, db: str, rows: list[dict]) -> None:
    payload = "\n".join(json.dumps(r, ensure_ascii=True) for r in rows).encode("utf-8")
    sql = f"INSERT INTO {db}.crawl_cars FORMAT JSONEachRow"
    _ch_exec(ch_url, sql, data=payload)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Sync crawl_cars from MySQL to ClickHouse")
    parser.add_argument("--full", action="store_true", help="Sync all rows (ignore last_id state)")
    parser.add_argument("--chunk-size", type=int, default=500)
    args = parser.parse_args(argv)

    sync(full=args.full, chunk_size=max(1, args.chunk_size))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
