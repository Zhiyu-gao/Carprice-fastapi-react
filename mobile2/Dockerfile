FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# 生产环境使用同域反代路径
ENV EXPO_PUBLIC_API_BASE_URL=/api
ENV EXPO_PUBLIC_AI_BASE_URL=/ai

RUN npx expo export --platform web

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
