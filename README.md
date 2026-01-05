# 🏠 House Price Prediction & AI Analysis System

**React + FastAPI + MySQL + SQLAlchemy + Alembic + Machine Learning + AI Agent + LangGraph + Crawler**

一个**工程级、可扩展、前后端分离**的房价预测与智能分析系统，融合：

* 📊 **真实房源数据采集（链家爬虫）**
* 📈 **传统机器学习房价预测**
* 🤖 **多大模型 AI 分析（Kimi / Qwen / DeepSeek）**
* 🧠 **LangGraph 驱动的多步骤智能分析 Agent**
* 🧱 **微服务架构（Backend / AI Service 解耦）**

---

## ✨ 项目亮点（TL;DR）

* **不是 Demo**：JWT、CRUD、Alembic、MySQL、微服务齐全
* **不是假数据**：真实链家二手房爬虫
* **不是单模型**：传统 ML + 多大模型协同
* **不是简单 LLM 调用**：LangGraph 编排可解释分析流程
* **不是耦合架构**：业务后端 / AI 服务 / 爬虫完全解耦

---

## 🚀 系统整体架构

```text
┌────────────┐      ┌────────────┐
│  Frontend  │─────▶│  Backend   │─────▶ MySQL
│  (React)   │      │ (FastAPI)  │
└────────────┘      └─────┬──────┘
                           │
                           ▼
                  ┌────────────────┐
                  │   AI Service   │
                  │ (FastAPI +     │
                  │  LangGraph)    │
                  └────────────────┘
            ▲
            │
     ┌────────────┐
     │  Crawler   │
     │ (Lianjia)  │
     └────────────┘
```

---

## 🧩 功能模块概览

## 🔧 Backend（FastAPI · 端口 8000）

**职责：业务系统 + 数据管理 + ML 预测**

### 核心功能

* 房源 CRUD（增 / 删 / 改 / 查）
* 用户注册 / 登录（JWT）
* 传统机器学习房价预测（LinearRegression）
* 爬虫数据导入
* MySQL 持久化 + SQLAlchemy ORM
* Alembic 数据库迁移
* CORS 支持前端访问

### 主要接口

| Method | Path             | Description |
| ------ | ---------------- | ----------- |
| POST   | `/auth/register` | 用户注册        |
| POST   | `/auth/login`    | 登录（JWT）     |
| GET    | `/auth/me`       | 当前用户        |
| GET    | `/houses`        | 房源列表        |
| POST   | `/houses`        | 新建房源        |
| PUT    | `/houses/{id}`   | 更新房源        |
| DELETE | `/houses/{id}`   | 删除房源        |
| POST   | `/predict`       | ML 房价预测     |
| POST   | `/crawl/house`   | 导入爬虫房源      |

---

## 🤖 AI Service（FastAPI · 端口 8080）

**职责：AI 推理 & Agent 编排**

### 支持的大模型（OpenAI 兼容协议）

* **Kimi**
* **Qwen**
* **DeepSeek**

### 核心能力

* 房价 AI 分析（Markdown 输出）
* 多模型统一接口
* Prompt 集中管理
* LangGraph 驱动多步骤分析流程

### 核心接口

| Method | Path              | Description |
| ------ | ----------------- | ----------- |
| POST   | `/price-analysis` | 房价 AI 分析    |

**请求示例：**

```json
{
  "provider": "qwen",
  "features": {
    "area_sqm": 80,
    "bedrooms": 3,
    "age_years": 5,
  },
  "predicted_price": 450000
}
```

---

## 🧠 LangGraph 智能分析 Agent（实验性）

> 构建 **“可解释 · 多步骤 · 可扩展”** 的房价分析 Agent

分析流程示例：

1. 读取传统 ML 预测价格
2. 判断价格合理性
3. 风险分析（地段 / 年限 / 流动性）
4. 买卖建议生成
5. Markdown 报告输出

📌 可扩展方向：

* 多房源对比 Agent
* 投资回报率分析
* 自动生成投资报告

---

## 🕷 链家房源爬虫系统（Lianjia Spider）

**用于采集真实二手房数据**

### 特点

* 必须使用 **有头浏览器**
* Cookie 登录态复用
* 与业务系统完全解耦
* JSON 形式落盘

### 目录结构

```text
backend/app/spider/lianjia/
├── login_save_state.py     # 登录并保存 cookie
├── lianjia_spider.py       # 主爬虫
├── lianjia_state.json      # 登录态
└── lianjia_json/           # 爬取结果
```

### 使用步骤（重要）

**① 保存登录态**

```bash
cd backend
python app/spider/lianjia/login_save_state.py
```

**② 启动爬虫**

```bash
python -m app.spider.lianjia.lianjia_spider
```

---

## 💻 Frontend（React + Vite + Ant Design · 端口 5173）

### 功能页面

* 登录 / 注册（JWT）
* 房价预测（传统 ML）
* AI 分析（多模型）
* 房源管理（CRUD）
* 可视化图表
* 爬虫任务 & 数据标注页面

---

## 🧱 项目结构总览

```text
house-price/
├── backend/          # FastAPI + ML + DB + Spider
├── ai_service/       # AI Service + LangGraph
├── frontend/         # React 前端
├── docker-compose.yml
└── README.md
```

---

## ⚙️ 环境要求

* Python ≥ 3.11（强烈推荐 `uv`）
* Node.js ≥ 18
* MySQL ≥ 8.0
* Playwright（爬虫）

---

## 🐍 Backend 启动（8000）

```bash
cd backend
uv sync
uv run python create_database.py
uv run alembic upgrade head
uv run python -m app.scripts.import_crawl_json
uv run python -m app.train
uv run uvicorn app.main:app --reload --port 8000
```

---

## 🤖 AI Service 启动（8080）

```bash
cd ai_service
uv sync
uv run uvicorn app.main:app --port 8080
```

---

## 💻 Frontend 启动（5173）

```bash
cd frontend
npm install
npm run dev
```

---

## 🛠 FAQ（常见问题）

### ❓ uvicorn import 错误

```bash
uv run uvicorn app.main:app
```

### ❓ MySQL Unknown database

```bash
uv run python create_database.py
```

### ❓ Alembic 不生成迁移

```python
from app.db import Base
target_metadata = Base.metadata
```

---

## 📌 说明

> 本项目适合作为：

* 工程级全栈项目展示
* AI Agent / LangGraph 实验平台
* 房价分析 / 数据产品原型

---