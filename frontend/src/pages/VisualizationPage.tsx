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
  Space,
} from "antd";
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

const { Title, Text } = Typography;

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

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 42, 0.98))",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "var(--shadow-card)",
  borderRadius: 18,
};

const kpiStyle: React.CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(249, 115, 22, 0.12))",
  border: "1px solid rgba(34, 211, 238, 0.25)",
  borderRadius: 18,
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
      } catch (e: any) {
        messageApi.error(getErrorMessage(e, "获取二手车数据失败"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  /* ================= 渲染 ================= */

  return (
    <div
      style={{
        padding: 24,
        minHeight: "100vh",
        background:
          "radial-gradient(900px 500px at 90% -10%, rgba(34, 211, 238, 0.2), transparent 60%)",
      }}
    >
      {contextHolder}

      <Card
        style={{
          ...cardStyle,
          marginBottom: 20,
          background:
            "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98))",
        }}
      >
        <Space align="center" size={12} wrap>
          <Title level={3} style={{ margin: 0, color: "#e5e7eb" }}>
            二手车折旧特征统计分析
          </Title>
          <Tag color="cyan">EDA</Tag>
          <Tag color="geekblue">Real Data</Tag>
          <Tag color="volcano">Depreciation</Tag>
        </Space>
        <Text style={{ color: "#9ca3af", display: "block", marginTop: 8 }}>
          基于懂车帝爬虫数据的价格、车龄与折旧关系洞察
        </Text>
      </Card>

      <Divider style={{ borderColor: "#1f2937" }} />

      {loading && <Skeleton active />}

      {!loading && stats && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card style={{ ...kpiStyle }}>
                <Statistic title="样本数量" value={stats.total} />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={{ ...kpiStyle }}>
                <Statistic title="平均售价" value={formatWan(stats.avgPrice)} />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={{ ...kpiStyle }}>
                <Statistic
                  title="平均折旧率"
                  value={(stats.avgDep * 100).toFixed(1)}
                  suffix="%"
                />
              </Card>
            </Col>
          </Row>
          <Divider />
        </>
      )}

      {/* ===== 价格 / 车龄 / 折旧分布 ===== */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="图3-1 当前售价分布" style={cardStyle}>
            <ResponsiveContainer height={240}>
              <BarChart data={priceHist}>
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="图3-2 车龄分布" style={cardStyle}>
            <ResponsiveContainer height={240}>
              <BarChart data={ageHist}>
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#a3e635" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="图3-3 折旧率分布" style={cardStyle}>
            <ResponsiveContainer height={240}>
              <BarChart data={depHist}>
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* ===== 相关性分析 ===== */}
      <Card title="图3-4 特征相关性热力图" style={cardStyle}>
        <ResponsiveContainer height={320}>
          <ScatterChart>
            <XAxis type="number" dataKey="x" tickFormatter={i => corrData[i]?.nameX} />
            <YAxis type="number" dataKey="y" tickFormatter={i => corrData[i]?.nameY} />
            <Tooltip formatter={(v: number) => v.toFixed(2)} />
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

      <Divider />

      {/* ===== 共线性分析 ===== */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="图3-5(a) 车龄 vs 售价" style={cardStyle}>
            <ResponsiveContainer height={260}>
              <ScatterChart>
                <XAxis dataKey="ageYears" unit="年" />
                <YAxis dataKey="currentPrice" unit="万" />
                <Tooltip />
                <Scatter data={parsed} fill="#22d3ee" />
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="图3-5(b) 折旧率 vs 售价" style={cardStyle}>
            <ResponsiveContainer height={260}>
              <ScatterChart>
                <XAxis dataKey="depreciationRate" />
                <YAxis dataKey="currentPrice" unit="万" />
                <Tooltip />
                <Scatter data={parsed} fill="#f97316" />
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default VisualizationPage;
