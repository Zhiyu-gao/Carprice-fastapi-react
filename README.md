# 🚗 Vehicle Price Prediction & Analysis System

**React · FastAPI · MySQL · Machine Learning · AI Agent · Crawler · LangGraph**

一个**工程级、可扩展的全栈车辆价格预测与智能分析系统**，
基于**真实二手车数据**，构建从数据采集到 AI 推理的完整闭环：

> **车辆数据采集 → 结构化存储 → 传统价格预测 → AI 多步骤分析 → 前端展示**

---

## ✨ 项目亮点（TL;DR）

* ✅ **真实数据**：有头浏览器爬虫采集二手车平台数据
* ✅ **不是单模型**：传统 ML 预测 + 大模型分析协同
* ✅ **不是简单 LLM 调用**：LangGraph 编排多步骤推理 Agent
* ✅ **不是 Demo**：JWT / CRUD / Alembic / Docker 全链路
* ✅ **不是强耦合**：业务后端 / AI 服务 / 爬虫系统完全解耦

---

## 🏗 系统整体架构

```text
┌────────────┐      ┌────────────┐
│  Frontend  │─────▶│  Backend   │─────▶ MySQL
│  (React)   │      │ (FastAPI)  │
└────────────┘      └─────┬──────┘
                           │
                           ▼
                  ┌────────────────┐
                  │   AI Service   │
                  │  (FastAPI +    │
                  │   LangGraph)   │
                  └────────────────┘

            ▲
            │
     ┌────────────┐
     │  Crawler   │
     │ (Vehicle)  │
     └────────────┘
```

---

## 🧩 功能模块说明

### 🔧 Backend（FastAPI · 端口 8000）

**职责：业务系统 + 数据管理 + 传统预测**

* 车辆信息 CRUD（增 / 删 / 改 / 查）
* 用户系统（注册 / 登录 / JWT 鉴权）
* 传统机器学习车价预测（scikit-learn）
* 爬虫数据导入与标注
* MySQL 数据持久化
* Alembic 数据库迁移管理

**核心接口示例：**

| Method | Path             | Description |
| ------ | ---------------- | ----------- |
| POST   | `/auth/login`    | 用户登录        |
| GET    | `/auth/me`       | 当前用户        |
| GET    | `/vehicles`      | 车辆列表        |
| POST   | `/predict`       | ML 车价预测     |
| POST   | `/crawl/vehicle` | 导入爬虫车辆数据    |

---

### 🤖 AI Service（FastAPI · 端口 8080）

**职责：AI 推理 + 智能 Agent 编排**

#### 支持的大模型（OpenAI 兼容协议）

* **Kimi**
* **Qwen**
* **DeepSeek**

#### 核心能力

* 基于车辆特征的 AI 价格分析
* 多模型统一接口
* Prompt 集中管理
* **LangGraph 驱动的多步骤分析流程**
* 输出结构化 Markdown 报告（估值 / 风险 / 建议）

```text
ai_service/app/
├── ai/
│   └── graph.py          # LangGraph 分析流程定义
├── price_analysis_service.py
├── providers/
│   ├── kimi_client.py
│   ├── qwen_client.py
│   └── deepseek_client.py
├── prompts/
│   └── vehicle_price_analysis.py
```

---

### 🧠 LangGraph 智能分析 Agent（核心设计）

用于构建 **可解释、可扩展、可组合** 的车辆分析 Agent：

* 将 **传统 ML 预测价格** 作为输入节点
* 多阶段自动推理：

  * 价格合理性判断
  * 折旧与风险分析
  * 买卖建议生成
* 支持未来扩展：

  * 多车辆对比
  * 投资 / 二手交易决策 Agent
  * 自动生成评估报告

---

### 🕷 车辆数据爬虫系统（有头浏览器）

用于采集 **真实二手车平台数据**（非模拟数据）。

#### 设计特点

* **必须使用有头浏览器**
* 手动登录 + Cookie 状态复用
* 与业务系统完全解耦
* 数据以 JSON 形式落盘，便于回放与再处理

#### 目录结构

```text
backend/app/spider/vehicle/
├── login_save_state.py     # 手动登录并保存 cookie
├── vehicle_spider.py       # 主爬虫脚本
├── vehicle_state.json      # 登录态
└── vehicle_json/           # 爬取结果（JSON）
```

#### 使用流程（重要）

**① 保存登录态（首次或过期时）**

```bash
cd backend
python app/spider/vehicle/login_save_state.py
```

* 启动 Chromium（有头）
* 手动登录二手车平台
* 自动保存 cookie 状态

**② 启动车辆爬虫**

```bash
cd backend
python -m app.spider.vehicle.vehicle_spider
```

数据将保存至：

```text
backend/app/spider/vehicle/vehicle_json/
```

---

### 💻 Frontend（React + Vite + Ant Design · 端口 5173）

前端提供完整的管理与分析界面：

* JWT 登录 / 注册
* 左侧固定导航布局
* 页面模块包括：

  * 项目介绍
  * 车价预测（ML）
  * AI 智能分析（多模型）
  * 车辆管理（CRUD）
  * 可视化分析大屏
  * 元数据标注后台
  * 爬虫任务管理页面

---

## 🧱 项目结构总览

```text
car-price/
├── backend/        # 业务后端（FastAPI + ML + DB）
├── ai_service/     # AI 服务（FastAPI + LangGraph）
├── frontend/       # 前端（React）
├── docker-compose.yml
└── README.md
```

---

## ⚙️ 环境要求

* Python ≥ 3.11（推荐使用 `uv`）
* Node.js ≥ 18
* MySQL ≥ 8.x
* Playwright（用于有头爬虫）

---

## 📮 联系方式

如对项目或实现细节感兴趣，欢迎交流：

📧 **[gaoking35@gmail.com](mailto:gaoking35@gmail.com)**


