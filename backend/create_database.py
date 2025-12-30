# create_database.py
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()  # 可从 .env 加载 MySQL 配置

MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_DB = os.getenv("MYSQL_DB", "vehicle_price_db")

def create_database():
    print(f"📦 尝试连接 MySQL: {MYSQL_USER}@{MYSQL_HOST}:{MYSQL_PORT}")

    try:
        conn = pymysql.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            port=MYSQL_PORT,
            charset="utf8mb4",
            autocommit=True,
        )
        print("✅ 已连接到 MySQL。")
    except Exception as e:
        print("❌ 无法连接到 MySQL，请检查用户名/密码/端口是否正确。")
        print(e)
        return

    cursor = conn.cursor()

    # 创建数据库
    try:
        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DB}` "
            f"DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        )
        print(f"🎉 数据库 `{MYSQL_DB}` 已创建或已存在。")
    except Exception as e:
        print("❌ 创建数据库失败：")
        print(e)
        return
    finally:
        cursor.close()
        conn.close()

    print("✨ 完成。")

if __name__ == "__main__":
    create_database()
