# 二手车智能平台

一个面向二手车业务的全栈项目，覆盖懂车帝二手车数据采集、车辆价格标注、价格预测、AI 问答、购买意向、论坛私信、后台管理和大屏展示。

## 项目组成

- `frontend/`：React + Vite 网页端，包含预测、AI 助手、爬虫任务、价格标注、买车、论坛和管理后台。
- `backend/`：FastAPI 主业务后端，负责认证、车辆数据、标注训练、爬虫任务、文件访问、购买意向等接口。
- `ai_service/`：FastAPI AI 服务，负责聊天、价格分析、MCP 工具调用和数据库问答。
- `mobile2/`：Expo Router 移动端。
- `remotion/`：宣传视频与页面演示视频生成。
- `nginx/`：线上反向代理、HTTPS、网页端/移动端路由转发。
- `observability/`：Prometheus、Grafana 等观测配置。

## 技术栈

- 网页端：React 19、Vite、Ant Design、ECharts/Recharts
- 移动端：Expo Router、React Native Web
- 主后端：FastAPI、SQLAlchemy、Alembic、MySQL、MongoDB、Redis
- 爬虫：Playwright、Cookie 池、可切换有头/无头浏览器
- AI 服务：FastAPI、OpenAI 兼容接口、MCP 工具
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
├── docker-compose.infra.yml  # 仅基础设施：MySQL / Redis / MongoDB / Qdrant 等
├── deploy.sh                 # 服务器更新脚本
└── README.md
```

## 环境要求

- Python 3.11+
- [uv](https://docs.astral.sh/uv/)
- Node.js 20+
- npm
- Docker 与 Docker Compose
- Playwright Chromium

## 本地快速启动

以下命令默认在仓库根目录执行。当前本地开发常用地址：

- 网页端：`http://127.0.0.1:5173`
- 后端：`http://127.0.0.1:8000`
- AI 服务：`http://127.0.0.1:8080`

### 1. 安装依赖

```bash
cd backend
uv sync --group dev
uv run playwright install chromium

cd ../ai_service
uv sync --group dev

cd ../frontend
npm install
```

移动端和 Remotion 需要时再安装：

```bash
cd mobile2
npm install

cd ../remotion
npm install
```

### 2. 启动基础设施

推荐使用 Docker 启动 MySQL、Redis、MongoDB、Qdrant 等基础服务：

```bash
docker compose -f docker-compose.infra.yml up -d
```

如果本机已经单独安装 MySQL、Redis 或 MongoDB，也可以直接使用本机服务。后端默认读取 `backend/.env`，可以参考 `backend/.env.example`。

### 3. 启动后端

```bash
cd backend
uv run python create_database.py
uv run alembic upgrade head
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

开发时想自动重载可以使用：

```bash
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 4. 启动 AI 服务

```bash
cd ai_service
uv run uvicorn app.main:app --host 127.0.0.1 --port 8080
```

### 5. 启动网页端

```bash
cd frontend
npm run dev
```

## 数据库说明

项目现在同时使用 MySQL、MongoDB 和 Redis：

- MySQL：存用户、车辆主数据、标注、论坛、私信、爬虫任务等结构化业务表。
- MongoDB：存购买意向、爬虫原始数据、懂车帝参数页这类字段不固定的数据。
- Redis：用于分布式锁，避免并发买车或并发爬同一辆车时重复写入。

### DBeaver 连接

MySQL 默认配置：

- Host：`127.0.0.1`
- Port：`3306`
- Database：`vehicle_intelligence_db`
- Username：看 `backend/.env` 中的 `DB_USER`
- Password：看 `backend/.env` 中的 `DB_PASSWORD`

MongoDB 默认配置：

- Host：`127.0.0.1`
- Port：`27017`
- Database：`vehicle_intelligence`
- URL：`mongodb://127.0.0.1:27017`

MongoDB 常用集合：

- `purchase_intents`：买车意向
- `crawl_raw_cars`：爬虫原始车辆数据
- `vehicle_params`：懂车帝参数页动态字段

## 爬虫功能

网页端进入“爬虫任务”页面即可创建任务。当前支持：

- 城市、起始页、结束页配置
- 写入数据库目标配置
- 有头/无头浏览器开关，对应 Playwright 的 `headless=false/true`
- Cookie 池开关
- 任务日志、取消任务、查看任务状态

### 图片抓取

爬虫会从列表页和详情页尽量提取真实图片地址，支持：

- `src`
- `srcset`
- `data-src`
- `data-original`
- 字节跳动签名图片 URL

图片会先下载到本地：

```text
backend/data/crawl/images/
```

数据库中的 `image_path` 会保存为相对路径，例如：

```text
crawl/images/23029159.jpg
```

前端标注页会通过后端 `/files/...` 访问本地图片。如果本地图片打不开，会尝试回退到原始 `image_url`。

### 参数页抓取

懂车帝详情页中类似：

```html
<a href="/auto/params-carIds-40149">查看更多参数</a>
```

会被爬虫识别并访问，例如：

```text
https://www.dongchedi.com/auto/params-carIds-40149
```

因为参数页字段不固定，不会强行写进 MySQL 固定列，而是写入 MongoDB 的 `vehicle_params` 集合。文档中会保存：

- `car_id`
- `param_car_id`
- `params_url`
- `sections`
- `rows`
- `raw_lines`
- `raw_text`
- `fetched_at`

如果没有有效 Cookie，参数页可能跳到登录页或只返回空内容。爬虫会识别这种情况并跳过写入，避免把登录页当成车辆参数保存。

### 断点续爬与补数据

爬虫会把每辆车的 JSON 保存到：

```text
backend/data/crawl/json/
```

旧逻辑只要 JSON 存在就跳过。现在改为：

- 如果 JSON 已有本地图片并且已有 `vehicle_params`，才跳过。
- 如果旧数据缺图片或缺参数页，会重新抓取并补齐。
- 如果 MySQL 里车辆已存在，重抓时会更新图片路径、图片 URL、车辆信息等字段。

## Cookie 池维护

Cookie 池目录默认是：

```text
backend/data/crawl/cookie_pool/
```

手动新增一份 Cookie：

```bash
cd backend
uv run python app/scripts/cookie_pool.py add --name account1
```

命令会打开浏览器，你手动登录懂车帝后回到终端确认保存。

查看 Cookie 池：

```bash
uv run python app/scripts/cookie_pool.py list
```

删除过期 Cookie：

```bash
uv run python app/scripts/cookie_pool.py delete --name account1
```

建议维护方式：

- 每个账号保存成一个名字，例如 `account1`、`account2`。
- 发现任务日志里频繁出现参数页需要 Cookie、登录页或空内容时，重新导入 Cookie。
- 过期 Cookie 用 `delete` 删除，不要直接手改 JSON。

## 买车意向与分布式锁

买车入口会把用户意向写入 MongoDB 的 `purchase_intents` 集合。创建意向时使用 Redis 分布式锁，避免同一用户对同一车辆短时间重复提交。

爬虫保存车辆时也使用 Redis 锁，锁 key 形如：

```text
lock:crawl:car:{car_id}
```

这样多个任务同时跑到同一辆车时，不会重复写 MongoDB/MySQL。

## AI 助手与 MCP

AI 服务支持 OpenAI 兼容 API Key 配置，并带有 MCP 风格工具调用能力。当前数据库问答工具可以查询车辆价格、车辆字段和统计信息。

示例问题：

```text
数据库中特斯拉价格介绍一下
```

如果 AI 助手不通，优先检查：

- `ai_service/.env` 中 API Key 是否存在
- `ai_service` 是否启动在 `127.0.0.1:8080`
- `frontend` 环境变量中的 AI 服务地址是否正确
- 后端、AI 服务和数据库是否同时运行

## 移动端

```bash
cd mobile2
npm start
```

常用命令：

- Web 预览：`npm run web`
- iOS 模拟器：`npm run ios`
- Android：`npm run android`

如果真机调试需要访问本机后端，不要写 `127.0.0.1`，应改成电脑的局域网 IP。

## Remotion

```bash
cd remotion
npm run studio:compat
```

渲染视频：

```bash
npm run render:compat -- VehicleIntroCN out/video.mp4
```

## Docker 部署

本地或服务器整套启动：

```bash
docker compose up -d --build
```

使用部署脚本：

```bash
bash deploy.sh
```

`deploy.sh` 默认会使用根目录下的 `docker-compose.yml`。

## Nginx 与线上域名

当前线上反向代理配置在：

```text
nginx/conf.d/default.conf
```

它负责：

- `https://www.nrydawang.shop/` 指向网页端
- `/api/` 转发到 `backend`
- `/ai/` 转发到 `ai_service`
- `/mobile/` 转发到移动端 Web
- `/public/preview/video` 等公共资源转发到后端

更换域名或证书时，需要同步修改：

- `server_name`
- 证书路径
- 安全组/防火墙的 `80/443` 端口

## 常用检查命令

后端检查：

```bash
cd backend
uv run ruff check app
uv run python -c "from app.main import app; print('backend import ok')"
```

前端检查：

```bash
cd frontend
npm run typecheck
npm run lint
```

查看后端接口文档：

```bash
curl http://127.0.0.1:8000/openapi.json
```

## 常见问题

### 网页端图片不显示

优先检查：

- `backend/data/crawl/images/` 下是否真的存在图片文件
- 数据库里的 `image_path` 是否是 `crawl/images/xxx.jpg` 这种相对路径
- 后端是否正常提供 `/files/...`
- 如果是旧数据，重新跑一次爬虫补齐图片

### 参数页没有写入 MongoDB

优先检查：

- Cookie 池是否启用
- Cookie 是否过期
- 任务日志是否出现“参数页需要有效 Cookie 或内容为空”
- MongoDB 是否正常运行

### 网页能登录，移动端不能登录

优先检查：

- `mobile2/.env` 是否把接口写成了正确后端地址
- 是否误写成裸域名或错误路径
- 本地真机调试时是否用了 `127.0.0.1`
- 后端是否已重启，让最新 CORS 配置生效

### HTTPS 打不开

优先检查：

- `nginx/conf.d/default.conf`
- `nginx/cert` 下证书是否存在
- Docker 中的 `vehicle_nginx` 是否正常启动
- 宿主机是否有别的 Nginx 占用了 `80/443`

## 提交与部署建议

推荐流程：

```bash
git status
git add -A
git commit -m "feat: update vehicle crawler and ai workflow"
git push origin main
```

服务器部署：

```bash
git pull
bash deploy.sh
```
