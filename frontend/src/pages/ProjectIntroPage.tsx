import { Card, Typography, Divider } from "antd";

const { Title, Paragraph, Text } = Typography;

export default function ProjectIntroPage() {
  return (
    <Card
      bordered={false}
      style={{
        background: "#020617",
        color: "#e5e7eb",
      }}
    >
      {/* 标题 */}
      <Title level={2} style={{ color: "#e5e7eb" }}>
        🏠 House Price Prediction System
      </Title>

      <Paragraph style={{ color: "#9ca3af" }}>
        React · FastAPI · MySQL · Machine Learning · AI Agent · Crawler · LangGraph
      </Paragraph>

      <Divider />

      {/* 项目简介 */}
      <Title level={3} style={{ color: "#e5e7eb" }}>
        📌 项目简介
      </Title>

      <Paragraph style={{ color: "#d1d5db" }}>
        这是一个<strong>工程级全栈房价预测与分析系统</strong>，融合了
        <Text strong> 真实房源数据采集 </Text>、
        <Text strong> 传统机器学习建模 </Text>、
        <Text strong> 大模型 AI 分析 </Text>
        以及
        <Text strong> LangGraph 智能 Agent 编排</Text>。
      </Paragraph>

      <Paragraph style={{ color: "#d1d5db" }}>
        项目并非基于虚拟数据或简单 Demo，而是通过<strong>链家真实二手房爬虫</strong>
        获取数据，构建完整的数据 → 预测 → AI 推理 → 前端展示闭环。
      </Paragraph>

      <ul style={{ color: "#d1d5db", lineHeight: 1.8 }}>
        <li>真实二手房数据爬取（有头浏览器 + Cookie 复用）</li>
        <li>房源 CRUD 管理 + MySQL 持久化</li>
        <li>传统机器学习房价预测（scikit-learn）</li>
        <li>多大模型 AI 房价分析（Kimi / Qwen / DeepSeek）</li>
        <li>LangGraph 驱动的多步骤智能分析 Agent</li>
        <li>前后端分离 + 微服务架构</li>
      </ul>

      <Divider />

      {/* 系统架构 */}
      <Title level={3} style={{ color: "#e5e7eb" }}>
        🧩 系统架构
      </Title>

      <ul style={{ color: "#d1d5db", lineHeight: 1.8 }}>
        <li>
          <Text strong>前端（5173）</Text>：React + Vite + Ant Design  
          <Text type="secondary">（项目介绍 / 预测 / AI 分析 / 可视化）</Text>
        </li>
        <li>
          <Text strong>业务后端（8000）</Text>：FastAPI + SQLAlchemy + Alembic  
          <Text type="secondary">（房源 CRUD / 用户系统 / ML 预测）</Text>
        </li>
        <li>
          <Text strong>AI 服务（8080）</Text>：独立 FastAPI  
          <Text type="secondary">（大模型调用 + LangGraph Agent 编排）</Text>
        </li>
        <li>
          <Text strong>爬虫系统</Text>：Playwright（有头）  
          <Text type="secondary">（链家真实二手房数据采集）</Text>
        </li>
        <li>
          <Text strong>数据库</Text>：MySQL 8.x（Alembic 迁移管理）
        </li>
      </ul>

      <Divider />

      {/* AI 能力 */}
      <Title level={3} style={{ color: "#e5e7eb" }}>
        🤖 AI 与 Agent 能力
      </Title>

      <Paragraph style={{ color: "#d1d5db" }}>
        AI 服务采用 <Text strong>OpenAI 兼容协议</Text> 统一接入多家大模型，
        并通过 <Text strong>LangGraph</Text> 构建可组合、可扩展的分析流程。
      </Paragraph>

      <ul style={{ color: "#d1d5db", lineHeight: 1.8 }}>
        <li>Kimi</li>
        <li>Qwen</li>
        <li>DeepSeek</li>
      </ul>

      <Paragraph style={{ color: "#9ca3af" }}>
        输出结果为 <Text strong>Markdown 格式</Text> 的房价分析报告，
        包含价格合理性判断、风险提示与买卖建议。
      </Paragraph>

      <Divider />

      {/* 技术关键词 */}
      <Title level={3} style={{ color: "#e5e7eb" }}>
        🛠 技术关键词
      </Title>

      <Paragraph style={{ color: "#9ca3af" }}>
        FastAPI · React · SQLAlchemy · Alembic · MySQL · scikit-learn · JWT ·
        Playwright · LangGraph · AI Agent · 微服务
      </Paragraph>

      <Divider />

      {/* 联系方式 */}
      <Title level={3} style={{ color: "#e5e7eb" }}>
        📮 联系我们
      </Title>

      <Paragraph style={{ color: "#9ca3af" }}>
        如果你对本项目感兴趣，欢迎联系：
      </Paragraph>

      <Paragraph style={{ color: "#d1d5db" }}>
        📧 <Text strong>gaoking35@gmail.com</Text>
      </Paragraph>
    </Card>
  );
}
