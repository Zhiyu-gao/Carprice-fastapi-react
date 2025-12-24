FROM python:3.11-slim

RUN pip install uv

WORKDIR /app
COPY . /app

RUN uv sync

EXPOSE 8080

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
