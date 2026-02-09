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
  { title: '姓名', dataIndex: 'name', key: 'name', width: 150 },
  { title: '年龄', dataIndex: 'age', key: 'age', width: 80 },
  { title: '性别', dataIndex: 'gender', key: 'gender', width: 100 },
  { title: '病情', dataIndex: 'condition', key: 'condition', width: 200 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '最近就诊', dataIndex: 'lastVisit', key: 'lastVisit', width: 150 },
];

const data: PatientDataType[] = [
  { key: '1', name: '张三', age: 45, gender: '男', condition: '高血压', status: '稳定', lastVisit: '2026-02-01' },
  { key: '2', name: '李四', age: 38, gender: '女', condition: '糖尿病', status: '控制中', lastVisit: '2026-02-02' },
  { key: '3', name: '王五', age: 62, gender: '男', condition: '心脏病', status: '监测中', lastVisit: '2026-02-03' },
  { key: '4', name: '赵六', age: 29, gender: '女', condition: '哮喘', status: '良好', lastVisit: '2026-02-04' },
  { key: '5', name: '陈七', age: 54, gender: '男', condition: '癌症', status: '治疗中', lastVisit: '2026-02-05' },
];

export default function HealthcareDashboardPage() {
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "24px" }}>
      {/* Header Section */}
      <div style={{ maxWidth: "1400px", margin: "0 auto 24px" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ color: "#1E3A8A", margin: 0 }}>
              医疗健康数据分析仪表板
            </Title>
            <Paragraph style={{ color: "#64748B", margin: 0 }}>
              实时患者监测与健康数据分析
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
                <ExportOutlined /> 导出数据
              </Button>
              <Button 
                style={{ 
                  color: "#1E40AF", 
                  borderColor: "#1E40AF", 
                  padding: "8px 16px"
                }}
              >
                <FilterOutlined /> 筛选
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
                title="总患者数" 
                value={1256} 
                valueStyle={{ color: "#1E40AF" }} 
                prefix={<LineChartOutlined style={{ color: "#1E40AF", fontSize: "24px" }} />}
              />
              <Paragraph style={{ color: "#64748B", fontSize: "14px", margin: 0, marginTop: "8px" }}>
                较上月增长12%
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
                title="活跃病例" 
                value={342} 
                valueStyle={{ color: "#F59E0B" }} 
                prefix={<BarChartOutlined style={{ color: "#F59E0B", fontSize: "24px" }} />}
              />
              <Paragraph style={{ color: "#64748B", fontSize: "14px", margin: 0, marginTop: "8px" }}>
                较上周增长5%
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
                title="康复率" 
                value={89.2} 
                suffix="%" 
                valueStyle={{ color: "#10B981" }} 
                prefix={<PieChartOutlined style={{ color: "#10B981", fontSize: "24px" }} />}
              />
              <Paragraph style={{ color: "#64748B", fontSize: "14px", margin: 0, marginTop: "8px" }}>
                较上月增长2.3%
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
                title="平均住院天数" 
                value={4.2} 
                suffix="天" 
                valueStyle={{ color: "#EF4444" }} 
                prefix={<LineChartOutlined style={{ color: "#EF4444", fontSize: "24px" }} />}
              />
              <Paragraph style={{ color: "#64748B", fontSize: "14px", margin: 0, marginTop: "8px" }}>
                较上月减少0.5天
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
              title="患者入院趋势"
              extra={<Button size="small" style={{ color: "#1E40AF", borderColor: "#1E40AF" }}>查看详情</Button>}
            >
              <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Paragraph style={{ color: "#64748B", fontSize: "18px" }}>
                  折线图占位
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
              title="病情分布"
              extra={<Button size="small" style={{ color: "#1E40AF", borderColor: "#1E40AF" }}>查看详情</Button>}
            >
              <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Paragraph style={{ color: "#64748B", fontSize: "18px" }}>
                  饼图占位
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
          title="最近患者"
          extra={
            <Space>
              <Select defaultValue="all" style={{ width: 120 }}>
                <Select.Option value="all">全部状态</Select.Option>
                <Select.Option value="stable">稳定</Select.Option>
                <Select.Option value="monitoring">监测中</Select.Option>
                <Select.Option value="treatment">治疗中</Select.Option>
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
