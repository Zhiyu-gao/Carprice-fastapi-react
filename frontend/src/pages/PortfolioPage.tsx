import { Card, Button, Typography, Row, Col, Avatar, Space, Tag } from "antd";
import { GithubOutlined, LinkedinOutlined, MailOutlined, LinkOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

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
    title: 'E-commerce Platform', 
    description: 'Full-stack e-commerce application with React, Node.js, and MongoDB', 
    tags: ['React', 'Node.js', 'MongoDB', 'Redux'], 
    image: 'https://via.placeholder.com/600x400', 
    link: '#' 
  },
  { 
    key: '2', 
    title: 'Healthcare Dashboard', 
    description: 'Analytics dashboard for healthcare providers with real-time data visualization', 
    tags: ['React', 'D3.js', 'Express', 'PostgreSQL'], 
    image: 'https://via.placeholder.com/600x400', 
    link: '#' 
  },
  { 
    key: '3', 
    title: 'Social Media App', 
    description: 'Mobile-first social media application with user authentication and real-time chat', 
    tags: ['React Native', 'Firebase', 'Redux', 'TypeScript'], 
    image: 'https://via.placeholder.com/600x400', 
    link: '#' 
  },
  { 
    key: '4', 
    title: 'AI Image Generator', 
    description: 'Web application that generates images from text prompts using OpenAI DALL-E', 
    tags: ['React', 'OpenAI', 'Node.js', 'Tailwind CSS'], 
    image: 'https://via.placeholder.com/600x400', 
    link: '#' 
  },
  { 
    key: '5', 
    title: 'Weather App', 
    description: 'Responsive weather application with geolocation and 7-day forecast', 
    tags: ['React', 'TypeScript', 'OpenWeatherMap API', 'Styled Components'], 
    image: 'https://via.placeholder.com/600x400', 
    link: '#' 
  },
  { 
    key: '6', 
    title: 'Task Management System', 
    description: 'Collaborative task management tool with drag-and-drop functionality', 
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
              John Doe
            </Title>
            <Paragraph style={{ color: "#9CA3AF", fontSize: "24px", marginBottom: "32px" }}>
              Full-Stack Developer & UI/UX Designer
            </Paragraph>
            <Paragraph style={{ color: "#D1D5DB", fontSize: "18px", lineHeight: 1.8, marginBottom: "32px" }}>
              I build beautiful, functional web and mobile applications with a focus on user experience
              and performance. With 5+ years of experience, I specialize in React, Node.js, and modern
              web technologies.
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
                View Projects
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
                <MailOutlined /> Contact Me
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
                  5+ Years Experience
                </Title>
                <Paragraph style={{ color: "#9CA3AF", lineHeight: 1.8 }}>
                  Building high-quality web and mobile applications for clients worldwide
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
                  50+ Projects Completed
                </Title>
                <Paragraph style={{ color: "#9CA3AF", lineHeight: 1.8 }}>
                  Delivering exceptional results for startups and enterprises
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
                  100% Client Satisfaction
                </Title>
                <Paragraph style={{ color: "#9CA3AF", lineHeight: 1.8 }}>
                  Building long-term relationships through quality work and communication
                </Paragraph>
              </Card>
            </div>
          </Col>
        </Row>
      </div>

      {/* Skills Section */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 80px" }}>
        <Title level={2} style={{ color: "white", marginBottom: "48px", textAlign: "center" }}>
          Skills & Technologies
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
          Featured Projects
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
                  View Project
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
            Get In Touch
          </Title>
          <Paragraph style={{ color: "#9CA3AF", fontSize: "18px", marginBottom: "32px", textAlign: "center" }}>
            I'm currently available for freelance work and full-time opportunities.
            Feel free to reach out to discuss your project or just say hello!
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
              Send Email
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
