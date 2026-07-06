import json
import os
import random
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any


DATA_DIR = Path(os.getenv("DATA_DIR", "data")).resolve()
DEFAULT_COOKIE_POOL_DIR = DATA_DIR / "crawl" / "cookie_pool"
EXPIRED_DIR_NAME = "_expired"


def resolve_cookie_pool_dir(raw_dir: str | None = None) -> Path:
    pool_dir = Path(raw_dir).expanduser() if raw_dir else DEFAULT_COOKIE_POOL_DIR
    pool_dir.mkdir(parents=True, exist_ok=True)
    return pool_dir


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def is_cookie_state_file(path: Path) -> bool:
    try:
        raw = _load_json(path)
    except Exception:
        return False
    if isinstance(raw, dict) and isinstance(raw.get("cookies"), list):
        return True
    return isinstance(raw, list) and len(raw) > 0


def _cookie_files(directory: Path) -> list[Path]:
    if not directory.exists():
        return []
    return sorted(
        path
        for path in directory.glob("*.json")
        if path.is_file()
    )


def list_active_cookie_files(pool_dir: str | Path | None = None) -> list[Path]:
    resolved = resolve_cookie_pool_dir(str(pool_dir) if pool_dir else None)
    return [path for path in _cookie_files(resolved) if is_cookie_state_file(path)]


def list_expired_cookie_files(pool_dir: str | Path | None = None) -> list[Path]:
    resolved = resolve_cookie_pool_dir(str(pool_dir) if pool_dir else None)
    expired_dir = resolved / EXPIRED_DIR_NAME
    return [path for path in _cookie_files(expired_dir) if is_cookie_state_file(path)]


def choose_cookie_from_pool(
    pool_dir: str | Path | None = None,
    exclude_names: set[str] | None = None,
) -> Path | None:
    excluded = exclude_names or set()
    candidates = [
        path
        for path in list_active_cookie_files(pool_dir)
        if path.name not in excluded
    ]
    if not candidates:
        return None
    return random.choice(candidates)


def mark_cookie_expired(cookie_path: str | Path, reason: str | None = None) -> Path | None:
    source = Path(cookie_path)
    if not source.exists() or not source.is_file():
        return None

    expired_dir = source.parent / EXPIRED_DIR_NAME
    expired_dir.mkdir(parents=True, exist_ok=True)

    target = expired_dir / source.name
    if target.exists():
        suffix = datetime.now().strftime("%Y%m%d_%H%M%S")
        target = expired_dir / f"{source.stem}_{suffix}{source.suffix}"

    shutil.move(str(source), str(target))
    if reason:
        meta = {
            "source": source.name,
            "expired_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "reason": reason,
        }
        target.with_suffix(target.suffix + ".expired.json").write_text(
            json.dumps(meta, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    return target


def get_cookie_pool_stats(pool_dir: str | None = None) -> dict[str, Any]:
    resolved = resolve_cookie_pool_dir(pool_dir)
    expired_dir = resolved / EXPIRED_DIR_NAME
    active_files = list_active_cookie_files(resolved)
    expired_files = list_expired_cookie_files(resolved)
    root_json_files = _cookie_files(resolved)
    expired_json_files = _cookie_files(expired_dir)

    invalid_active = [
        path.name
        for path in root_json_files
        if not is_cookie_state_file(path)
    ]
    invalid_expired = [
        path.name
        for path in expired_json_files
        if not is_cookie_state_file(path)
        and not path.name.endswith(".expired.json")
    ]

    return {
        "pool_dir": str(resolved),
        "active_count": len(active_files),
        "expired_count": len(expired_files),
        "total_count": len(active_files) + len(expired_files),
        "invalid_count": len(invalid_active) + len(invalid_expired),
        "active_files": [path.name for path in active_files],
        "expired_files": [path.name for path in expired_files],
        "invalid_files": invalid_active + invalid_expired,
    }
