from getpass import getpass

from app.core.security import get_password_hash
from app.db import SessionLocal
from app.models.user import User


def main():
    db = SessionLocal()
    try:
        exists = db.query(User).filter(User.username == "admin").first()
        if exists:
            print("admin 已存在")
            return

        email = input("admin 邮箱: ").strip()
        if not email:
            print("邮箱不能为空")
            return
        password = getpass("admin 密码: ").strip()
        if not password:
            print("密码不能为空")
            return

        user = User(
            email=email,
            username="admin",
            role="admin",
            full_name="管理员",
            hashed_password=get_password_hash(password),
            is_active=1,
        )
        db.add(user)
        db.commit()
        print("admin 创建成功")
    finally:
        db.close()


if __name__ == "__main__":
    main()
