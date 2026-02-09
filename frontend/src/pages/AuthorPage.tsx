import { Card, Button, Typography, Row, Col, Avatar, Space, Tag } from "antd";
import {
  GithubOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CodeOutlined,
  RocketOutlined,
  TrophyOutlined,
  ExperimentOutlined,
  DatabaseOutlined,
  RobotOutlined,
  BarChartOutlined,
  BookOutlined,
  GlobalOutlined,
  ToolOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const skills = [
  { category: "前端", items: ["React", "Vue3", "TypeScript", "Element Plus", "UniApp"] },
  { category: "后端", items: ["FastAPI", "Django", "Spring Boot", "Node.js", "Python"] },
  { category: "数据库", items: ["MySQL", "PostgreSQL", "Redis"] },
  { category: "AI/ML", items: ["TensorFlow", "Machine Learning", "LangGraph", "AI模型部署"] },
  { category: "工具", items: ["Git", "Docker", "Playwright", "Three.js", "DBeaver"] },
];

const experiences = [
  {
    title: "全栈开发实习生",
    company: "北京细红线科技有限公司",
    period: "2025.11 - 至今",
    description: "负责'且听app'PC端核心功能开发，基于Gemini API构建书评生成全流程pipeline；完成多平台书籍源信息爬虫开发；参与训练奖励模型，优化书评生成效果",
    tech: ["FastAPI", "React", "MySQL", "Gemini API", "Playwright"],
    icon: <RocketOutlined />,
  },
  {
    title: "前端实习生",
    company: "上海浩海星空机器人有限公司",
    period: "2025.9 - 2025.10",
    description: "基于Ruoyi开源框架二次开发，新增业务模块；与后端团队协作完成接口联调；深化Vue3生态应用，掌握Pinia状态管理、Router路由配置",
    tech: ["Vue3", "Pinia", "Ruoyi", "Gitee"],
    icon: <CodeOutlined />,
  },
  {
    title: "全栈实习生",
    company: "上海沐钼科技有限公司",
    period: "2025.7 - 2025.8",
    description: "将Redis缓存系统改造为消息队列；对接腾讯混元模型API实现'文生图'功能；用Django+Vue3+Three.js开发3D在线查看模块",
    tech: ["Django", "Vue3", "Three.js", "腾讯混元API"],
    icon: <DatabaseOutlined />,
  },
];

const projects = [
  {
    title: "房价预测与智能分析系统",
    period: "2025.10 - 至今",
    description: "工程级前后端分离系统，实现真实房源数据采集、传统机器学习房价预测、多模型AI分析及LangGraph驱动的智能分析Agent",
    tags: ["React", "FastAPI", "MySQL", "Machine Learning", "LangGraph", "Playwright"],
    icon: <BarChartOutlined />,
    role: "项目核心开发者",
  },
  {
    title: "基于TensorFlow的智能教育平台",
    period: "2025.8 - 至今",
    description: "独立完成前后端全流程开发，实现登录/退出、图片识别、AI模型构建、机器学习预测等核心功能",
    tags: ["Vue3", "Spring Boot", "FastAPI", "TensorFlow"],
    icon: <RobotOutlined />,
    role: "项目负责人",
  },
  {
    title: "井盖隐患预测系统",
    period: "2025.3 - 2025.8",
    description: "独立开发全流程系统，使用CSS画线实现BBox边界框标注，结合ResNet模型优化井盖状态判断与预警准确率",
    tags: ["Vue3", "Django", "MySQL", "ResNet", "JWT"],
    icon: <ToolOutlined />,
    role: "项目负责人",
  },
  {
    title: "上海非遗绣文化网络社区小程序",
    period: "2024.10 - 至今",
    description: "市级大创项目，独立完成前后端开发，实现TabBar结构与侧边栏功能，还原网页级交互体验",
    tags: ["UniApp", "Django", "MySQL"],
    icon: <GlobalOutlined />,
    role: "市级大创项目参与者",
  },
  {
    title: "基于Unity的蒸汽机仿真拼装",
    period: "2024.10 - 2025.4",
    description: "工创赛市级二等奖项目，负责拼装逻辑实现、代码开发及零件导入，完成物体插入动画、页面跳转与UI设计",
    tags: ["Unity", "C#"],
    icon: <ExperimentOutlined />,
    role: "工创赛市级二等奖参与者",
  },
  {
    title: "面向工程光学的专业辅助计算系统",
    period: "2024.10 - 2025.3",
    description: "校级大创项目，独立解决前端物理符号呈现、实验数据增删改查及光线可视化需求",
    tags: ["Django", "Python", "MySQL", "Matplotlib", "Bootstrap"],
    icon: <BookOutlined />,
    role: "校级大创项目负责人",
  },
];

const certificates = [
  { name: "大学英语四级 (CET-4)", desc: "具备良好的英语听说读写能力" },
  { name: "全国计算机二级", desc: "Python + C语言" },
  { name: "机动车驾驶证", desc: "" },
];

const achievements = [
  { title: "工创赛市级二等奖", desc: "基于Unity的蒸汽机仿真拼装项目", icon: <TrophyOutlined /> },
  { title: "市级大创项目", desc: "上海非遗绣文化网络社区小程序", icon: <TeamOutlined /> },
  { title: "校级大创项目", desc: "面向工程光学的专业辅助计算系统", icon: <ExperimentOutlined /> },
];

export default function AuthorPage() {
  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "white", padding: "48px 24px" }}>
      {/* Hero Section */}
      <div style={{ maxWidth: 1200, margin: "0 auto 60px" }}>
        <Row align="middle" gutter={[48, 32]}>
          <Col xs={24} md={8}>
            <div style={{ textAlign: "center" }}>
              <Avatar
                size={140}
                icon={<UserOutlined />}
                style={{
                  background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
                  marginBottom: 24,
                  boxShadow: "0 0 40px rgba(34, 211, 238, 0.4)",
                }}
              />
              <Title level={2} style={{ color: "white", marginBottom: 8 }}>
                高志羽
              </Title>
              <Paragraph style={{ color: "#22d3ee", fontSize: 18, marginBottom: 8 }}>
                全栈开发工程师
              </Paragraph>
              <Paragraph style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>
                数据科学与大数据技术 | 本科大三
              </Paragraph>
              <Space size="small" wrap style={{ justifyContent: "center" }}>
                <Tag style={{ background: "rgba(34, 211, 238, 0.2)", color: "#22d3ee", border: "1px solid rgba(34, 211, 238, 0.3)" }}>
                  React
                </Tag>
                <Tag style={{ background: "rgba(34, 211, 238, 0.2)", color: "#22d3ee", border: "1px solid rgba(34, 211, 238, 0.3)" }}>
                  Vue3
                </Tag>
                <Tag style={{ background: "rgba(34, 211, 238, 0.2)", color: "#22d3ee", border: "1px solid rgba(34, 211, 238, 0.3)" }}>
                  Python
                </Tag>
                <Tag style={{ background: "rgba(34, 211, 238, 0.2)", color: "#22d3ee", border: "1px solid rgba(34, 211, 238, 0.3)" }}>
                  AI/ML
                </Tag>
              </Space>
            </div>
          </Col>
          <Col xs={24} md={16}>
            <div>
              <Title level={3} style={{ color: "white", marginBottom: 16 }}>
                个人简介
              </Title>
              <Paragraph style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                上海第二工业大学数据科学与大数据技术专业本科大三学生，热爱代码开发，
                专注于全栈开发与AI技术落地。具备扎实的前后端开发能力，熟悉React/Vue3生态和Python后端开发，
                对人工智能和机器学习有浓厚兴趣。
              </Paragraph>
              <Paragraph style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                拥有3段实习经历，曾在北京细红线科技、上海浩海星空机器人、上海沐钼科技担任开发实习生，
                积累了丰富的实战经验。热衷于开源社区，喜欢探索新技术并将其应用到实际项目中。
              </Paragraph>
              <Paragraph style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
                <strong style={{ color: "#22d3ee" }}>职业目标：</strong>
                希望成长为算法落地方向的偏开发类全栈高级工程师，为业务提供技术解决方案。
              </Paragraph>
              <Space size="large" wrap>
                <Button
                  type="primary"
                  size="large"
                  icon={<MailOutlined />}
                  href="mailto:2187669042@qq.com"
                  style={{
                    background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
                    border: "none",
                    borderRadius: 8,
                  }}
                >
                  联系我
                </Button>
                <Button
                  size="large"
                  icon={<GithubOutlined />}
                  href="https://github.com/Zhiyu-gao"
                  target="_blank"
                  style={{
                    background: "rgba(30, 41, 59, 0.8)",
                    color: "white",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 8,
                  }}
                >
                  GitHub
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </div>

      {/* Contact Info Cards */}
      <div style={{ maxWidth: 1200, margin: "0 auto 60px" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card
              bordered={false}
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.1)",
                borderRadius: 12,
                textAlign: "center",
              }}
            >
              <MailOutlined style={{ fontSize: 28, color: "#22d3ee", marginBottom: 8 }} />
              <Paragraph style={{ color: "#94a3b8", margin: 0, fontSize: 12 }}>邮箱</Paragraph>
              <Text style={{ color: "white", fontSize: 14 }}>2187669042@qq.com</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              bordered={false}
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.1)",
                borderRadius: 12,
                textAlign: "center",
              }}
            >
              <PhoneOutlined style={{ fontSize: 28, color: "#22d3ee", marginBottom: 8 }} />
              <Paragraph style={{ color: "#94a3b8", margin: 0, fontSize: 12 }}>电话</Paragraph>
              <Text style={{ color: "white", fontSize: 14 }}>17717356613</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              bordered={false}
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.1)",
                borderRadius: 12,
                textAlign: "center",
              }}
            >
              <EnvironmentOutlined style={{ fontSize: 28, color: "#22d3ee", marginBottom: 8 }} />
              <Paragraph style={{ color: "#94a3b8", margin: 0, fontSize: 12 }}>位置</Paragraph>
              <Text style={{ color: "white", fontSize: 14 }}>上海闵行</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              bordered={false}
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.1)",
                borderRadius: 12,
                textAlign: "center",
              }}
            >
              <CalendarOutlined style={{ fontSize: 28, color: "#22d3ee", marginBottom: 8 }} />
              <Paragraph style={{ color: "#94a3b8", margin: 0, fontSize: 12 }}>出生年月</Paragraph>
              <Text style={{ color: "white", fontSize: 14 }}>2005年8月</Text>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Skills Section */}
      <div style={{ maxWidth: 1200, margin: "0 auto 60px" }}>
        <Title level={3} style={{ color: "white", marginBottom: 24, textAlign: "center" }}>
          技术栈
        </Title>
        <Row gutter={[24, 24]}>
          {skills.map((skillGroup) => (
            <Col key={skillGroup.category} xs={24} sm={12} md={8} lg={6}>
              <Card
                bordered={false}
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(148, 163, 184, 0.1)",
                  borderRadius: 12,
                  height: "100%",
                }}
              >
                <Title level={5} style={{ color: "#22d3ee", marginBottom: 16 }}>
                  {skillGroup.category}
                </Title>
                <Space size="small" wrap>
                  {skillGroup.items.map((skill) => (
                    <Tag
                      key={skill}
                      style={{
                        background: "rgba(34, 211, 238, 0.1)",
                        color: "#94a3b8",
                        border: "1px solid rgba(34, 211, 238, 0.2)",
                      }}
                    >
                      {skill}
                    </Tag>
                  ))}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Experience Section */}
      <div style={{ maxWidth: 1200, margin: "0 auto 60px" }}>
        <Title level={3} style={{ color: "white", marginBottom: 24, textAlign: "center" }}>
          实习经历
        </Title>
        <Row gutter={[24, 24]}>
          {experiences.map((exp, index) => (
            <Col key={index} xs={24} md={8}>
              <Card
                bordered={false}
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(148, 163, 184, 0.1)",
                  borderRadius: 16,
                  height: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      color: "white",
                      flexShrink: 0,
                      boxShadow: "0 0 20px rgba(34, 211, 238, 0.5)",
                      border: "2px solid rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    {exp.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Title level={4} style={{ color: "white", marginBottom: 4, fontSize: 18 }}>
                      {exp.title}
                    </Title>
                    <Text style={{ color: "#22d3ee", display: "block", marginBottom: 4, fontSize: 14 }}>
                      {exp.company}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 12 }}>
                      {exp.period}
                    </Text>
                  </div>
                </div>
                <Paragraph style={{ color: "#94a3b8", marginBottom: 12, lineHeight: 1.6, fontSize: 13 }}>
                  {exp.description}
                </Paragraph>
                <Space size="small" wrap>
                  {exp.tech.map((t) => (
                    <Tag
                      key={t}
                      style={{
                        background: "rgba(34, 211, 238, 0.1)",
                        color: "#22d3ee",
                        border: "1px solid rgba(34, 211, 238, 0.2)",
                        fontSize: 11,
                      }}
                    >
                      {t}
                    </Tag>
                  ))}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Projects Section */}
      <div style={{ maxWidth: 1200, margin: "0 auto 60px" }}>
        <Title level={3} style={{ color: "white", marginBottom: 24, textAlign: "center" }}>
          项目经历
        </Title>
        <Row gutter={[24, 24]}>
          {projects.map((project, index) => (
            <Col key={index} xs={24} md={12} lg={8}>
              <Card
                bordered={false}
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(148, 163, 184, 0.1)",
                  borderRadius: 12,
                  height: "100%",
                }}
                hoverable
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(14, 165, 233, 0.2) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      color: "#22d3ee",
                      flexShrink: 0,
                      border: "2px solid rgba(34, 211, 238, 0.3)",
                    }}
                  >
                    {project.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Title level={5} style={{ color: "white", margin: 0, marginBottom: 4 }}>
                      {project.title}
                    </Title>
                    <Text style={{ color: "#64748b", fontSize: 12 }}>{project.period}</Text>
                  </div>
                </div>
                <Tag
                  style={{
                    background: "rgba(34, 211, 238, 0.15)",
                    color: "#22d3ee",
                    border: "1px solid rgba(34, 211, 238, 0.3)",
                    fontSize: 11,
                    marginBottom: 12,
                  }}
                >
                  {project.role}
                </Tag>
                <Paragraph style={{ color: "#94a3b8", marginBottom: 12, lineHeight: 1.6, fontSize: 13 }}>
                  {project.description}
                </Paragraph>
                <Space size="small" wrap>
                  {project.tags.map((tag) => (
                    <Tag
                      key={tag}
                      style={{
                        background: "rgba(148, 163, 184, 0.1)",
                        color: "#64748b",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                        fontSize: 11,
                      }}
                    >
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Certificates & Achievements */}
      <div style={{ maxWidth: 1200, margin: "0 auto 60px" }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Title level={3} style={{ color: "white", marginBottom: 24, textAlign: "center" }}>
              证书资质
            </Title>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {certificates.map((cert, index) => (
                <Card
                  key={index}
                  bordered={false}
                  style={{
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(148, 163, 184, 0.1)",
                    borderRadius: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <CheckCircleOutlined style={{ fontSize: 24, color: "#22d3ee" }} />
                    <div>
                      <Text style={{ color: "white", fontWeight: 600, display: "block" }}>
                        {cert.name}
                      </Text>
                      {cert.desc && (
                        <Text style={{ color: "#64748b", fontSize: 13 }}>{cert.desc}</Text>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Title level={3} style={{ color: "white", marginBottom: 24, textAlign: "center" }}>
              荣誉成就
            </Title>
            <Row gutter={[16, 16]}>
              {achievements.map((achievement, index) => (
                <Col key={index} span={24}>
                  <Card
                    bordered={false}
                    style={{
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(148, 163, 184, 0.1)",
                      borderRadius: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                          color: "white",
                          flexShrink: 0,
                          boxShadow: "0 0 20px rgba(34, 211, 238, 0.5)",
                          border: "2px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        {achievement.icon}
                      </div>
                      <div>
                        <Title level={5} style={{ color: "white", margin: 0, marginBottom: 4 }}>
                          {achievement.title}
                        </Title>
                        <Paragraph style={{ color: "#94a3b8", margin: 0, fontSize: 13 }}>
                          {achievement.desc}
                        </Paragraph>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </div>

      {/* Personal Evaluation */}
      <div style={{ maxWidth: 1200, margin: "0 auto 60px" }}>
        <Card
          bordered={false}
          style={{
            background: "linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)",
            border: "1px solid rgba(34, 211, 238, 0.2)",
            borderRadius: 16,
          }}
        >
          <Title level={3} style={{ color: "white", marginBottom: 24, textAlign: "center" }}>
            个人评价
          </Title>
          <Row gutter={[32, 24]}>
            <Col xs={24} md={8}>
              <div style={{ textAlign: "center" }}>
                <RocketOutlined style={{ fontSize: 36, color: "#22d3ee", marginBottom: 12 }} />
                <Title level={5} style={{ color: "white", marginBottom: 8 }}>职业热情</Title>
                <Paragraph style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>
                  热爱代码开发，对技术迭代保持敏感度，乐于探索全栈开发与算法落地结合的实践方向
                </Paragraph>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ textAlign: "center" }}>
                <CheckCircleOutlined style={{ fontSize: 36, color: "#22d3ee", marginBottom: 12 }} />
                <Title level={5} style={{ color: "white", marginBottom: 8 }}>能力特质</Title>
                <Paragraph style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>
                  具备较强抗压能力与自主学习能力，能独立负责项目模块开发，也可高效参与团队协作
                </Paragraph>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ textAlign: "center" }}>
                <TrophyOutlined style={{ fontSize: 36, color: "#22d3ee", marginBottom: 12 }} />
                <Title level={5} style={{ color: "white", marginBottom: 8 }}>职业目标</Title>
                <Paragraph style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>
                  希望以实习生身份积累实战经验，成长为算法落地方向的偏开发类全栈高级工程师
                </Paragraph>
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Footer */}
      <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center", paddingTop: 48, borderTop: "1px solid rgba(148, 163, 184, 0.1)" }}>
        <Paragraph style={{ color: "#64748b", margin: 0 }}>
          © 2026 高志羽 | 全栈开发工程师 | 数据科学与大数据技术
        </Paragraph>
      </div>
    </div>
  );
}
