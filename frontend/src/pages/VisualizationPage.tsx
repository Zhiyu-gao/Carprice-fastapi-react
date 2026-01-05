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
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { getToken } from "../auth/token";

const { Title, Text } = Typography;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* ================= 数据结构（真实对齐） ================= */

interface Car {
  source_car_id: string;
  title: string;
  tags: string[];
  info: {
    上牌时间?: string;      // 2018年04月
    上牌地?: string;
    当前售价?: number;      // 万
    新车指导价?: number;    // 万
    比新车省?: number;      // 万
    过户次数?: string;      // "0次"
  };
}

/* ================= 工具函数 ================= */

const formatWan = (v: number) => `${v.toFixed(1)}万`;

const parseAgeMonths = (time?: string) => {
  if (!time) return null;
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
  background: "#111827",
  border: "1px solid #1f2937",
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
        const res = await fetch(`${API_BASE_URL}/crawl-cars`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error("获取二手车数据失败");
        setCars(await res.json());
      } catch (e: any) {
        messageApi.error(e.message);
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
        if (!ageMonths || !newPrice || !curPrice) return null;

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
    <div style={{ padding: 16, background: "#0f172a", minHeight: "100vh" }}>
      {contextHolder}

      <Title level={3} style={{ color: "#e5e7eb" }}>
        二手车折旧特征统计分析 <Tag color="blue">EDA</Tag>
      </Title>
      <Text style={{ color: "#9ca3af" }}>
        基于懂车帝真实爬虫数据的折旧与价格特征分析
      </Text>

      <Divider style={{ borderColor: "#1f2937" }} />

      {loading && <Skeleton active />}

      {!loading && stats && (
        <>
          <Row gutter={16}>
            <Col span={8}>
              <Card style={cardStyle}>
                <Statistic title="样本数量" value={stats.total} />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={cardStyle}>
                <Statistic title="平均售价" value={formatWan(stats.avgPrice)} />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={cardStyle}>
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
      <Row gutter={16}>
        <Col span={8}>
          <Card title="图3-1 当前售价分布" style={cardStyle}>
            <ResponsiveContainer height={240}>
              <BarChart data={priceHist}>
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="图3-2 车龄分布" style={cardStyle}>
            <ResponsiveContainer height={240}>
              <BarChart data={ageHist}>
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="图3-3 折旧率分布" style={cardStyle}>
            <ResponsiveContainer height={240}>
              <BarChart data={depHist}>
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#fbbf24" />
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
                  fill={`rgba(96,165,250,${Math.abs(d.value)})`}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </Card>

      <Divider />

      {/* ===== 共线性分析 ===== */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="图3-5(a) 车龄 vs 售价" style={cardStyle}>
            <ResponsiveContainer height={260}>
              <ScatterChart>
                <XAxis dataKey="ageYears" unit="年" />
                <YAxis dataKey="currentPrice" unit="万" />
                <Tooltip />
                <Scatter data={parsed} fill="#38bdf8" />
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="图3-5(b) 折旧率 vs 售价" style={cardStyle}>
            <ResponsiveContainer height={260}>
              <ScatterChart>
                <XAxis dataKey="depreciationRate" />
                <YAxis dataKey="currentPrice" unit="万" />
                <Tooltip />
                <Scatter data={parsed} fill="#f472b6" />
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default VisualizationPage;
