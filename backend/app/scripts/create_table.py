from app.db import Base, engine

# ⚠️ 必须 import 模型，让它们注册到 Base.metadata

if __name__ == "__main__":
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Done.")
