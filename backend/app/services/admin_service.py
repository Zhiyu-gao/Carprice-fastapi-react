from sqlalchemy.orm import Session
import psutil

from app import models


def list_users(db: Session, *, page: int, page_size: int):
    q = db.query(models.User)
    total = q.count()
    items = (
        q.order_by(models.User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def set_user_active(db: Session, *, user_id: int, active: int) -> bool:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return False
    user.is_active = active
    db.commit()
    return True


def overview(db: Session):
    total_users = db.query(models.User).count()
    active_users = db.query(models.User).filter(models.User.is_active == 1).count()
    banned_users = db.query(models.User).filter(models.User.is_active == 0).count()
    total_crawl = db.query(models.CrawlCar).count()
    total_train = db.query(models.TrainCar).count()
    return {
        "total_users": total_users,
        "active_users": active_users,
        "banned_users": banned_users,
        "total_crawl": total_crawl,
        "total_train": total_train,
    }


def metrics():
    cpu = psutil.cpu_percent(interval=0.2)
    vm = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    return {
        "cpu_percent": cpu,
        "memory_percent": vm.percent,
        "memory_total_gb": round(vm.total / 1024 ** 3, 2),
        "memory_used_gb": round(vm.used / 1024 ** 3, 2),
        "disk_percent": disk.percent,
        "disk_total_gb": round(disk.total / 1024 ** 3, 2),
        "disk_used_gb": round(disk.used / 1024 ** 3, 2),
    }
