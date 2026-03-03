import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Skeleton,
  Typography,
  Tag,
  Statistic,
  message,
} from "antd";
import {
  BarChartOutlined,
  LineChartOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { api, getErrorMessage } from "../api/client";
import type { CrawlCar, PageResp } from "../api/types";

const { Title, Text, Paragraph } = Typography;

/* ================= 数据结构（真实对齐） ================= */

type Car = CrawlCar;

/* ================= 工具函数 ================= */

const formatWan = (v: number) => `${v.toFixed(1)}万`;

const parseAgeMonths = (time?: string | number | null) => {
  if (!time || typeof time !== 'string') return null;
  const m = time.match(/(\d{4})年(\d{1,2})月/);
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const now = new Date();
  return (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - mo);
};

const binHistogram = (data: number[], binCount = 8) => {
  if (!data.length) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const step = (max - min) / binCount || 1;

  return Array.from({ length: binCount }, (_, i) => {
    const low = min + i * step;
    const high = min + (i + 1) * step;
    return {
      range: `${low.toFixed(1)}~${high.toFixed(1)}`,
      count: data.filter(v => v >= low && v < high).length,
    };
  });
};

const pearson = (x: number[], y: number[]) => {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  return num / Math.sqrt(dx * dy);
};

/* ================= 样式常量 ================= */

const cardStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(148, 163, 184, 0.1)",
  borderRadius: 16,
  backdropFilter: "blur(12px)",
};

const kpiStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(249, 115, 22, 0.12))",
  border: "1px solid rgba(34, 211, 238, 0.25)",
  borderRadius: 16,
};

const chartCardStyle: React.CSSProperties = {
  ...cardStyle,
  height: "100%",
};

/* ================= 页面组件 ================= */

const VisualizationPage: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get<PageResp<CrawlCar>>("/crawl-cars", {
          params: { page: 1, page_size: 500 },
        });
        const data = res.data;
        const items = Array.isArray(data?.items) ? data.items : [];
        setCars(items);
      } catch (e: unknown) {
        messageApi.error(getErrorMessage(e, "获取二手车数据失败"));
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [messageApi]);

  /* ================= 派生字段 ================= */

  const parsed = useMemo(() => {
    return cars
      .map(c => {
        const ageMonths = parseAgeMonths(c.info?.上牌时间);
        const newPrice = c.info?.新车指导价;
        const curPrice = c.info?.当前售价;
        if (!ageMonths || typeof newPrice !== 'number' || typeof curPrice !== 'number') return null;

        return {
          ageMonths,
          ageYears: ageMonths / 12,
          currentPrice: curPrice,
          depreciationRate: (newPrice - curPrice) / newPrice,
          saveMoney: c.info?.比新车省 ?? 0,
        };
      })
      .filter(Boolean) as {
        ageMonths: number;
        ageYears: number;
        currentPrice: number;
        depreciationRate: number;
        saveMoney: number;
      }[];
  }, [cars]);

  /* ================= 统计指标 ================= */

  const stats = useMemo(() => {
    if (!parsed.length) return null;
    return {
      total: parsed.length,
      avgPrice:
        parsed.reduce((s, c) => s + c.currentPrice, 0) / parsed.length,
      avgDep:
        parsed.reduce((s, c) => s + c.depreciationRate, 0) / parsed.length,
    };
  }, [parsed]);

  /* ================= 分布数据 ================= */

  const priceHist = useMemo(
    () => binHistogram(parsed.map(c => c.currentPrice)),
    [parsed]
  );

  const ageHist = useMemo(
    () => binHistogram(parsed.map(c => c.ageYears)),
    [parsed]
  );

  const depHist = useMemo(
    () => binHistogram(parsed.map(c => c.depreciationRate)),
    [parsed]
  );

  const corrData = useMemo(() => {
    if (!parsed.length) return [];

    const features = {
      车龄: parsed.map(c => c.ageYears),
      价格: parsed.map(c => c.currentPrice),
      折旧率: parsed.map(c => c.depreciationRate),
      省钱: parsed.map(c => c.saveMoney),
    };

    const keys = Object.keys(features) as (keyof typeof features)[];

    return keys.flatMap((k1, i) =>
      keys.map((k2, j) => ({
        x: i,
        y: j,
        nameX: k1,
        nameY: k2,
        value: pearson(features[k1], features[k2]),
      }))
    );
  }, [parsed]);

  const features = [
    {
      icon: <DatabaseOutlined style={{ color: "#22d3ee", fontSize: 24 }} />,
      title: "500+ 真实样本",
      desc: "来自懂车帝实时数据",
    },
    {
      icon: <BarChartOutlined style={{ color: "#f97316", fontSize: 24 }} />,
      title: "多维度分析",
      desc: "价格、车龄、折旧率",
    },
    {
      icon: <ThunderboltOutlined style={{ color: "#a78bfa", fontSize: 24 }} />,
      title: "实时计算",
      desc: "动态相关性热力图",
    },
  ];

  /* ================= 渲染 ================= */

  return (
    <div className="page-shell page-shell--xl">
      {contextHolder}

      {/* 页面标题 */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ color: "white", marginBottom: 8 }}>
          <LineChartOutlined style={{ marginRight: 12, color: "#22d3ee" }} />
          数据可视化分析
        </Title>
        <Paragraph style={{ color: "#94A3B8", fontSize: 16 }}>
          基于真实二手车数据的探索性数据分析（EDA），洞察价格、车龄与折旧的关系
        </Paragraph>
      </div>

      {/* 功能特性卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {features.map((feature, idx) => (
          <Col xs={24} sm={8} key={idx}>
            <Card
              style={{
                background: "rgba(15, 23, 42, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: 12,
                height: "100%",
              }}
              bodyStyle={{ padding: 24 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: "rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {feature.icon}
                </div>
                <div>
                  <Text strong style={{ color: "white", display: "block", fontSize: 16 }}>
                    {feature.title}
                  </Text>
                  <Text style={{ color: "#64748B", fontSize: 13 }}>{feature.desc}</Text>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {loading && (
        <Card style={cardStyle}>
          <Skeleton active />
        </Card>
      )}

      {!loading && stats && (
        <>
          {/* KPI 统计 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
              <Card style={kpiStyle} bodyStyle={{ padding: 24 }}>
                <Statistic
                  title={<Text style={{ color: "#94A3B8" }}>样本数量</Text>}
                  value={stats.total}
                  valueStyle={{ color: "white", fontSize: 32, fontWeight: 700 }}
                  prefix={<DatabaseOutlined style={{ marginRight: 8, color: "#22d3ee" }} />}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={kpiStyle} bodyStyle={{ padding: 24 }}>
                <Statistic
                  title={<Text style={{ color: "#94A3B8" }}>平均售价</Text>}
                  value={formatWan(stats.avgPrice)}
                  valueStyle={{ color: "white", fontSize: 32, fontWeight: 700 }}
                  prefix={<PieChartOutlined style={{ marginRight: 8, color: "#f97316" }} />}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={kpiStyle} bodyStyle={{ padding: 24 }}>
                <Statistic
                  title={<Text style={{ color: "#94A3B8" }}>平均折旧率</Text>}
                  value={(stats.avgDep * 100).toFixed(1)}
                  suffix="%"
                  valueStyle={{ color: "white", fontSize: 32, fontWeight: 700 }}
                  prefix={<LineChartOutlined style={{ marginRight: 8, color: "#a78bfa" }} />}
                />
              </Card>
            </Col>
          </Row>

          {/* 分布图表 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
              <Card
                style={chartCardStyle}
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <BarChartOutlined style={{ color: "#22d3ee" }} />
                    <Text strong style={{ color: "white" }}>当前售价分布</Text>
                  </div>
                }
                headStyle={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
              >
                <ResponsiveContainer height={240}>
                  <BarChart data={priceHist}>
                    <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#64748B" }} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                      labelStyle={{ color: "#94A3B8" }}
                    />
                    <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                style={chartCardStyle}
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <LineChartOutlined style={{ color: "#34d399" }} />
                    <Text strong style={{ color: "white" }}>车龄分布</Text>
                  </div>
                }
                headStyle={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
              >
                <ResponsiveContainer height={240}>
                  <BarChart data={ageHist}>
                    <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#64748B" }} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                      labelStyle={{ color: "#94A3B8" }}
                    />
                    <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                style={chartCardStyle}
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <PieChartOutlined style={{ color: "#f97316" }} />
                    <Text strong style={{ color: "white" }}>折旧率分布</Text>
                  </div>
                }
                headStyle={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
              >
                <ResponsiveContainer height={240}>
                  <BarChart data={depHist}>
                    <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#64748B" }} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                      labelStyle={{ color: "#94A3B8" }}
                    />
                    <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* 相关性热力图 */}
          <Card
            style={{ ...cardStyle, marginBottom: 24 }}
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ThunderboltOutlined style={{ color: "#a78bfa" }} />
                <Text strong style={{ color: "white" }}>特征相关性热力图</Text>
                <Tag
                  color="purple"
                  style={{
                    marginLeft: 12,
                    background: "rgba(167, 139, 250, 0.2)",
                    border: "none",
                    color: "#a78bfa",
                  }}
                >
                  Pearson 相关系数
                </Tag>
              </div>
            }
            headStyle={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
          >
            <ResponsiveContainer height={320}>
              <ScatterChart>
                <XAxis
                  type="number"
                  dataKey="x"
                  tickFormatter={i => corrData[i]?.nameX}
                  tick={{ fill: "#64748B" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  tickFormatter={i => corrData[i]?.nameY}
                  tick={{ fill: "#64748B" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                />
                <Tooltip
                  formatter={(v: number) => v.toFixed(2)}
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "#94A3B8" }}
                />
                <Scatter data={corrData} shape="square">
                  {corrData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={`rgba(34,211,238,${Math.abs(d.value)})`}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Card>

          {/* 共线性分析 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card
                style={chartCardStyle}
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <LineChartOutlined style={{ color: "#22d3ee" }} />
                    <Text strong style={{ color: "white" }}>车龄 vs 售价</Text>
                  </div>
                }
                headStyle={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
              >
                <ResponsiveContainer height={280}>
                  <ScatterChart>
                    <XAxis
                      dataKey="ageYears"
                      unit="年"
                      tick={{ fill: "#64748B" }}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    />
                    <YAxis
                      dataKey="currentPrice"
                      unit="万"
                      tick={{ fill: "#64748B" }}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                      labelStyle={{ color: "#94A3B8" }}
                    />
                    <Scatter data={parsed} fill="#22d3ee" />
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                style={chartCardStyle}
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <PieChartOutlined style={{ color: "#f97316" }} />
                    <Text strong style={{ color: "white" }}>折旧率 vs 售价</Text>
                  </div>
                }
                headStyle={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
              >
                <ResponsiveContainer height={280}>
                  <ScatterChart>
                    <XAxis
                      dataKey="depreciationRate"
                      tick={{ fill: "#64748B" }}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    />
                    <YAxis
                      dataKey="currentPrice"
                      unit="万"
                      tick={{ fill: "#64748B" }}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                      labelStyle={{ color: "#94A3B8" }}
                    />
                    <Scatter data={parsed} fill="#f97316" />
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default VisualizationPage;
