# app/database.py
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()  # 读取 .env


def _bool_env(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _db_from_env(prefix: str) -> dict[str, str]:
    return {
        "user": os.getenv(f"{prefix}_MYSQL_USER", ""),
        "password": os.getenv(f"{prefix}_MYSQL_PASSWORD", ""),
        "host": os.getenv(f"{prefix}_MYSQL_HOST", ""),
        "port": os.getenv(f"{prefix}_MYSQL_PORT", ""),
        "db": os.getenv(f"{prefix}_MYSQL_DB", ""),
    }


def _default_db_from_env() -> dict[str, str]:
    return {
        "user": os.getenv("MYSQL_USER", "root"),
        "password": os.getenv("MYSQL_PASSWORD", ""),
        "host": os.getenv("MYSQL_HOST", "127.0.0.1"),
        "port": os.getenv("MYSQL_PORT", "3306"),
        "db": os.getenv("MYSQL_DB", "vehicle_price_db"),
    }


def _normalize_target(target: str | None) -> str:
    t = (target or "local").strip().lower()
    if t in {"default", "local"}:
        return "local"
    if t == "cloud":
        return "cloud"
    raise ValueError(f"未知数据库目标: {target}")


def _resolve_db_conf(target: str) -> dict[str, str]:
    local_default = _default_db_from_env()

    if target == "local":
        local_override = _db_from_env("LOCAL")
        return {
            "user": local_override["user"] or local_default["user"],
            "password": local_override["password"] or local_default["password"],
            "host": local_override["host"] or local_default["host"],
            "port": local_override["port"] or local_default["port"],
            "db": local_override["db"] or local_default["db"],
        }

    cloud = _db_from_env("CLOUD")
    required = {"user", "host", "port", "db"}
    missing = [k for k, v in cloud.items() if k in required and not v]
    if missing:
        missing_fields = ", ".join(f"CLOUD_MYSQL_{k.upper()}" for k in missing)
        raise RuntimeError(f"云端数据库未完整配置: {missing_fields}")
    return cloud


def _build_db_url(conf: dict[str, str]) -> str:
    return (
        f"mysql+pymysql://{conf['user']}:{conf['password']}"
        f"@{conf['host']}:{conf['port']}/{conf['db']}"
    )


SQL_ECHO = _bool_env("SQL_ECHO", False)
_session_factories: dict[str, sessionmaker] = {}


def _get_session_factory(target: str) -> sessionmaker:
    t = _normalize_target(target)
    if t not in _session_factories:
        conf = _resolve_db_conf(t)
        engine = create_engine(
            _build_db_url(conf),
            echo=SQL_ECHO,
            future=True,
        )
        _session_factories[t] = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=engine,
        )
    return _session_factories[t]


SessionLocal = _get_session_factory("local")
Base = declarative_base()


def get_session_by_target(target: str):
    return _get_session_factory(target)()


def get_db():
    from sqlalchemy.orm import Session
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
