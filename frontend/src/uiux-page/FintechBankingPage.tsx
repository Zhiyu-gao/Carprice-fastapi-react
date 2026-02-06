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
  { key: '1', name: 'Grocery Store', amount: -125.50, type: 'debit', date: '2026-02-05', category: 'Food' },
  { key: '2', name: 'Salary', amount: 3500.00, type: 'credit', date: '2026-02-01', category: 'Income' },
  { key: '3', name: 'Electric Bill', amount: -89.99, type: 'debit', date: '2026-02-03', category: 'Utilities' },
  { key: '4', name: 'Coffee Shop', amount: -4.99, type: 'debit', date: '2026-02-04', category: 'Food' },
  { key: '5', name: 'Netflix Subscription', amount: -15.99, type: 'debit', date: '2026-02-01', category: 'Entertainment' },
];

export default function FintechBankingPage() {
  return (
    <div style={{ background: "#0F172A", minHeight: "100vh", color: "white", padding: "0" }}>
      {/* Mobile Header */}
      <div style={{ background: "#1E3A8A", padding: "16px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={4} style={{ color: "white", margin: 0, fontSize: "24px" }}>
              My Bank
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
            Current Balance
          </Paragraph>
          <Statistic 
            value={5234.78} 
            prefix="$" 
            valueStyle={{ color: "white", fontSize: "48px", fontWeight: 700 }} 
          />
          <Paragraph style={{ color: "#10B981", fontSize: "16px", margin: 0, marginTop: "8px" }}>
            +$123.45 from last month
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
              Deposit
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
              Pay
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
              Transfer
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
              History
            </Button>
          </Col>
        </Row>

        {/* Cards Section */}
        <Title level={3} style={{ color: "white", marginBottom: "16px", fontSize: "24px" }}>
          My Cards
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
                  Visa Classic
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
                  Expires 12/26
                </Text>
                <Text style={{ color: "#9CA3AF", fontSize: "14px" }}>
                  John Doe
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
                  Mastercard Gold
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
                  Expires 06/27
                </Text>
                <Text style={{ color: "#9CA3AF", fontSize: "14px" }}>
                  John Doe
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Recent Transactions Section */}
        <Title level={3} style={{ color: "white", marginBottom: "16px", fontSize: "24px" }}>
          Recent Transactions
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
                  {transaction.type === 'credit' ? '+' : ''}${Math.abs(transaction.amount)}
                </Paragraph>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Financial Insights Section */}
      <div style={{ padding: "0 24px 24px" }}>
        <Title level={3} style={{ color: "white", marginBottom: "16px", fontSize: "24px" }}>
          Financial Insights
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
              Spending by Category
            </Text>
            <Button 
              type="text" 
              style={{ color: "#CA8A04", fontSize: "16px", fontWeight: 600 }}
              icon={<BarChartOutlined />}
            >
              View Chart
            </Button>
          </div>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {[
              { category: 'Food', amount: 456.78, percentage: 35 },
              { category: 'Utilities', amount: 234.56, percentage: 18 },
              { category: 'Entertainment', amount: 123.45, percentage: 10 },
              { category: 'Transportation', amount: 345.67, percentage: 27 },
              { category: 'Other', amount: 123.45, percentage: 10 }
            ].map((item) => (
              <div key={item.category} style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <Text style={{ color: "white", fontSize: "16px" }}>
                    {item.category}
                  </Text>
                  <Text style={{ color: "#9CA3AF", fontSize: "16px" }}>
                    ${item.amount}
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
