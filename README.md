# 🚗 Vehicle Intelligence Platform

**React + FastAPI + MySQL + SQLAlchemy + Playwright + ML + AI Service (Kimi/Qwen/DeepSeek) + RAG/MCP**

一个工程级的车辆智能平台，包含：爬虫采集、数据标注、训练集管理、价格预测、AI 多模型问答、系统管理与监控。

---

## ✨ 项目亮点

- **真实爬虫数据**：懂车帝二手车数据采集
- **标注 → 训练集**：标注完成的数据进入训练集 `train_cars`
- **AI 多模型**：Kimi / Qwen / DeepSeek 可切换
- **RAG / MCP**：支持上传文档检索 + MCP 工具调用
- **权限分级**：买房 / 卖房 / 管理员
- **管理后台**：用户管理、系统监控、资源统计

---

## 🧭 系统架构

```text
┌────────────┐      ┌────────────┐
│ Frontend   │─────▶│ Backend    │─────▶ MySQL
│ (React)    │      │ (FastAPI)  │
└────────────┘      └─────┬──────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ AI Service     │
                  │ (FastAPI)      │
                  └────────────────┘
                           ▲
                           │
                     ┌───────────┐
                     │ Crawler   │
                     │ (Playwright)
                     └───────────┘
```

---

## 🧩 功能模块

### ✅ Backend（FastAPI · 8000）

- 用户注册 / 登录（JWT）
- 角色权限（buyer / seller / admin）
- 爬虫任务管理
- 数据标注 + 训练集
- 车辆价格预测
- 管理员监控 & 用户管理

### ✅ AI Service（FastAPI · 8080）

- AI 聊天（可切换 Kimi/Qwen/DeepSeek）
- 对话历史存储
- RAG 文档上传检索
- MCP 工具调用（任务/车辆查询）

### ✅ Frontend（React · 5173）

- 登录 / 注册（支持角色选择）
- 爬虫任务管理
- 数据标注
- 训练集展示（买房角色可见）
- AI 聊天（多模型 + RAG + MCP）
- 系统监控 + 用户管理（管理员）

---

## 🔐 权限说明

| 角色 | 可见功能 |
|------|----------|
| buyer | 训练集（我要买房） |
| seller | 基础功能（爬虫/标注/预测等） |
| admin | 所有页面 + 系统监控 + 用户管理 |

> 管理员账号不能注册，用户名固定 `admin`。

---

## 🚀 启动方式

### 1）后端（backend）

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

### 2）AI 服务（ai_service）

```bash
cd ai_service
uv sync
uv run uvicorn app.main:app --port 8080
```

### 3）前端（frontend）

```bash
cd frontend
npm install
npm run dev
```

---

## ⚙️ 环境变量

### backend/.env
```
MYSQL_USER=...
MYSQL_PASSWORD=...
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DB=vehicle_price_db

SECRET_KEY=abc123
ALGORITHM=HS256
```

### ai_service/.env
```
KIMI_API_KEY=...
KIMI_BASE_URL=https://api.moonshot.cn/v1
KIMI_MODEL=kimi-k2-turbo-preview

QWEN_API_KEY=...
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-plus

DEEPSEEK_API_KEY=...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

SECRET_KEY=abc123
ALGORITHM=HS256
```

---

## 🕷 爬虫（Playwright）

入口脚本：
```
backend/app/spider/dongchedi/dongchedi_spider.py
```

运行方式：
```bash
cd backend
python -m app.spider.dongchedi.dongchedi_spider
```

---

## 🧪 训练集说明

- 标注数据写入：`train_cars`
- 买房角色可看到训练集页面
- 管理员可见所有

---

## 🛡 管理员账号创建

```bash
cd backend
python -m app.scripts.create_admin
```

---

## 📎 数据库迁移（示例）

如果需要新增字段：

```sql
ALTER TABLE users ADD COLUMN username VARCHAR(64);
ALTER TABLE users ADD COLUMN role VARCHAR(16) NOT NULL DEFAULT 'buyer';
```

---

## 📂 项目结构

```text
Vehicle-Intelligence-Platform/
├── backend/           # FastAPI + MySQL + Playwright
├── ai_service/        # AI Service + RAG + MCP
├── frontend/          # React + Ant Design
├── docker-compose.yml
└── README.md
```

---

## ✅ 维护建议

- ai_service 与 backend 的 `SECRET_KEY` 必须一致
- 不建议混用不同项目的 `.venv`
- API Key 请勿提交到 Git
