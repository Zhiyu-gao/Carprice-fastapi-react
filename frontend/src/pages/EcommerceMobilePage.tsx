import { Card, Button, Typography, Row, Col, Image, Space, Tag, Input, Badge } from "antd";
import { SearchOutlined, ShoppingCartOutlined, HeartOutlined, StarOutlined, FilterOutlined, MenuOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

interface ProductType {
  key: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  image: string;
  category: string;
}

const products: ProductType[] = [
  { 
    key: '1', 
    name: 'Wireless Headphones', 
    price: 149.99, 
    originalPrice: 199.99, 
    discount: 25, 
    rating: 4.8, 
    image: 'https://via.placeholder.com/300x300', 
    category: 'Electronics' 
  },
  { 
    key: '2', 
    name: 'Smart Watch', 
    price: 299.99, 
    originalPrice: 349.99, 
    discount: 14, 
    rating: 4.7, 
    image: 'https://via.placeholder.com/300x300', 
    category: 'Electronics' 
  },
  { 
    key: '3', 
    name: 'Bluetooth Speaker', 
    price: 79.99, 
    originalPrice: 99.99, 
    discount: 20, 
    rating: 4.6, 
    image: 'https://via.placeholder.com/300x300', 
    category: 'Electronics' 
  },
  { 
    key: '4', 
    name: 'Wireless Charger', 
    price: 29.99, 
    originalPrice: 39.99, 
    discount: 25, 
    rating: 4.5, 
    image: 'https://via.placeholder.com/300x300', 
    category: 'Electronics' 
  },
  { 
    key: '5', 
    name: 'Phone Case', 
    price: 19.99, 
    originalPrice: 29.99, 
    discount: 33, 
    rating: 4.4, 
    image: 'https://via.placeholder.com/300x300', 
    category: 'Accessories' 
  },
  { 
    key: '6', 
    name: 'Screen Protector', 
    price: 14.99, 
    originalPrice: 19.99, 
    discount: 25, 
    rating: 4.3, 
    image: 'https://via.placeholder.com/300x300', 
    category: 'Accessories' 
  },
];

export default function EcommerceMobilePage() {
  return (
    <div style={{ background: "#ECFDF5", minHeight: "100vh", padding: "0" }}>
      {/* Mobile Header */}
      <div style={{ background: "white", padding: "16px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Row align="middle" gutter={[16, 16]}>
          <Col xs={2}>
            <Button 
              type="text" 
              icon={<MenuOutlined style={{ fontSize: "24px", color: "#064E3B" }} />}
            />
          </Col>
          <Col xs={20}>
            <Input 
              placeholder="Search products..." 
              prefix={<SearchOutlined style={{ color: "#064E3B" }} />}
              style={{ 
                background: "#ECFDF5", 
                borderColor: "#10B981", 
                borderRadius: "8px", 
                fontSize: "16px", 
                padding: "12px 16px"
              }}
            />
          </Col>
          <Col xs={2}>
            <Badge count={5} showZero color="#F97316">
              <Button 
                type="text" 
                icon={<ShoppingCartOutlined style={{ fontSize: "24px", color: "#064E3B" }} />}
              />
            </Badge>
          </Col>
        </Row>
      </div>

      {/* Hero Section */}
      <div style={{ background: "#059669", padding: "32px 24px", marginBottom: "24px" }}>
        <Title level={2} style={{ color: "white", marginBottom: "16px", fontSize: "32px" }}>
          Summer Sale
        </Title>
        <Paragraph style={{ color: "white", fontSize: "18px", marginBottom: "24px" }}>
          Up to 50% off on selected products
        </Paragraph>
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
          Shop Now
        </Button>
      </div>

      {/* Categories Section */}
      <div style={{ padding: "0 24px 24px" }}>
        <Title level={3} style={{ color: "#064E3B", marginBottom: "24px", fontSize: "24px" }}>
          Categories
        </Title>
        <Row gutter={[16, 16]}>
          {['Electronics', 'Clothing', 'Home', 'Beauty', 'Sports', 'Books'].map((category) => (
            <Col key={category} xs={8} sm={6} md={4}>
              <Card 
                bordered={false} 
                style={{ 
                  background: "white", 
                  borderRadius: "12px", 
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
                  transition: "all 200ms ease", 
                  cursor: "pointer", 
                  padding: "16px"
                }}
                hoverable
              >
                <div style={{ width: "60px", height: "60px", background: "#ECFDF5", borderRadius: "8px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#059669", fontSize: "24px", fontWeight: 600 }}>
                    {category.charAt(0)}
                  </Text>
                </div>
                <Paragraph style={{ color: "#064E3B", fontSize: "14px", fontWeight: 600, margin: 0, textAlign: "center" }}>
                  {category}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Featured Products Section */}
      <div style={{ padding: "0 24px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <Title level={3} style={{ color: "#064E3B", margin: 0, fontSize: "24px" }}>
            Featured Products
          </Title>
          <Button 
            type="text" 
            style={{ color: "#059669", fontSize: "16px", fontWeight: 600 }}
            icon={<FilterOutlined />}
          >
            Filter
          </Button>
        </div>
        <Row gutter={[16, 16]}>
          {products.map((product) => (
            <Col key={product.key} xs={12} sm={8} md={6}>
              <Card 
                bordered={false} 
                style={{ 
                  background: "white", 
                  borderRadius: "12px", 
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
                  transition: "all 200ms ease", 
                  cursor: "pointer"
                }}
                hoverable
              >
                <div style={{ position: "relative" }}>
                  <Image 
                    alt={product.name} 
                    src={product.image} 
                    style={{ width: "100%", height: "200px", objectFit: "cover", borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}
                  />
                  <Badge 
                    count={`-${product.discount}%`} 
                    style={{ 
                      background: "#F97316", 
                      borderRadius: "4px", 
                      padding: "4px 8px", 
                      fontSize: "12px", 
                      fontWeight: 600
                    }}
                    offset={[12, 12]}
                  />
                  <Button 
                    type="text" 
                    icon={<HeartOutlined style={{ fontSize: "20px", color: "#EF4444" }} />}
                    style={{ 
                      position: "absolute", 
                      top: "12px", 
                      right: "12px", 
                      background: "white", 
                      borderRadius: "50%", 
                      width: "40px", 
                      height: "40px", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}
                  />
                </div>
                <Card.Meta 
                  title={<Title level={5} style={{ color: "#064E3B", marginBottom: "8px", fontSize: "16px" }}>{product.name}</Title>} 
                  description={
                    <Space direction="vertical" size="small" style={{ width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Text style={{ color: "#F97316", fontSize: "20px", fontWeight: 600 }}>
                          ${product.price}
                        </Text>
                        <Text style={{ color: "#9CA3AF", fontSize: "14px", textDecoration: "line-through" }}>
                          ${product.originalPrice}
                        </Text>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarOutlined 
                            key={star} 
                            style={{ 
                              color: star <= Math.floor(product.rating) ? "#FBBF24" : "#D1D5DB", 
                              fontSize: "16px"
                            }}
                          />
                        ))}
                        <Text style={{ color: "#9CA3AF", fontSize: "14px" }}>
                          ({product.rating})
                        </Text>
                      </div>
                    </Space>
                  }
                />
                <Button 
                  type="primary" 
                  style={{ 
                    background: "#059669", 
                    borderColor: "#059669", 
                    width: "100%", 
                    borderRadius: "8px", 
                    padding: "12px", 
                    fontSize: "16px", 
                    fontWeight: 600 
                  }}
                  icon={<ShoppingCartOutlined />}
                >
                  Add to Cart
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Footer */}
      <div style={{ background: "white", padding: "24px", borderTop: "1px solid #E2E8F0" }}>
        <Row gutter={[16, 16]} justify="center">
          <Col xs={6} sm={4} md={3}>
            <Button 
              type="text" 
              style={{ color: "#064E3B", fontSize: "16px", fontWeight: 600 }}
            >
              Home
            </Button>
          </Col>
          <Col xs={6} sm={4} md={3}>
            <Button 
              type="text" 
              style={{ color: "#064E3B", fontSize: "16px", fontWeight: 600 }}
            >
              Shop
            </Button>
          </Col>
          <Col xs={6} sm={4} md={3}>
            <Button 
              type="text" 
              style={{ color: "#064E3B", fontSize: "16px", fontWeight: 600 }}
            >
              Cart
            </Button>
          </Col>
          <Col xs={6} sm={4} md={3}>
            <Button 
              type="text" 
              style={{ color: "#064E3B", fontSize: "16px", fontWeight: 600 }}
            >
              Profile
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  );
}
