import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Skeleton,
  Typography,
  Tag,
  Divider,
  Statistic,
  message,
} from "antd";
import {
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getToken } from "../auth/token";

const { Title, Text } = Typography;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface House {
  house_id: string;
  area_sqm: number;
  layout: string;
  build_year: number;
  total_price_wan: number;
  unit_price: number;
}

const BEDROOM_COLORS = [
  "#60a5fa",
  "#34d399",
  "#a78bfa",
  "#fbbf24",
  "#f472b6",
  "#38bdf8",
];

const formatWan = (v: number) => `${(v / 10000).toFixed(0)}万`;

const cardStyle: React.CSSProperties = {
  background: "#111827",
  border: "1px solid #1f2937",
};

const VisualizationPage: React.FC = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/crawl-houses`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!res.ok) throw new Error("获取房源失败");
      setHouses(await res.json());
    } catch (e: any) {
      messageApi.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouses();
  }, []);

  /* ===== 派生字段 ===== */
  const parsed = useMemo(() => {
    const year = new Date().getFullYear();
    return houses.map((h) => {
      const match = h.layout.match(/(\d+)室/);
      const bedrooms = match ? Number(match[1]) : 0;
      return {
        ...h,
        bedrooms,
        age_years: year - h.build_year,
        total_price_yuan: h.total_price_wan * 10000,
      };
    });
  }, [houses]);

  /* ===== 统计 ===== */
  const stats = useMemo(() => {
    if (!parsed.length) return null;
    const total = parsed.length;
    const sumPrice = parsed.reduce((s, h) => s + h.total_price_yuan, 0);
    const sumArea = parsed.reduce((s, h) => s + h.area_sqm, 0);

    return {
      total,
      avgPrice: sumPrice / total,
      avgUnitPrice: sumPrice / sumArea,
    };
  }, [parsed]);

  /* ===== 图表数据 ===== */
  const scatterData = parsed.map((h) => ({
    x: h.area_sqm,
    y: h.total_price_yuan,
  }));

  const barData = Object.values(
    parsed.reduce((acc: any, h) => {
      acc[h.bedrooms] ??= { bedrooms: h.bedrooms, sum: 0, cnt: 0 };
      acc[h.bedrooms].sum += h.total_price_yuan;
      acc[h.bedrooms].cnt++;
      return acc;
    }, {})
  ).map((v: any) => ({
    bedrooms: v.bedrooms,
    avg_price: v.sum / v.cnt,
  }));

  const pieData = Object.values(
    parsed.reduce((acc: any, h) => {
      acc[h.bedrooms] = (acc[h.bedrooms] || 0) + 1;
      return acc;
    }, {})
  ).map((v, i) => ({
    bedrooms: i,
    count: v,
  }));

  return (
    <div
      style={{
        padding: 16,
        background: "#0f172a",
        minHeight: "100vh",
      }}
    >
      {contextHolder}

      <Title level={3} style={{ color: "#e5e7eb" }}>
        房源数据可视化 <Tag color="blue">Analytics</Tag>
      </Title>
      <Text style={{ color: "#9ca3af" }}>
        基于真实成交与结构字段的统计分析
      </Text>

      <Divider style={{ borderColor: "#1f2937" }} />

      {loading && <Skeleton active />}

      {!loading && stats && (
        <>
          <Row gutter={16}>
            <Col span={8}>
              <Card style={cardStyle}>
                <Statistic
                  title={<span style={{ color: "#9ca3af" }}>房源数量</span>}
                  value={stats.total}
                  valueStyle={{ color: "#e5e7eb" }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={cardStyle}>
                <Statistic
                  title={<span style={{ color: "#9ca3af" }}>平均总价</span>}
                  value={formatWan(stats.avgPrice)}
                  valueStyle={{ color: "#e5e7eb" }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={cardStyle}>
                <Statistic
                  title={<span style={{ color: "#9ca3af" }}>平均单价</span>}
                  value={Math.round(stats.avgUnitPrice)}
                  suffix="元/㎡"
                  valueStyle={{ color: "#e5e7eb" }}
                />
              </Card>
            </Col>
          </Row>

          <Divider style={{ borderColor: "#1f2937" }} />
        </>
      )}

      {!loading && parsed.length > 0 && (
        <Row gutter={16}>
          <Col span={24}>
            <Card title="面积 vs 总价" style={cardStyle} headStyle={{ color: "#e5e7eb" }}>
              <ResponsiveContainer height={320}>
                <ScatterChart>
                  <CartesianGrid stroke="#1f2937" />
                  <XAxis dataKey="x" unit="㎡" stroke="#9ca3af" />
                  <YAxis tickFormatter={formatWan} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      background: "#1f2937",
                      border: "none",
                      color: "#e5e7eb",
                    }}
                    formatter={(v: number) => formatWan(v)}
                  />
                  <Scatter data={scatterData} fill="#60a5fa" />
                </ScatterChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="卧室数平均总价" style={cardStyle} headStyle={{ color: "#e5e7eb" }}>
              <ResponsiveContainer height={260}>
                <BarChart data={barData}>
                  <XAxis dataKey="bedrooms" stroke="#9ca3af" />
                  <YAxis tickFormatter={formatWan} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      background: "#1f2937",
                      border: "none",
                      color: "#e5e7eb",
                    }}
                    formatter={(v: number) => formatWan(v)}
                  />
                  <Bar dataKey="avg_price">
                    {barData.map((_, i) => (
                      <Cell key={i} fill={BEDROOM_COLORS[i % BEDROOM_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="卧室分布" style={cardStyle} headStyle={{ color: "#e5e7eb" }}>
              <ResponsiveContainer height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="count" outerRadius={80}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={BEDROOM_COLORS[i % BEDROOM_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ color: "#9ca3af" }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default VisualizationPage;
