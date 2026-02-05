import { Card, Button, Typography, Divider, Row, Col, Avatar, Statistic } from "antd";
import { StarOutlined, CheckOutlined, UserOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export default function SaasLandingPage() {
  return (
    <div style={{ background: "#F0F9FF", minHeight: "100vh", padding: "48px 24px" }}>
      {/* Hero Section */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 80px" }}>
        <Row align="middle" gutter={[48, 24]}>
          <Col xs={24} md={12}>
            <Title level={1} style={{ color: "#0C4A6E", marginBottom: "24px", fontSize: "48px" }}>
              Transform Your Business with Our SaaS Platform
            </Title>
            <Paragraph style={{ color: "#0C4A6E", fontSize: "20px", marginBottom: "32px", lineHeight: 1.8 }}>
              Powerful, scalable, and secure software solutions designed to accelerate your growth
              and streamline operations.
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
                Get Started Free
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
                Request Demo
              </Button>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ background: "white", borderRadius: "16px", padding: "32px", boxShadow: "0 10px 15px rgba(0,0,0,0.1)" }}>
              <Title level={3} style={{ color: "#0C4A6E", marginBottom: "24px" }}>
                Try It Now
              </Title>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <input 
                  type="email" 
                  placeholder="Your work email" 
                  style={{ 
                    padding: "12px 16px", 
                    border: "1px solid #E2E8F0", 
                    borderRadius: "8px", 
                    fontSize: "16px"
                  }}
                />
                <input 
                  type="password" 
                  placeholder="Create password" 
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
                  Start Free Trial
                </Button>
                <Paragraph style={{ color: "#64748B", fontSize: "14px", margin: 0, textAlign: "center" }}>
                  No credit card required. Cancel anytime.
                </Paragraph>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Trusted By Section */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 80px" }}>
        <Paragraph style={{ color: "#64748B", fontSize: "16px", marginBottom: "32px", textAlign: "center" }}>
          TRUSTED BY 10,000+ BUSINESSES WORLDWIDE
        </Paragraph>
        <Row gutter={[48, 24]} justify="center">
          <Col xs={6} sm={4} md={3} style={{ textAlign: "center" }}>
            <Text style={{ color: "#0C4A6E", fontSize: "24px", fontWeight: 600 }}>Company A</Text>
          </Col>
          <Col xs={6} sm={4} md={3} style={{ textAlign: "center" }}>
            <Text style={{ color: "#0C4A6E", fontSize: "24px", fontWeight: 600 }}>Company B</Text>
          </Col>
          <Col xs={6} sm={4} md={3} style={{ textAlign: "center" }}>
            <Text style={{ color: "#0C4A6E", fontSize: "24px", fontWeight: 600 }}>Company C</Text>
          </Col>
          <Col xs={6} sm={4} md={3} style={{ textAlign: "center" }}>
            <Text style={{ color: "#0C4A6E", fontSize: "24px", fontWeight: 600 }}>Company D</Text>
          </Col>
          <Col xs={6} sm={4} md={3} style={{ textAlign: "center" }}>
            <Text style={{ color: "#0C4A6E", fontSize: "24px", fontWeight: 600 }}>Company E</Text>
          </Col>
          <Col xs={6} sm={4} md={3} style={{ textAlign: "center" }}>
            <Text style={{ color: "#0C4A6E", fontSize: "24px", fontWeight: 600 }}>Company F</Text>
          </Col>
        </Row>
      </div>

      {/* Features Section */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 80px" }}>
        <Title level={2} style={{ color: "#0C4A6E", marginBottom: "48px", textAlign: "center" }}>
          Powerful Features to Boost Your Productivity
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
                Secure & Scalable
              </Title>
              <Paragraph style={{ color: "#0C4A6E", lineHeight: 1.8 }}>
                Enterprise-grade security and unlimited scalability to grow with your business.
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
                Real-time Analytics
              </Title>
              <Paragraph style={{ color: "#0C4A6E", lineHeight: 1.8 }}>
                Track key metrics and make data-driven decisions with powerful analytics.
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
                24/7 Support
              </Title>
              <Paragraph style={{ color: "#0C4A6E", lineHeight: 1.8 }}>
                Get help whenever you need it from our dedicated support team.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Testimonials Section */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 80px" }}>
        <Title level={2} style={{ color: "#0C4A6E", marginBottom: "48px", textAlign: "center" }}>
          What Our Customers Say
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
                "This platform has transformed our business operations. We've seen a 300% increase in productivity since implementing it."
              </Paragraph>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: "#0EA5E9" }} />
                <div>
                  <Title level={5} style={{ color: "#0C4A6E", margin: 0 }}>
                    Sarah Johnson
                  </Title>
                  <Paragraph style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>
                    CEO, TechCorp
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
                "The best SaaS solution we've ever used. The customer support is exceptional and the features are top-notch."
              </Paragraph>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: "#0EA5E9" }} />
                <div>
                  <Title level={5} style={{ color: "#0C4A6E", margin: 0 }}>
                    Michael Chen
                  </Title>
                  <Paragraph style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>
                    CTO, Innovatech
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
                "We were able to scale our business globally thanks to this platform. The integration capabilities are amazing."
              </Paragraph>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: "#0EA5E9" }} />
                <div>
                  <Title level={5} style={{ color: "#0C4A6E", margin: 0 }}>
                    Emily Rodriguez
                  </Title>
                  <Paragraph style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>
                    Founder, GlobalScale
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
          Ready to Transform Your Business?
        </Title>
        <Paragraph style={{ color: "white", fontSize: "20px", marginBottom: "32px", lineHeight: 1.8 }}>
          Join thousands of businesses already using our platform to drive growth and efficiency.
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
            Get Started Free
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
            Request Demo
          </Button>
        </div>
      </div>
    </div>
  );
}
