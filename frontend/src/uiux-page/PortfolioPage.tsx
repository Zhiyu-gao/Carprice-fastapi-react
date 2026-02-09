import { Card, Button, Typography, Row, Col, Avatar, Space, Tag } from "antd";
import { GithubOutlined, LinkedinOutlined, MailOutlined, LinkOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

interface ProjectType {
  key: string;
  title: string;
  description: string;
  tags: string[];
  image: string;
  link: string;
}

const projects: ProjectType[] = [
  { 
    key: '1', 
    title: '电商平台', 
    description: '使用React、Node.js和MongoDB开发的全栈电商应用', 
    tags: ['React', 'Node.js', 'MongoDB', 'Redux'], 
    image: 'https://via.placeholder.com/600x400', 
    link: '#' 
  },
  { 
    key: '2', 
    title: '医疗仪表板', 
    description: '为医疗服务提供者打造的实时数据可视化分析仪表板', 
    tags: ['React', 'D3.js', 'Express', 'PostgreSQL'], 
    image: 'https://via.placeholder.com/600x400', 
    link: '#' 
  },
  { 
    key: '3', 
    title: '社交媒体应用', 
    description: '移动端优先的社交媒体应用，支持用户认证和实时聊天', 
    tags: ['React Native', 'Firebase', 'Redux', 'TypeScript'], 
    image: 'https://via.placeholder.com/600x400', 
    link: '#' 
  },
  { 
    key: '4', 
    title: 'AI图像生成器', 
    description: '使用OpenAI DALL-E从文本提示生成图像的Web应用', 
    tags: ['React', 'OpenAI', 'Node.js', 'Tailwind CSS'], 
    image: 'https://via.placeholder.com/600x400', 
    link: '#' 
  },
  { 
    key: '5', 
    title: '天气应用', 
    description: '响应式天气应用，支持地理定位和7天预报', 
    tags: ['React', 'TypeScript', 'OpenWeatherMap API', 'Styled Components'], 
    image: 'https://via.placeholder.com/600x400', 
    link: '#' 
  },
  { 
    key: '6', 
    title: '任务管理系统', 
    description: '支持拖拽功能的协作任务管理工具', 
    tags: ['React', 'DnD Kit', 'Firebase', 'Material UI'], 
    image: 'https://via.placeholder.com/600x400', 
    link: '#' 
  },
];

export default function PortfolioPage() {
  return (
    <div style={{ background: "#09090B", minHeight: "100vh", color: "white", padding: "48px 24px" }}>
      {/* Hero Section */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 80px" }}>
        <Row align="middle" gutter={[48, 24]}>
          <Col xs={24} md={12}>
            <Avatar 
              size={120} 
              src="https://via.placeholder.com/120" 
              style={{ 
                border: "4px solid #2563EB", 
                marginBottom: "24px", 
                boxShadow: "0 0 20px rgba(37, 99, 235, 0.5)"
              }}
            />
            <Title level={1} style={{ color: "white", marginBottom: "16px", fontSize: "48px" }}>
              张明
            </Title>
            <Paragraph style={{ color: "#9CA3AF", fontSize: "24px", marginBottom: "32px" }}>
              全栈开发工程师 & UI/UX设计师
            </Paragraph>
            <Paragraph style={{ color: "#D1D5DB", fontSize: "18px", lineHeight: 1.8, marginBottom: "32px" }}>
              我专注于构建美观、功能完善的Web和移动应用，注重用户体验和性能。
              拥有5年以上经验，专精于React、Node.js和现代Web技术。
            </Paragraph>
            <Space size="large" wrap>
              <Button 
                type="primary" 
                size="large" 
                style={{ 
                  background: "#2563EB", 
                  borderColor: "#2563EB", 
                  padding: "12px 32px", 
                  fontSize: "16px", 
                  fontWeight: 600 
                }}
              >
                查看项目
              </Button>
              <Button 
                size="large" 
                style={{ 
                  background: "transparent", 
                  color: "white", 
                  borderColor: "white", 
                  padding: "12px 32px", 
                  fontSize: "16px", 
                  fontWeight: 600 
                }}
              >
                <MailOutlined /> 联系我
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <Card 
                bordered={false} 
                style={{ 
                  background: "#18181B", 
                  borderRadius: "12px", 
                  boxShadow: "0 4px 6px rgba(0,0,0,0.3)", 
                  transition: "all 200ms ease", 
                  cursor: "pointer"
                }}
                hoverable
              >
                <Title level={4} style={{ color: "white", marginBottom: "16px" }}>
                  5年以上经验
                </Title>
                <Paragraph style={{ color: "#9CA3AF", lineHeight: 1.8 }}>
                  为全球客户构建高质量的Web和移动应用
                </Paragraph>
              </Card>
              <Card 
                bordered={false} 
                style={{ 
                  background: "#18181B", 
                  borderRadius: "12px", 
                  boxShadow: "0 4px 6px rgba(0,0,0,0.3)", 
                  transition: "all 200ms ease", 
                  cursor: "pointer"
                }}
                hoverable
              >
                <Title level={4} style={{ color: "white", marginBottom: "16px" }}>
                  50+项目完成
                </Title>
                <Paragraph style={{ color: "#9CA3AF", lineHeight: 1.8 }}>
                  为初创企业和大型企业交付卓越成果
                </Paragraph>
              </Card>
              <Card 
                bordered={false} 
                style={{ 
                  background: "#18181B", 
                  borderRadius: "12px", 
                  boxShadow: "0 4px 6px rgba(0,0,0,0.3)", 
                  transition: "all 200ms ease", 
                  cursor: "pointer"
                }}
                hoverable
              >
                <Title level={4} style={{ color: "white", marginBottom: "16px" }}>
                  100%客户满意度
                </Title>
                <Paragraph style={{ color: "#9CA3AF", lineHeight: 1.8 }}>
                  通过优质工作和沟通建立长期合作关系
                </Paragraph>
              </Card>
            </div>
          </Col>
        </Row>
      </div>

      {/* Skills Section */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 80px" }}>
        <Title level={2} style={{ color: "white", marginBottom: "48px", textAlign: "center" }}>
          技能与技术
        </Title>
        <Row gutter={[16, 16]} justify="center">
          {['React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Django', 'Express', 'MongoDB', 'PostgreSQL', 'Firebase', 'AWS', 'Docker', 'Git', 'HTML/CSS', 'Tailwind CSS', 'Material UI'].map((skill) => (
            <Col key={skill} xs={12} sm={8} md={6}>
              <Card 
                bordered={false} 
                style={{ 
                  background: "#18181B", 
                  borderRadius: "12px", 
                  boxShadow: "0 4px 6px rgba(0,0,0,0.3)", 
                  transition: "all 200ms ease", 
                  cursor: "pointer"
                }}
                hoverable
              >
                <Paragraph style={{ color: "white", fontSize: "18px", fontWeight: 600, margin: 0, textAlign: "center" }}>
                  {skill}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Projects Section */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 80px" }}>
        <Title level={2} style={{ color: "white", marginBottom: "48px", textAlign: "center" }}>
          精选项目
        </Title>
        <Row gutter={[24, 24]}>
          {projects.map((project) => (
            <Col key={project.key} xs={24} sm={12} md={8}>
              <Card 
                bordered={false} 
                style={{ 
                  background: "#18181B", 
                  borderRadius: "12px", 
                  boxShadow: "0 4px 6px rgba(0,0,0,0.3)", 
                  transition: "all 200ms ease", 
                  cursor: "pointer"
                }}
                hoverable
                cover={<img alt={project.title} src={project.image} style={{ borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }} />}
              >
                <Card.Meta 
                  title={<Title level={4} style={{ color: "white", marginBottom: "8px" }}>{project.title}</Title>} 
                  description={<Paragraph style={{ color: "#9CA3AF", lineHeight: 1.8, marginBottom: "16px" }}>{project.description}</Paragraph>}
                />
                <div style={{ marginBottom: "16px" }}>
                  <Space size="small" wrap>
                    {project.tags.map((tag) => (
                      <Tag key={tag} style={{ background: "#3F3F46", color: "white" }}>{tag}</Tag>
                    ))}
                  </Space>
                </div>
                <Button 
                  type="link" 
                  style={{ color: "#2563EB", fontSize: "16px", fontWeight: 600 }} 
                  icon={<LinkOutlined />}
                  href={project.link}
                  target="_blank"
                >
                  查看项目
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Contact Section */}
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <Card 
          bordered={false} 
          style={{ 
            background: "#18181B", 
            borderRadius: "12px", 
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)", 
            padding: "48px"
          }}
        >
          <Title level={2} style={{ color: "white", marginBottom: "24px", textAlign: "center" }}>
            联系我
          </Title>
          <Paragraph style={{ color: "#9CA3AF", fontSize: "18px", marginBottom: "32px", textAlign: "center" }}>
            我目前可接受自由职业和全职工作机会。
            欢迎随时联系讨论您的项目或打个招呼！
          </Paragraph>
          <Space size="large" wrap direction="vertical" style={{ width: "100%", justifyContent: "center" }}>
            <Button 
              type="primary" 
              size="large" 
              style={{ 
                background: "#2563EB", 
                borderColor: "#2563EB", 
                padding: "12px 32px", 
                fontSize: "16px", 
                fontWeight: 600 
              }}
              icon={<MailOutlined />}
            >
              发送邮件
            </Button>
            <Space size="large" wrap style={{ justifyContent: "center" }}>
              <Button 
                size="large" 
                style={{ 
                  background: "#18181B", 
                  color: "white", 
                  borderColor: "#3F3F46", 
                  padding: "12px 24px", 
                  fontSize: "16px", 
                  fontWeight: 600 
                }}
                icon={<GithubOutlined />}
              >
                GitHub
              </Button>
              <Button 
                size="large" 
                style={{ 
                  background: "#18181B", 
                  color: "white", 
                  borderColor: "#3F3F46", 
                  padding: "12px 24px", 
                  fontSize: "16px", 
                  fontWeight: 600 
                }}
                icon={<LinkedinOutlined />}
              >
                LinkedIn
              </Button>
            </Space>
          </Space>
        </Card>
      </div>
    </div>
  );
}
