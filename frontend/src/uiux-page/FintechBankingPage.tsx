import { Card, Button, Typography, Row, Col, Statistic, Space } from "antd";
import { WalletOutlined, CreditCardOutlined, SwapOutlined, HistoryOutlined, BarChartOutlined, BellOutlined, SettingOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

interface TransactionType {
  key: string;
  name: string;
  amount: number;
  type: string;
  date: string;
  category: string;
}

const transactions: TransactionType[] = [
  { key: '1', name: '杂货店', amount: -125.50, type: 'debit', date: '2026-02-05', category: '食品' },
  { key: '2', name: '工资', amount: 3500.00, type: 'credit', date: '2026-02-01', category: '收入' },
  { key: '3', name: '电费', amount: -89.99, type: 'debit', date: '2026-02-03', category: '水电' },
  { key: '4', name: '咖啡店', amount: -4.99, type: 'debit', date: '2026-02-04', category: '食品' },
  { key: '5', name: 'Netflix订阅', amount: -15.99, type: 'debit', date: '2026-02-01', category: '娱乐' },
];

export default function FintechBankingPage() {
  return (
    <div style={{ background: "#0F172A", minHeight: "100vh", color: "white", padding: "0" }}>
      {/* Mobile Header */}
      <div style={{ background: "#1E3A8A", padding: "16px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={4} style={{ color: "white", margin: 0, fontSize: "24px" }}>
              我的银行
            </Title>
          </Col>
          <Col>
            <Space>
              <Button 
                type="text" 
                icon={<BellOutlined style={{ fontSize: "24px", color: "white" }} />}
              />
              <Button 
                type="text" 
                icon={<SettingOutlined style={{ fontSize: "24px", color: "white" }} />}
              />
            </Space>
          </Col>
        </Row>
      </div>

      {/* Account Summary Section */}
      <div style={{ padding: "24px" }}>
        <Card 
          bordered={false} 
          style={{ 
            background: "#1E3A8A", 
            borderRadius: "12px", 
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)", 
            marginBottom: "24px"
          }}
        >
          <Paragraph style={{ color: "#9CA3AF", fontSize: "16px", marginBottom: "8px" }}>
            当前余额
          </Paragraph>
          <Statistic 
            value={5234.78} 
            prefix="¥" 
            valueStyle={{ color: "white", fontSize: "48px", fontWeight: 700 }} 
          />
          <Paragraph style={{ color: "#10B981", fontSize: "16px", margin: 0, marginTop: "8px" }}>
            较上月增加¥123.45
          </Paragraph>
        </Card>

        {/* Quick Actions */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col xs={12} sm={6} md={3}>
            <Button 
              type="primary" 
              block 
              style={{ 
                background: "#CA8A04", 
                borderColor: "#CA8A04", 
                padding: "24px 16px", 
                borderRadius: "12px", 
                fontSize: "16px", 
                fontWeight: 600 
              }}
              icon={<WalletOutlined style={{ fontSize: "24px", marginBottom: "8px" }} />}
            >
              存款
            </Button>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Button 
              type="primary" 
              block 
              style={{ 
                background: "#CA8A04", 
                borderColor: "#CA8A04", 
                padding: "24px 16px", 
                borderRadius: "12px", 
                fontSize: "16px", 
                fontWeight: 600 
              }}
              icon={<CreditCardOutlined style={{ fontSize: "24px", marginBottom: "8px" }} />}
            >
              支付
            </Button>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Button 
              type="primary" 
              block 
              style={{ 
                background: "#CA8A04", 
                borderColor: "#CA8A04", 
                padding: "24px 16px", 
                borderRadius: "12px", 
                fontSize: "16px", 
                fontWeight: 600 
              }}
              icon={<SwapOutlined style={{ fontSize: "24px", marginBottom: "8px" }} />}
            >
              转账
            </Button>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Button 
              type="primary" 
              block 
              style={{ 
                background: "#CA8A04", 
                borderColor: "#CA8A04", 
                padding: "24px 16px", 
                borderRadius: "12px", 
                fontSize: "16px", 
                fontWeight: 600 
              }}
              icon={<HistoryOutlined style={{ fontSize: "24px", marginBottom: "8px" }} />}
            >
              历史
            </Button>
          </Col>
        </Row>

        {/* Cards Section */}
        <Title level={3} style={{ color: "white", marginBottom: "16px", fontSize: "24px" }}>
          我的卡片
        </Title>
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col xs={24} sm={12}>
            <Card 
              bordered={false} 
              style={{ 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
                borderRadius: "12px", 
                boxShadow: "0 4px 6px rgba(0,0,0,0.3)", 
                padding: "24px", 
                cursor: "pointer"
              }}
              hoverable
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                <Text style={{ color: "white", fontSize: "18px", fontWeight: 600 }}>
                   Visa经典卡
                </Text>
                <Text style={{ color: "white", fontSize: "24px" }}>
                  💳
                </Text>
              </div>
              <Paragraph style={{ color: "white", fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
                  **** **** **** 1234
              </Paragraph>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text style={{ color: "#9CA3AF", fontSize: "14px" }}>
                  有效期 12/26
                </Text>
                <Text style={{ color: "#9CA3AF", fontSize: "14px" }}>
                  张明
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card 
              bordered={false} 
              style={{ 
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", 
                borderRadius: "12px", 
                boxShadow: "0 4px 6px rgba(0,0,0,0.3)", 
                padding: "24px", 
                cursor: "pointer"
              }}
              hoverable
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                <Text style={{ color: "white", fontSize: "18px", fontWeight: 600 }}>
                  万事达金卡
                </Text>
                <Text style={{ color: "white", fontSize: "24px" }}>
                  💳
                </Text>
              </div>
              <Paragraph style={{ color: "white", fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
                  **** **** **** 5678
              </Paragraph>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text style={{ color: "#9CA3AF", fontSize: "14px" }}>
                  有效期 06/27
                </Text>
                <Text style={{ color: "#9CA3AF", fontSize: "14px" }}>
                  张明
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Recent Transactions Section */}
        <Title level={3} style={{ color: "white", marginBottom: "16px", fontSize: "24px" }}>
          最近交易
        </Title>
        <Card 
          bordered={false} 
          style={{ 
            background: "#1E3A8A", 
            borderRadius: "12px", 
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
          }}
        >
          {transactions.map((transaction) => (
            <div key={transaction.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "8px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  background: transaction.type === 'credit' ? '#10B981' : '#EF4444'
                }}>
                  {transaction.type === 'credit' ? '+' : '-'}
                </div>
                <div>
                  <Paragraph style={{ color: "white", fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                    {transaction.name}
                  </Paragraph>
                  <Paragraph style={{ color: "#9CA3AF", fontSize: "14px", margin: 0 }}>
                    {transaction.date} • {transaction.category}
                  </Paragraph>
                </div>
              </div>
              <div>
                <Paragraph style={{ 
                  color: transaction.type === 'credit' ? '#10B981' : '#EF4444', 
                  fontSize: "18px", 
                  fontWeight: 600, 
                  margin: 0 
                }}>
                  {transaction.type === 'credit' ? '+' : ''}¥{Math.abs(transaction.amount)}
                </Paragraph>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Financial Insights Section */}
      <div style={{ padding: "0 24px 24px" }}>
        <Title level={3} style={{ color: "white", marginBottom: "16px", fontSize: "24px" }}>
          财务洞察
        </Title>
        <Card 
          bordered={false} 
          style={{ 
            background: "#1E3A8A", 
            borderRadius: "12px", 
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)", 
            padding: "24px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
            <Text style={{ color: "white", fontSize: "18px", fontWeight: 600 }}>
              按类别支出
            </Text>
            <Button 
              type="text" 
              style={{ color: "#CA8A04", fontSize: "16px", fontWeight: 600 }}
              icon={<BarChartOutlined />}
            >
              查看图表
            </Button>
          </div>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {[
              { category: '食品', amount: 456.78, percentage: 35 },
              { category: '水电', amount: 234.56, percentage: 18 },
              { category: '娱乐', amount: 123.45, percentage: 10 },
              { category: '交通', amount: 345.67, percentage: 27 },
              { category: '其他', amount: 123.45, percentage: 10 }
            ].map((item) => (
              <div key={item.category} style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <Text style={{ color: "white", fontSize: "16px" }}>
                    {item.category}
                  </Text>
                  <Text style={{ color: "#9CA3AF", fontSize: "16px" }}>
                    ¥{item.amount}
                  </Text>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#3F3F46", borderRadius: "4px" }}>
                  <div style={{ 
                    width: `${item.percentage}%`, 
                    height: "100%", 
                    background: "#CA8A04", 
                    borderRadius: "4px"
                  }} />
                </div>
              </div>
            ))}
          </Space>
        </Card>
      </div>
    </div>
  );
}
