# mobile2 (Expo Router 客户端)

这个目录是车辆智能平台的移动端前端（React Native + Expo Router）。

已接入后端接口：

- `POST /auth/login`
- `POST /auth/email/code`
- `POST /auth/register`
- `GET /me`
- `POST /predict`
- `GET /crawl-cars`
- `GET/POST/DELETE /ai/chat/sessions*`
- `POST /ai/chat/stream`（以非流式方式解析 SSE）
- `GET /ai/rag/docs`
- `POST /ai/rag/upload`
- `DELETE /ai/rag/docs/{doc_id}`
- `POST /ai/rag/search`

## 运行

```bash
cd /Users/zhiyu/Documents/Vehicle-Intelligence-Platform/mobile2
cp .env.example .env
# 按实际后端地址修改 EXPO_PUBLIC_API_BASE_URL
npm install
npm run start
```

## 环境变量

`.env`:

```bash
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
EXPO_PUBLIC_AI_BASE_URL=http://127.0.0.1:8080
```

如果是手机真机调试，不要用 `127.0.0.1`，改成后端机器局域网 IP，例如：

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8000
```

## 页面结构

- `/login`：登录页
- `/login`：登录/注册页（邮箱验证码注册）
- `/(tabs)/index`：首页（用户信息与接口概览）
- `/(tabs)/predict`：价格预测
- `/(tabs)/ai`：AI 会话 + RAG（会话管理、提问、文本上传/文档删除、检索）
- `/(tabs)/cars`：爬虫车源列表（搜索 + 分页）
- `/(tabs)/profile`：个人信息 + 退出登录

## 当前实现说明

- 认证态保存在内存（应用重启后需重新登录）
- AI 问答当前是“提交后整段返回”，不是逐 token 流式渲染
- RAG 上传暂未接入（当前支持文档列表和检索）
