import { useEffect, useState } from "react";
import { Card, Table, Typography, message, Row, Col, Statistic, Tag } from "antd";
import { api, getErrorMessage } from "../api/client";
import type { TrainCar } from "../api/types";
import {
  ShoppingOutlined,
  DatabaseOutlined,
  CarOutlined,
  DollarOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const cardStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(148, 163, 184, 0.1)",
  borderRadius: 16,
  backdropFilter: "blur(12px)",
};

export default function BuyerPage() {
  const [items, setItems] = useState<TrainCar[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = async (pageNo: number) => {
    try {
      setLoading(true);
      const res = await api.get("/train-cars", {
        params: { page: pageNo, page_size: 50 },
      });
      const data = res.data || {};
      setItems(Array.isArray(data.items) ? data.items : []);
      setPage(data.page || pageNo);
      setTotal(data.total || 0);
    } catch (e: unknown) {
      message.error(getErrorMessage(e, "获取训练集失败"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  // 统计数据
  const avgPrice = items.length > 0
    ? (items.reduce((sum, item) => sum + (item.price_wan || 0), 0) / items.length).toFixed(2)
    : "0";
  
  const uniqueBrands = new Set(items.map(item => item.brand)).size;
  const uniqueCities = new Set(items.map(item => item.city)).size;

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
      render: (text: string) => <Text style={{ color: "#64748b" }}>{text}</Text>,
    },
    {
      title: "品牌",
      dataIndex: "brand",
      width: 120,
      render: (text: string) => (
        <Tag style={{ background: "rgba(34, 211, 238, 0.1)", color: "#22d3ee", border: "1px solid rgba(34, 211, 238, 0.3)" }}>
          {text}
        </Tag>
      ),
    },
    {
      title: "车型",
      dataIndex: "model",
      width: 180,
      render: (text: string) => <Text style={{ color: "#e2e8f0" }}>{text}</Text>,
    },
    {
      title: "年份",
      dataIndex: "year",
      width: 80,
      render: (text: number) => <Text style={{ color: "#94a3b8" }}>{text}</Text>,
    },
    {
      title: "城市",
      dataIndex: "city",
      width: 100,
      render: (text: string) => (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <EnvironmentOutlined style={{ color: "#64748b", fontSize: 12 }} />
          <Text style={{ color: "#94a3b8" }}>{text}</Text>
        </div>
      ),
    },
    {
      title: "变速箱",
      dataIndex: "gearbox",
      width: 100,
      render: (text: string) => <Text style={{ color: "#94a3b8" }}>{text}</Text>,
    },
    {
      title: "排量",
      dataIndex: "displacement",
      width: 100,
      render: (text: string) => <Text style={{ color: "#94a3b8" }}>{text}</Text>,
    },
    {
      title: "过户次数",
      dataIndex: "transfer_count",
      width: 100,
      render: (text: number) => <Text style={{ color: "#94a3b8" }}>{text}</Text>,
    },
    {
      title: "价格(万)",
      dataIndex: "price_wan",
      width: 120,
      render: (text: number) => (
        <Text style={{ color: "#10b981", fontWeight: 600 }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {text}
        </Text>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ color: "#f1f5f9", marginBottom: 8 }}>
          <ShoppingOutlined style={{ marginRight: 12, color: "#22d3ee" }} />
          车辆数据集
        </Title>
        <Text style={{ color: "#94a3b8" }}>
          展示已标注的干净数据（训练集）
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>总车辆</Text>}
              value={total}
              prefix={<DatabaseOutlined style={{ color: "#22d3ee" }} />}
              valueStyle={{ color: "#f1f5f9", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>品牌数</Text>}
              value={uniqueBrands}
              prefix={<CarOutlined style={{ color: "#f59e0b" }} />}
              valueStyle={{ color: "#f59e0b", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>覆盖城市</Text>}
              value={uniqueCities}
              prefix={<EnvironmentOutlined style={{ color: "#10b981" }} />}
              valueStyle={{ color: "#10b981", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>平均价格</Text>}
              value={avgPrice}
              suffix="万"
              prefix={<DollarOutlined style={{ color: "#a78bfa" }} />}
              valueStyle={{ color: "#a78bfa", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据表格 */}
      <Card style={cardStyle}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          pagination={{
            current: page,
            pageSize: 50,
            total,
            showSizeChanger: false,
            onChange: (p) => fetchData(p),
            style: { marginTop: 16 },
          }}
          columns={columns}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}
