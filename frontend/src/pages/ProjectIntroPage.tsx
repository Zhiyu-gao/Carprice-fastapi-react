import { Card, Button, Typography, Row, Col, Space, Tag } from "antd";
import {
  BarChartOutlined,
  RobotOutlined,
  DatabaseOutlined,
  GithubOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

export default function ProjectIntroPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <DatabaseOutlined style={{ fontSize: 32, color: "#0EA5E9" }} />,
      title: "真实数据采集",
      desc: "通过Playwright有头浏览器爬取链家真实车辆数据，Cookie复用确保数据完整性",
    },
    {
      icon: <BarChartOutlined style={{ fontSize: 32, color: "#F97316" }} />,
      title: "智能价格预测",
      desc: "基于scikit-learn机器学习算法，精准预测二手车市场价格趋势",
    },
    {
      icon: <RobotOutlined style={{ fontSize: 32, color: "#10B981" }} />,
      title: "AI深度分析",
      desc: "集成Kimi、Qwen、DeepSeek多模型，提供专业的车辆价格分析报告",
    },
  ];

  const techStack = [
    "FastAPI",
    "React",
    "MySQL",
    "scikit-learn",
    "LangGraph",
    "Playwright",
    "JWT",
    "Alembic",
  ];

  return (
    <div style={{ margin: "-32px" }}>
      {/* Hero Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)",
          minHeight: "600px",
          padding: "80px 48px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <Row align="middle" gutter={[64, 48]}>
            <Col xs={24} md={14}>
              <div style={{ marginBottom: 24 }}>
                <Tag
                  style={{
                    background: "rgba(34, 211, 238, 0.2)",
                    color: "#22D3EE",
                    border: "1px solid rgba(34, 211, 238, 0.3)",
                    padding: "4px 16px",
                    fontSize: 14,
                  }}
                >
                  🚗 工程级全栈解决方案
                </Tag>
              </div>
              <Title
                level={1}
                style={{
                  color: "white",
                  fontSize: 56,
                  marginBottom: 24,
                  lineHeight: 1.2,
                }}
              >
                车辆智能价格
                <br />
                预测与分析系统
              </Title>
              <Paragraph
                style={{
                  color: "#94A3B8",
                  fontSize: 20,
                  marginBottom: 32,
                  lineHeight: 1.8,
                  maxWidth: 600,
                }}
              >
                融合真实车辆数据采集、传统机器学习建模、大模型AI分析以及LangGraph智能Agent编排的完整解决方案
              </Paragraph>
              <Space size="large">
                <Button
                  type="primary"
                  size="large"
                  onClick={() => navigate("/predict")}
                  style={{
                    background: "#F97316",
                    borderColor: "#F97316",
                    height: 48,
                    padding: "0 32px",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  开始预测 <ArrowRightOutlined />
                </Button>
                <Button
                  size="large"
                  onClick={() => navigate("/ai_chat")}
                  style={{
                    background: "transparent",
                    borderColor: "rgba(255,255,255,0.3)",
                    color: "white",
                    height: 48,
                    padding: "0 32px",
                    fontSize: 16,
                  }}
                >
                  AI助手
                </Button>
              </Space>

              {/* Tech Stack Tags */}
              <div style={{ marginTop: 48 }}>
                <Paragraph style={{ color: "#64748B", marginBottom: 16 }}>
                  技术栈
                </Paragraph>
                <Space wrap>
                  {techStack.map((tech) => (
                    <Tag
                      key={tech}
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        color: "#CBD5E1",
                        border: "1px solid rgba(255,255,255,0.2)",
                        padding: "4px 12px",
                      }}
                    >
                      {tech}
                    </Tag>
                  ))}
                </Space>
              </div>
            </Col>
            <Col xs={24} md={10}>
              <Card
                bordered={false}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  padding: 32,
                }}
              >
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <Title level={3} style={{ color: "white", margin: 0 }}>
                    系统能力概览
                  </Title>
                </div>
                {[
                  { label: "已采集车辆", value: "10,000+", color: "#22D3EE" },
                  { label: "预测准确率", value: "95%", color: "#F97316" },
                  { label: "AI模型", value: "3+", color: "#10B981" },
                  { label: "服务可用性", value: "99.9%", color: "#8B5CF6" },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px 0",
                      borderBottom:
                        idx < 3 ? "1px solid rgba(255,255,255,0.1)" : "none",
                    }}
                  >
                    <Text style={{ color: "#94A3B8", fontSize: 16 }}>
                      {stat.label}
                    </Text>
                    <Text
                      style={{
                        color: stat.color,
                        fontSize: 24,
                        fontWeight: 700,
                      }}
                    >
                      {stat.value}
                    </Text>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ background: "#F8FAFC", padding: "80px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <Title level={2} style={{ color: "#0F172A", marginBottom: 16 }}>
              核心功能
            </Title>
            <Paragraph
              style={{ color: "#64748B", fontSize: 18, maxWidth: 600, margin: "0 auto" }}
            >
              从数据采集到AI分析，提供端到端的车辆价格智能解决方案
            </Paragraph>
          </div>
          <Row gutter={[32, 32]}>
            {features.map((feature, idx) => (
              <Col xs={24} md={8} key={idx}>
                <Card
                  bordered={false}
                  style={{
                    background: "white",
                    borderRadius: 16,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                    height: "100%",
                    transition: "all 0.3s ease",
                  }}
                  hoverable
                >
                  <div style={{ marginBottom: 24 }}>{feature.icon}</div>
                  <Title level={4} style={{ color: "#0F172A", marginBottom: 16 }}>
                    {feature.title}
                  </Title>
                  <Paragraph style={{ color: "#64748B", lineHeight: 1.8 }}>
                    {feature.desc}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* System Architecture */}
      <div style={{ background: "white", padding: "80px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Row align="middle" gutter={[64, 48]}>
            <Col xs={24} md={12}>
              <Title level={2} style={{ color: "#0F172A", marginBottom: 24 }}>
                系统架构
              </Title>
              <Paragraph
                style={{ color: "#64748B", fontSize: 16, lineHeight: 1.8, marginBottom: 32 }}
              >
                采用微服务架构设计，前后端分离，AI服务独立部署，确保系统的高可用性和可扩展性
              </Paragraph>
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                {[
                  { title: "前端", desc: "React + Vite + Ant Design", port: "5173" },
                  { title: "业务后端", desc: "FastAPI + SQLAlchemy + Alembic", port: "8000" },
                  { title: "AI服务", desc: "独立FastAPI + LangGraph", port: "8080" },
                  { title: "数据库", desc: "MySQL 8.x + Alembic迁移", port: "3306" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: 16,
                      background: "#F8FAFC",
                      borderRadius: 12,
                    }}
                  >
                    <Tag
                      style={{
                        background: "#0EA5E9",
                        color: "white",
                        border: "none",
                        minWidth: 60,
                        textAlign: "center",
                      }}
                    >
                      {item.port}
                    </Tag>
                    <div>
                      <Text strong style={{ color: "#0F172A", display: "block" }}>
                        {item.title}
                      </Text>
                      <Text style={{ color: "#64748B", fontSize: 14 }}>
                        {item.desc}
                      </Text>
                    </div>
                  </div>
                ))}
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Card
                bordered={false}
                style={{
                  background: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)",
                  borderRadius: 16,
                  padding: 32,
                }}
              >
                <Title level={4} style={{ color: "white", marginBottom: 24 }}>
                  AI能力
                </Title>
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  {[
                    { name: "Kimi", desc: "Moonshot大模型" },
                    { name: "Qwen", desc: "阿里云通义千问" },
                    { name: "DeepSeek", desc: "深度求索大模型" },
                  ].map((model, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: "white", fontWeight: 600 }}>
                        {model.name}
                      </Text>
                      <Text style={{ color: "#94A3B8", fontSize: 14 }}>
                        {model.desc}
                      </Text>
                    </div>
                  ))}
                </Space>
                <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <Paragraph style={{ color: "#94A3B8", fontSize: 14, margin: 0 }}>
                    <CheckCircleOutlined style={{ color: "#10B981", marginRight: 8 }} />
                    输出Markdown格式的专业车辆价格分析报告
                  </Paragraph>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* CTA Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #0EA5E9 0%, #1E3A8A 100%)",
          padding: "80px 48px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Title level={2} style={{ color: "white", marginBottom: 24 }}>
            准备好体验智能车辆分析了吗？
          </Title>
          <Paragraph
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 18,
              marginBottom: 32,
            }}
          >
            立即开始使用我们的AI驱动车辆价格预测系统
          </Paragraph>
          <Space size="large">
            <Button
              type="primary"
              size="large"
              onClick={() => navigate("/predict")}
              style={{
                background: "#F97316",
                borderColor: "#F97316",
                height: 48,
                padding: "0 32px",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              开始预测
            </Button>
            <Button
              size="large"
              href="https://github.com/Zhiyu-gao/Carprice-fastapi-react"
              target="_blank"
              icon={<GithubOutlined />}
              style={{
                background: "rgba(255,255,255,0.2)",
                borderColor: "rgba(255,255,255,0.3)",
                color: "white",
                height: 48,
                padding: "0 32px",
                fontSize: 16,
              }}
            >
              查看源码
            </Button>
          </Space>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "#0F172A", padding: "48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <Paragraph style={{ color: "#64748B", margin: 0 }}>
            © 2026 车辆智能价格预测系统 | 📧 gaoking35@gmail.com
          </Paragraph>
          <Paragraph style={{ color: "#64748B", marginTop: 16 }}>
            <Button
              type="link"
              onClick={() => navigate("/author")}
              style={{ color: "#22d3ee", fontSize: 14 }}
            >
              作者个人信息
            </Button>
          </Paragraph>
        </div>
      </div>
    </div>
  );
}
