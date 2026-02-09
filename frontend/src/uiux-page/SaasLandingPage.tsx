import { Card, Button, Typography, Row, Col, Avatar } from "antd";
import { StarOutlined, UserOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export default function SaasLandingPage() {
  return (
    <div style={{ background: "#F0F9FF", minHeight: "100vh", padding: "48px 24px" }}>
      {/* Hero Section */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 80px" }}>
        <Row align="middle" gutter={[48, 24]}>
          <Col xs={24} md={12}>
            <Title level={1} style={{ color: "#0C4A6E", marginBottom: "24px", fontSize: "48px" }}>
              使用我们的SaaS平台转变您的业务
            </Title>
            <Paragraph style={{ color: "#0C4A6E", fontSize: "20px", marginBottom: "32px", lineHeight: 1.8 }}>
              强大、可扩展且安全的软件解决方案，旨在加速您的增长并简化运营流程。
            </Paragraph>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Button 
                type="primary" 
                size="large" 
                style={{ 
                  background: "#F97316", 
                  borderColor: "#F97316", 
                  padding: "12px 32px", 
                  fontSize: "16px", 
                  fontWeight: 600 
                }}
              >
                免费开始使用
              </Button>
              <Button 
                size="large" 
                style={{ 
                  color: "#0EA5E9", 
                  borderColor: "#0EA5E9", 
                  padding: "12px 32px", 
                  fontSize: "16px", 
                  fontWeight: 600 
                }}
              >
                申请演示
              </Button>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ background: "white", borderRadius: "16px", padding: "32px", boxShadow: "0 10px 15px rgba(0,0,0,0.1)" }}>
              <Title level={3} style={{ color: "#0C4A6E", marginBottom: "24px" }}>
                立即体验
              </Title>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <input 
                  type="email" 
                  placeholder="您的工作邮箱" 
                  style={{ 
                    padding: "12px 16px", 
                    border: "1px solid #E2E8F0", 
                    borderRadius: "8px", 
                    fontSize: "16px"
                  }}
                />
                <input 
                  type="password" 
                  placeholder="创建密码" 
                  style={{ 
                    padding: "12px 16px", 
                    border: "1px solid #E2E8F0", 
                    borderRadius: "8px", 
                    fontSize: "16px"
                  }}
                />
                <Button 
                  type="primary" 
                  style={{ 
                    background: "#F97316", 
                    borderColor: "#F97316", 
                    padding: "12px", 
                    fontSize: "16px", 
                    fontWeight: 600 
                  }}
                >
                  开始免费试用
                </Button>
                <Paragraph style={{ color: "#64748B", fontSize: "14px", margin: 0, textAlign: "center" }}>
                  无需信用卡，随时可取消。
                </Paragraph>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Trusted By Section */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 80px" }}>
        <Paragraph style={{ color: "#64748B", fontSize: "16px", marginBottom: "32px", textAlign: "center" }}>
          全球10,000+企业信赖之选
        </Paragraph>
        <Row gutter={[48, 24]} justify="center">
          <Col xs={6} sm={4} md={3} style={{ textAlign: "center" }}>
            <Text style={{ color: "#0C4A6E", fontSize: "24px", fontWeight: 600 }}>公司 A</Text>
          </Col>
          <Col xs={6} sm={4} md={3} style={{ textAlign: "center" }}>
            <Text style={{ color: "#0C4A6E", fontSize: "24px", fontWeight: 600 }}>公司 B</Text>
          </Col>
          <Col xs={6} sm={4} md={3} style={{ textAlign: "center" }}>
            <Text style={{ color: "#0C4A6E", fontSize: "24px", fontWeight: 600 }}>公司 C</Text>
          </Col>
          <Col xs={6} sm={4} md={3} style={{ textAlign: "center" }}>
            <Text style={{ color: "#0C4A6E", fontSize: "24px", fontWeight: 600 }}>公司 D</Text>
          </Col>
          <Col xs={6} sm={4} md={3} style={{ textAlign: "center" }}>
            <Text style={{ color: "#0C4A6E", fontSize: "24px", fontWeight: 600 }}>公司 E</Text>
          </Col>
          <Col xs={6} sm={4} md={3} style={{ textAlign: "center" }}>
            <Text style={{ color: "#0C4A6E", fontSize: "24px", fontWeight: 600 }}>公司 F</Text>
          </Col>
        </Row>
      </div>

      {/* Features Section */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 80px" }}>
        <Title level={2} style={{ color: "#0C4A6E", marginBottom: "48px", textAlign: "center" }}>
          强大功能，提升您的生产力
        </Title>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={8}>
            <Card 
              bordered={false} 
              style={{ 
                background: "#F0F9FF", 
                borderRadius: "12px", 
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
                transition: "all 200ms ease", 
                cursor: "pointer"
              }}
              hoverable
            >
              <Title level={4} style={{ color: "#0C4A6E", marginBottom: "16px" }}>
                安全且可扩展
              </Title>
              <Paragraph style={{ color: "#0C4A6E", lineHeight: 1.8 }}>
                企业级安全性和无限可扩展性，与您的业务共同成长。
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card 
              bordered={false} 
              style={{ 
                background: "#F0F9FF", 
                borderRadius: "12px", 
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
                transition: "all 200ms ease", 
                cursor: "pointer"
              }}
              hoverable
            >
              <Title level={4} style={{ color: "#0C4A6E", marginBottom: "16px" }}>
                实时分析
              </Title>
              <Paragraph style={{ color: "#0C4A6E", lineHeight: 1.8 }}>
                追踪关键指标，通过强大的分析功能做出数据驱动的决策。
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card 
              bordered={false} 
              style={{ 
                background: "#F0F9FF", 
                borderRadius: "12px", 
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
                transition: "all 200ms ease", 
                cursor: "pointer"
              }}
              hoverable
            >
              <Title level={4} style={{ color: "#0C4A6E", marginBottom: "16px" }}>
                7×24小时支持
              </Title>
              <Paragraph style={{ color: "#0C4A6E", lineHeight: 1.8 }}>
                我们专业的支持团队随时为您提供帮助。
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Testimonials Section */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 80px" }}>
        <Title level={2} style={{ color: "#0C4A6E", marginBottom: "48px", textAlign: "center" }}>
          客户怎么说
        </Title>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={8}>
            <Card 
              bordered={false} 
              style={{ 
                background: "#F0F9FF", 
                borderRadius: "12px", 
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
                transition: "all 200ms ease", 
                cursor: "pointer"
              }}
              hoverable
            >
              <div style={{ marginBottom: "24px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarOutlined key={star} style={{ color: "#F97316", fontSize: "20px" }} />
                ))}
              </div>
              <Paragraph style={{ color: "#0C4A6E", lineHeight: 1.8, marginBottom: "24px" }}>
                "这个平台彻底改变了我们的业务运营。自实施以来，我们的生产力提升了300%。"
              </Paragraph>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: "#0EA5E9" }} />
                <div>
                  <Title level={5} style={{ color: "#0C4A6E", margin: 0 }}>
                    张晓明
                  </Title>
                  <Paragraph style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>
                    首席执行官，科技公司
                  </Paragraph>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card 
              bordered={false} 
              style={{ 
                background: "#F0F9FF", 
                borderRadius: "12px", 
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
                transition: "all 200ms ease", 
                cursor: "pointer"
              }}
              hoverable
            >
              <div style={{ marginBottom: "24px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarOutlined key={star} style={{ color: "#F97316", fontSize: "20px" }} />
                ))}
              </div>
              <Paragraph style={{ color: "#0C4A6E", lineHeight: 1.8, marginBottom: "24px" }}>
                "我们用过的最好的SaaS解决方案。客户支持非常出色，功能也是一流的。"
              </Paragraph>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: "#0EA5E9" }} />
                <div>
                  <Title level={5} style={{ color: "#0C4A6E", margin: 0 }}>
                    李建华
                  </Title>
                  <Paragraph style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>
                    技术总监，创新科技
                  </Paragraph>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card 
              bordered={false} 
              style={{ 
                background: "#F0F9FF", 
                borderRadius: "12px", 
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
                transition: "all 200ms ease", 
                cursor: "pointer"
              }}
              hoverable
            >
              <div style={{ marginBottom: "24px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarOutlined key={star} style={{ color: "#F97316", fontSize: "20px" }} />
                ))}
              </div>
              <Paragraph style={{ color: "#0C4A6E", lineHeight: 1.8, marginBottom: "24px" }}>
                "多亏了这个平台，我们得以将业务扩展到全球。集成能力令人惊叹。"
              </Paragraph>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: "#0EA5E9" }} />
                <div>
                  <Title level={5} style={{ color: "#0C4A6E", margin: 0 }}>
                    王芳
                  </Title>
                  <Paragraph style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>
                    创始人，全球扩展
                  </Paragraph>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* CTA Section */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", background: "#0EA5E9", borderRadius: "16px", padding: "64px 32px", textAlign: "center" }}>
        <Title level={2} style={{ color: "white", marginBottom: "24px" }}>
          准备好转变您的业务了吗？
        </Title>
        <Paragraph style={{ color: "white", fontSize: "20px", marginBottom: "32px", lineHeight: 1.8 }}>
          加入数千家已经在使用我们平台推动增长和提升效率的企业。
        </Paragraph>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Button 
            type="primary" 
            size="large" 
            style={{ 
              background: "#F97316", 
              borderColor: "#F97316", 
              padding: "12px 32px", 
              fontSize: "16px", 
              fontWeight: 600 
            }}
          >
            免费开始使用
          </Button>
          <Button 
            size="large" 
            style={{ 
              background: "white", 
              color: "#0EA5E9", 
              borderColor: "white", 
              padding: "12px 32px", 
              fontSize: "16px", 
              fontWeight: 600 
            }}
          >
            申请演示
          </Button>
        </div>
      </div>
    </div>
  );
}
