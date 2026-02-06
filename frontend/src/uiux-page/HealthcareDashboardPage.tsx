import { Card, Button, Typography, Row, Col, Statistic, Table, Space, Select, DatePicker } from "antd";
import { LineChartOutlined, BarChartOutlined, PieChartOutlined, FilterOutlined, ExportOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Paragraph } = Typography;

interface PatientDataType {
  key: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  status: string;
  lastVisit: string;
}

const columns: ColumnsType<PatientDataType> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 150 },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 80 },
  { title: 'Gender', dataIndex: 'gender', key: 'gender', width: 100 },
  { title: 'Condition', dataIndex: 'condition', key: 'condition', width: 200 },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 120 },
  { title: 'Last Visit', dataIndex: 'lastVisit', key: 'lastVisit', width: 150 },
];

const data: PatientDataType[] = [
  { key: '1', name: 'John Doe', age: 45, gender: 'Male', condition: 'Hypertension', status: 'Stable', lastVisit: '2026-02-01' },
  { key: '2', name: 'Jane Smith', age: 38, gender: 'Female', condition: 'Diabetes', status: 'Controlled', lastVisit: '2026-02-02' },
  { key: '3', name: 'Bob Johnson', age: 62, gender: 'Male', condition: 'Heart Disease', status: 'Monitoring', lastVisit: '2026-02-03' },
  { key: '4', name: 'Alice Williams', age: 29, gender: 'Female', condition: 'Asthma', status: 'Good', lastVisit: '2026-02-04' },
  { key: '5', name: 'Charlie Brown', age: 54, gender: 'Male', condition: 'Cancer', status: 'Treatment', lastVisit: '2026-02-05' },
];

export default function HealthcareDashboardPage() {
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "24px" }}>
      {/* Header Section */}
      <div style={{ maxWidth: "1400px", margin: "0 auto 24px" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ color: "#1E3A8A", margin: 0 }}>
              Healthcare Analytics Dashboard
            </Title>
            <Paragraph style={{ color: "#64748B", margin: 0 }}>
              Real-time patient monitoring and health analytics
            </Paragraph>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                style={{ 
                  background: "#F59E0B", 
                  borderColor: "#F59E0B", 
                  padding: "8px 16px"
                }}
              >
                <ExportOutlined /> Export Data
              </Button>
              <Button 
                style={{ 
                  color: "#1E40AF", 
                  borderColor: "#1E40AF", 
                  padding: "8px 16px"
                }}
              >
                <FilterOutlined /> Filter
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Stats Cards */}
      <div style={{ maxWidth: "1400px", margin: "0 auto 24px" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card 
              bordered={false} 
              style={{ 
                background: "#F8FAFC", 
                borderRadius: "12px", 
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
                transition: "all 200ms ease", 
                cursor: "pointer"
              }}
              hoverable
            >
              <Statistic 
                title="Total Patients" 
                value={1256} 
                valueStyle={{ color: "#1E40AF" }} 
                prefix={<LineChartOutlined style={{ color: "#1E40AF", fontSize: "24px" }} />}
              />
              <Paragraph style={{ color: "#64748B", fontSize: "14px", margin: 0, marginTop: "8px" }}>
                +12% from last month
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              bordered={false} 
              style={{ 
                background: "#F8FAFC", 
                borderRadius: "12px", 
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
                transition: "all 200ms ease", 
                cursor: "pointer"
              }}
              hoverable
            >
              <Statistic 
                title="Active Cases" 
                value={342} 
                valueStyle={{ color: "#F59E0B" }} 
                prefix={<BarChartOutlined style={{ color: "#F59E0B", fontSize: "24px" }} />}
              />
              <Paragraph style={{ color: "#64748B", fontSize: "14px", margin: 0, marginTop: "8px" }}>
                +5% from last week
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              bordered={false} 
              style={{ 
                background: "#F8FAFC", 
                borderRadius: "12px", 
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
                transition: "all 200ms ease", 
                cursor: "pointer"
              }}
              hoverable
            >
              <Statistic 
                title="Recovery Rate" 
                value={89.2} 
                suffix="%" 
                valueStyle={{ color: "#10B981" }} 
                prefix={<PieChartOutlined style={{ color: "#10B981", fontSize: "24px" }} />}
              />
              <Paragraph style={{ color: "#64748B", fontSize: "14px", margin: 0, marginTop: "8px" }}>
                +2.3% from last month
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              bordered={false} 
              style={{ 
                background: "#F8FAFC", 
                borderRadius: "12px", 
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
                transition: "all 200ms ease", 
                cursor: "pointer"
              }}
              hoverable
            >
              <Statistic 
                title="Average Stay" 
                value={4.2} 
                suffix="days" 
                valueStyle={{ color: "#EF4444" }} 
                prefix={<LineChartOutlined style={{ color: "#EF4444", fontSize: "24px" }} />}
              />
              <Paragraph style={{ color: "#64748B", fontSize: "14px", margin: 0, marginTop: "8px" }}>
                -0.5 days from last month
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Charts Section */}
      <div style={{ maxWidth: "1400px", margin: "0 auto 24px" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card 
              bordered={false} 
              style={{ 
                background: "#F8FAFC", 
                borderRadius: "12px", 
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
                transition: "all 200ms ease", 
                cursor: "pointer"
              }}
              hoverable
              title="Patient Admissions Trend"
              extra={<Button size="small" style={{ color: "#1E40AF", borderColor: "#1E40AF" }}>View Details</Button>}
            >
              <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Paragraph style={{ color: "#64748B", fontSize: "18px" }}>
                  Line Chart Placeholder
                </Paragraph>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card 
              bordered={false} 
              style={{ 
                background: "#F8FAFC", 
                borderRadius: "12px", 
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
                transition: "all 200ms ease", 
                cursor: "pointer"
              }}
              hoverable
              title="Condition Distribution"
              extra={<Button size="small" style={{ color: "#1E40AF", borderColor: "#1E40AF" }}>View Details</Button>}
            >
              <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Paragraph style={{ color: "#64748B", fontSize: "18px" }}>
                  Pie Chart Placeholder
                </Paragraph>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Patient Table Section */}
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <Card 
          bordered={false} 
          style={{ 
            background: "#F8FAFC", 
            borderRadius: "12px", 
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}
          title="Recent Patients"
          extra={
            <Space>
              <Select defaultValue="all" style={{ width: 120 }}>
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="stable">Stable</Select.Option>
                <Select.Option value="monitoring">Monitoring</Select.Option>
                <Select.Option value="treatment">Treatment</Select.Option>
              </Select>
              <DatePicker.RangePicker style={{ width: 250 }} />
            </Space>
          }
        >
          <Table 
            columns={columns} 
            dataSource={data} 
            pagination={{ pageSize: 10 }} 
            scroll={{ x: 800 }} 
            rowKey="key"
            style={{ background: "white", borderRadius: "8px" }}
          />
        </Card>
      </div>
    </div>
  );
}
