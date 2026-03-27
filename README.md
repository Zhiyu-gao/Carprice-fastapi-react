# 二手车智能平台

一个面向二手车业务的全栈项目，覆盖数据采集、标注训练、价格预测、AI 问答、论坛私信、大屏分析，以及网页端和移动端的统一展示。

## 项目简介

这个仓库目前包含 4 个核心应用：

- `frontend/`：网页端，负责首页、预测、论坛、管理等主业务页面
- `mobile2/`：移动端，基于 Expo Router，可跑 Web 预览，也可用于手机端开发
- `backend/`：主业务后端，基于 FastAPI，负责认证、预测、论坛、私信、训练集等接口
- `ai_service/`：AI 服务，负责聊天、检索增强、模型路由等能力

同时项目还包含：

- `nginx/`：反向代理、HTTPS、网页端/移动端路由转发
- `remotion/`：宣传视频与页面演示视频生成
- `observability/`：Prometheus、Grafana 等观测配置
- `docker-compose.yml`：整套服务的容器化部署

## 技术栈

- 前端网页：React 19、Vite、Ant Design、ECharts/Recharts
- 移动端：Expo Router、React Native Web
- 主后端：FastAPI、SQLAlchemy、Alembic、MySQL、Redis
- AI 服务：FastAPI、Qdrant、多模型接入
- 部署与运维：Docker Compose、Nginx、Prometheus、Grafana

## 目录结构

```text
.
├── frontend/                 # 网页端
├── mobile2/                  # 移动端
├── backend/                  # 主业务后端
├── ai_service/               # AI 服务
├── remotion/                 # 视频生成
├── nginx/                    # Nginx 配置与证书挂载目录
├── observability/            # Prometheus / Grafana
├── docker-compose.yml        # 完整部署
├── docker-compose.infra.yml  # 仅基础设施
├── deploy.sh                 # 服务器更新脚本
└── README.md
```

## 环境要求

- Python 3.11+
- [uv](https://docs.astral.sh/uv/)
- Node.js 20+
- npm
- Docker 与 Docker Compose

## 本地开发

### 1. 安装依赖

```bash
# backend
cd /Users/zhiyu/Documents/Carprice-fastapi-react/backend
uv sync --group dev

# ai_service
cd /Users/zhiyu/Documents/Carprice-fastapi-react/ai_service
uv sync --group dev

# frontend
cd /Users/zhiyu/Documents/Carprice-fastapi-react/frontend
npm install

# mobile2
cd /Users/zhiyu/Documents/Carprice-fastapi-react/mobile2
npm install

# remotion
cd /Users/zhiyu/Documents/Carprice-fastapi-react/remotion
npm install
```

### 2. 启动基础依赖（可选但推荐）

```bash
cd /Users/zhiyu/Documents/Carprice-fastapi-react
docker compose -f docker-compose.infra.yml up -d
```

### 3. 启动后端

```bash
cd /Users/zhiyu/Documents/Carprice-fastapi-react/backend
uv run uvicorn app.main:app --reload --port 8000
```

### 4. 启动 AI 服务

```bash
cd /Users/zhiyu/Documents/Carprice-fastapi-react/ai_service
uv run uvicorn app.main:app --reload --port 8080
```

### 5. 启动网页端

```bash
cd /Users/zhiyu/Documents/Carprice-fastapi-react/frontend
npm run dev
```

默认地址一般为：

- 网页端：`http://localhost:5173`
- 后端：`http://127.0.0.1:8000`
- AI 服务：`http://127.0.0.1:8080`

### 6. 启动移动端

```bash
cd /Users/zhiyu/Documents/Carprice-fastapi-react/mobile2
npm start
```

常用命令：

- Web 预览：`npm run web`
- iOS 模拟器：`npm run ios`
- Android：`npm run android`

如果你想让手机或 Expo Web 正常访问后端，请在 `mobile2/.env` 中配置：

```env
# 线上环境示例
EXPO_PUBLIC_API_BASE_URL=https://www.nrydawang.shop/api
EXPO_PUBLIC_AI_BASE_URL=https://www.nrydawang.shop/ai
```

本地真机调试时，不要写 `127.0.0.1`，应改成你电脑的局域网 IP。

### 7. 启动 Remotion

```bash
cd /Users/zhiyu/Documents/Carprice-fastapi-react/remotion
npm run studio:compat
```

渲染视频：

```bash
cd /Users/zhiyu/Documents/Carprice-fastapi-react/remotion
npm run render:compat -- VehicleIntroCN out/video.mp4
```

## Docker 部署

### 本地或服务器整套启动

```bash
cd /Users/zhiyu/Documents/Carprice-fastapi-react
docker compose up -d --build
```

### 使用部署脚本

```bash
cd /Users/zhiyu/Documents/Carprice-fastapi-react
bash deploy.sh
```

`deploy.sh` 默认会使用根目录下的 `docker-compose.yml`。

## 域名与 Nginx 说明

当前线上反向代理配置在：

- `nginx/conf.d/default.conf`

它负责：

- `https://www.nrydawang.shop/` 指向网页端
- `/api/` 转发到 `backend`
- `/ai/` 转发到 `ai_service`
- `/mobile/` 转发到移动端 Web
- `/public/preview/video` 等公共资源转发到后端

如果你要更换域名或证书，需要同步修改：

- `server_name`
- 证书路径
- 对应安全组/防火墙的 `80/443` 端口

## 常用命令

### 质量检查

```bash
cd /Users/zhiyu/Documents/Carprice-fastapi-react
make format
make check
```

### 单独检查前端类型

```bash
cd /Users/zhiyu/Documents/Carprice-fastapi-react/frontend
npm run typecheck
```

### 单独检查移动端类型

```bash
cd /Users/zhiyu/Documents/Carprice-fastapi-react/mobile2
npm run typecheck
```

### 检查后端是否可导入

```bash
cd /Users/zhiyu/Documents/Carprice-fastapi-react/backend
uv run python -c "import app.main; print('backend import ok')"
```

## 已知关键配置

### 后端 CORS

后端在 `backend/app/main.py` 中已限制为：

- `nrydawang.shop` / `www.nrydawang.shop`
- 本机开发地址：`localhost`、`127.0.0.1`
- 常见移动端 Web 端口：`5173`、`8081`、`19006`、`4173`
- 局域网私网地址段：`10.x.x.x`、`192.168.x.x`、`172.16-31.x.x`

这样可以兼顾本地开发、手机调试和线上域名，但不会像之前那样完全放开所有来源。

### 预览视频

后端接口：

- `/public/preview/video`

默认会读取：

- `remotion/out/video.mp4`

如果按钮能点开但视频 404，优先检查这个文件是否存在。

## 常见问题

### 1. 网页能登录，移动端不能登录

优先检查这几项：

- `mobile2/.env` 是否把接口写成了 `https://www.nrydawang.shop/api`
- 是否误写成了裸域名 `https://www.nrydawang.shop`
- 本地真机调试时是否用了 `127.0.0.1`
- 后端是否已重启，让最新 CORS 配置生效

### 2. 启动后端时报 `backend/data does not exist`

项目现在会在启动时自动创建 `backend/data`，如果仍有问题，确认运行的是最新代码。

### 3. HTTPS 打不开

优先检查：

- `nginx/conf.d/default.conf`
- `nginx/cert` 下证书是否存在
- Docker 中的 `vehicle_nginx` 是否正常启动
- 宿主机是否有别的 Nginx 占用了 `80/443`

### 4. Remotion 渲染失败

如果出现 `The service was stopped` 之类的问题，先执行：

```bash
cd /Users/zhiyu/Documents/Carprice-fastapi-react/remotion
npm install
npm run studio:compat
```

本仓库已经补了兼容脚本，优先使用 `*:compat` 命令。

## 提交与部署建议

推荐流程：

1. 本地完成改动并自测
2. `git status` 确认提交内容
3. `git add -A && git commit -m "feat: xxx"`
4. `git push origin main`
5. 服务器执行 `git pull && bash deploy.sh`

如果线上使用的是 Docker Compose，这套流程就可以完成大部分发布。
