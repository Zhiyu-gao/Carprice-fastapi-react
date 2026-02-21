# Vehicle Intelligence Platform - Project Context

## 1. 项目定位

这是一个围绕“二手车数据采集、标注、建模预测、AI 问答与后台管理”的全栈工程，采用三服务架构：

- `frontend`：React + Vite + Ant Design（用户交互与管理界面）
- `backend`：FastAPI + SQLAlchemy + MySQL（业务 API、权限、爬虫任务、训练数据、预测）
- `ai_service`：FastAPI + 多模型客户端 + RAG + MCP（AI 会话、文档检索、工具增强）

目标形态是“车辆智能平台”，但代码中仍存在部分“房产/HousePrice”历史命名残留。

## 2. 目录与边界

- `/frontend`：前端应用，主路由、页面、API 客户端
- `/backend`：核心业务服务，用户体系、论坛、私信、爬虫任务、训练集、预测
- `/ai_service`：AI 服务，聊天会话、RAG 文档库、MCP 调用 backend
- `/nginx`：反向代理配置
- `/docker-compose.yml`：容器编排（nginx/mysql/redis/backend/ai_service/frontend）
- `/deploy.sh`：服务器一键部署脚本
- `/design-system`：UI/UX 设计稿页面（前端可通过 `/ui/*` 预览）

## 3. 运行架构（代码事实）

1. 用户通过前端访问业务页面。
2. 前端调用 `backend`（JWT 鉴权）完成注册登录、车辆数据管理、预测、论坛、私信等。
3. 前端调用 `ai_service`（同一 JWT）完成聊天、RAG、MCP 增强问答。
4. `ai_service` 在 MCP 模式下会回调 `backend` 查询爬虫任务/车辆信息。
5. `backend` 爬虫任务异步执行 Playwright 抓取懂车帝数据，写入 JSON + MySQL。

## 4. 后端（`/backend`）上下文

### 4.1 技术栈

- FastAPI
- SQLAlchemy + PyMySQL
- bcrypt + JWT（python-jose）
- Playwright（爬虫）
- scikit-learn（训练与预测）
- 可选 OSS（阿里云）

### 4.2 关键路由

- 认证：`/auth/register` `/auth/login` `/auth/email/code` `/auth/email/code-login` `/auth/password/reset`
- 当前用户：`/me` `/me/password`
- 爬虫任务：`/crawl-tasks`（启动、日志、取消、删除）
- 爬虫数据：`/crawl-cars`（分页、检索、详情、删除）
- 标注：`/annotations`、`/annotations/ids`
- 训练集：`/train-cars`
- 预测：`/predict`
- 管理员：`/admin/users` `/admin/overview` `/admin/metrics`（含封禁/解封）
- 论坛：`/forum/posts` + 评论
- 私信：`/chat/inbox` `/chat/{user_id}`
- 文件：`/files/*`（本地静态 + OSS 签名 URL）

### 4.3 核心数据模型

- `users`：用户、角色（buyer/seller/admin）、状态、头像
- `crawl_cars`：爬虫原始车源（`source_car_id` 唯一）
- `train_cars`：标注后训练样本
- `forum_posts` / `forum_comments`：论坛
- `direct_messages`：私聊消息

### 4.4 数据与任务流

1. 启动爬虫任务：`/crawl-tasks/start`
2. 任务服务开线程执行 spider，日志写入 `data/logs/crawl/*.log`
3. 每条车辆落地 `data/crawl/json/*.json`，并可写入 DB（local/cloud）
4. 标注接口把 `crawl_cars` 转成 `train_cars`
5. 预测接口加载 `car_price_model.pkl` 返回价格（万）

## 5. AI 服务（`/ai_service`）上下文

### 5.1 功能面

- 会话管理：创建/列出/删除会话
- 流式聊天：`/ai/chat/stream`（SSE）
- RAG：文件上传、切片、向量检索、文档管理
- MCP：基于问题规则调用 backend 查询任务/车辆

### 5.2 存储面

- `data/chat.db`：会话与消息（SQLite）
- `data/rag/rag.db`：文档与 chunk 元信息（SQLite）
- Qdrant：向量库（本地 path 或远程 URL）
- 上传文件目录：`data/rag/uploads`

### 5.3 认证

AI 服务不查用户库，直接用与 backend 一致的 `SECRET_KEY/ALGORITHM` 解 JWT，解析出 `user_id/email`。

## 6. 前端（`/frontend`）上下文

### 6.1 页面与路由

- 公共：`/landing`（登录/注册）
- 受保护主应用：`/intro` `/predict` `/visualization` `/ai_chat` `/crawler` `/metadata` `/forum` `/chat` `/account` `/author`
- 角色限制：
  - `/buyer`：`buyer` 或 `admin`
  - `/admin/monitor`、`/admin/users`：仅 `admin`
- UI 预览页（免登录）：`/ui/*`

### 6.2 API 访问

- `VITE_API_BASE_URL`：backend 基础地址
- `VITE_AI_BASE_URL`：ai_service 基础地址
- axios 请求拦截器自动注入 `Authorization: Bearer <token>`
- 响应 401 自动清 token 并跳转 `/login`

## 7. 部署与环境

### 7.1 本地启动（开发）

- backend：`uv sync && uv run uvicorn app.main:app --reload --port 8000`
- ai_service：`uv sync && uv run uvicorn app.main:app --port 8080`
- frontend：`npm install && npm run dev`

### 7.2 容器启动（生产/联调）

`docker-compose.yml` 包含：

- `nginx`（80/443）
- `mysql`（3306）
- `redis`（6379）
- `backend`（8000）
- `ai_service`（8080）
- `frontend`（容器内 Nginx，供主 nginx 反代）

## 8. 关键环境变量（最小集）

### backend

- `SECRET_KEY`, `ALGORITHM`
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB`
- 可选：`LOCAL_*` / `CLOUD_*` 双库配置
- 可选：`OSS_ENABLED`, `OSS_BUCKET`, `OSS_ENDPOINT`, `OSS_*`

### ai_service

- 模型：`KIMI_*`, `QWEN_*`, `DEEPSEEK_*`
- JWT：`SECRET_KEY`, `ALGORITHM`（必须与 backend 一致）
- RAG：`RAG_EMBEDDING_*`, `QDRANT_*`
- 可选：`BACKEND_API_BASE_URL`（MCP 回调 backend）

### frontend

- `VITE_API_BASE_URL`
- `VITE_AI_BASE_URL`

## 9. 当前已识别的不一致与技术债（基于仓库现状）

1. 业务语义混杂：多处文案仍写“买房/HousePrice”，但主体已是车辆平台。
2. AI 价格分析 schema/prompt 仍使用 `area_sqm/bedrooms` 等房产字段，而前端传递的是车辆字段（`brand/engine/...`）。
3. `backend/app/scripts/create_table.py` 引用了 `app.db` 中不存在的 `engine`，脚本当前不可直接运行。
4. Alembic 初始迁移文件内容为空（`pass`），数据库演进主要依赖脚本和运行期逻辑，迁移规范化不足。
5. backend `requires-python >=3.14`，对环境版本要求偏高，部署前需确认解释器可用。

## 10. 给新开发者的建议入口

1. 先通读：`README.md` + 本文档。
2. 从 `backend/app/main.py`、`ai_service/app/main.py`、`frontend/src/App.tsx` 入手理解边界。
3. 优先统一“车辆语义”字段与命名，再推进功能迭代。
4. 补齐可执行迁移链路（Alembic）与脚本健康检查，降低部署风险。
