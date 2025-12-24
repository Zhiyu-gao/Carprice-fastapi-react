FROM python:3.11-slim

# 安装 uv（你项目必需）
RUN pip install uv

WORKDIR /app

COPY . /app

# 默认使用 uv 自动安装依赖
RUN uv sync

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
