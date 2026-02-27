import { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, message, Row, Skeleton, Statistic, Typography } from "antd";
import {
  DashboardOutlined,
  EnvironmentOutlined,
  LineChartOutlined,
  RiseOutlined,
  PlusOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { MapChart, EffectScatterChart, ScatterChart } from "echarts/charts";
import { GeoComponent, TooltipComponent, VisualMapComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { api, getErrorMessage } from "../api/client";
import type { CrawlCar, PageResp } from "../api/types";
import "./VisualizationScreenPage.css";

const { Title, Text } = Typography;

type MetricRow = {
  id: string;
  brand: string;
  city: string;
  gearbox: string;
  transferCount: number;
  ageYears: number | null;
  currentPrice: number | null;
  newPrice: number | null;
  savePrice: number | null;
};

const COLORS = ["#3dd6ff", "#53f0c7", "#8ca8ff", "#ffd06b", "#6de1ff", "#44b8ff"];
const AXIS_TICK_STYLE = { fill: "#9ec5e4", fontSize: 11 };
const GRID_STROKE = "rgba(122,169,212,0.16)";
const TOOLTIP_STYLE = {
  background: "rgba(5, 21, 43, 0.96)",
  border: "1px solid rgba(83, 197, 255, 0.45)",
  borderRadius: 8,
};

const CITY_COORDS: Record<string, [number, number]> = {
  北京: [116.405285, 39.904989],
  上海: [121.472644, 31.231706],
  广州: [113.280637, 23.125178],
  深圳: [114.085947, 22.547],
  杭州: [120.153576, 30.287459],
  成都: [104.065735, 30.659462],
  武汉: [114.298572, 30.584355],
  南京: [118.767413, 32.041544],
  西安: [108.948024, 34.263161],
  重庆: [106.504962, 29.533155],
  苏州: [120.619585, 31.299379],
  天津: [117.190182, 39.125596],
  长沙: [112.982279, 28.19409],
  郑州: [113.665412, 34.757975],
  青岛: [120.355173, 36.082982],
  福州: [119.306239, 26.075302],
  厦门: [118.11022, 24.490474],
  东莞: [113.746262, 23.046237],
  佛山: [113.122717, 23.028762],
};

const parseNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const m = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

const parseAgeYears = (plateTime?: string | null): number | null => {
  if (!plateTime) return null;
  const m = plateTime.match(/(\d{4})年(\d{1,2})月?/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const now = new Date();
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  return months >= 0 ? Number((months / 12).toFixed(1)) : null;
};

const parseTransferCount = (value?: string | number | null): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (!value) return 0;
  const m = String(value).match(/\d+/);
  return m ? Number(m[0]) : 0;
};

echarts.use([
  GeoComponent,
  TooltipComponent,
  VisualMapComponent,
  MapChart,
  ScatterChart,
  EffectScatterChart,
  CanvasRenderer,
]);

export default function VisualizationScreenPage() {
  const [rows, setRows] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapZoom, setMapZoom] = useState(1.08);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get<PageResp<CrawlCar>>("/crawl-cars", {
          params: { page: 1, page_size: 500 },
        });
        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        const normalized: MetricRow[] = items.map((item) => {
          const info = item.info || {};
          const title = item.title || "未知车型";
          return {
            id: item.car_id || item.source_car_id || title,
            brand: title.split(" ")[0] || "未知",
            city:
              String(info["车源地"] || info["上牌地"] || info["所在城市"] || "未知") ||
              "未知",
            gearbox: String(info["变速箱"] || "未知"),
            transferCount: parseTransferCount(info["过户次数"] as string | number | null),
            ageYears: parseAgeYears(String(info["上牌时间"] || "")),
            currentPrice: parseNumber(info["当前售价"]),
            newPrice: parseNumber(info["新车指导价"]),
            savePrice: parseNumber(info["比新车省"]),
          };
        });
        setRows(normalized);
      } catch (e: unknown) {
        messageApi.error(getErrorMessage(e, "加载可视化数据失败"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [messageApi]);

  useEffect(() => {
    const registerChinaMap = async () => {
      try {
        const res = await fetch("https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json");
        const geoJson = (await res.json()) as Record<string, unknown>;
        echarts.registerMap("china", geoJson as never);
        setMapReady(true);
      } catch {
        setMapReady(false);
      }
    };
    registerChinaMap();
  }, []);

  const dashboard = useMemo(() => {
    const pricedRows = rows.filter((row) => typeof row.currentPrice === "number");
    const saveRows = rows.filter(
      (row) => typeof row.savePrice === "number" && typeof row.newPrice === "number" && (row.newPrice || 0) > 0
    );

    const total = rows.length;
    const avgPrice = pricedRows.length
      ? pricedRows.reduce((sum, row) => sum + (row.currentPrice || 0), 0) / pricedRows.length
      : 0;

    const avgSaveRate = saveRows.length
      ? saveRows.reduce((sum, row) => sum + ((row.savePrice || 0) / (row.newPrice || 1)), 0) / saveRows.length
      : 0;

    const cityCountMap = new Map<string, number>();
    rows.forEach((row) => {
      cityCountMap.set(row.city, (cityCountMap.get(row.city) || 0) + 1);
    });
    const topCities = Array.from(cityCountMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const brandMap = new Map<string, { count: number; priceSum: number }>();
    pricedRows.forEach((row) => {
      const prev = brandMap.get(row.brand) || { count: 0, priceSum: 0 };
      brandMap.set(row.brand, {
        count: prev.count + 1,
        priceSum: prev.priceSum + (row.currentPrice || 0),
      });
    });
    const brandRank = Array.from(brandMap.entries())
      .map(([name, value]) => ({
        name,
        count: value.count,
        avgPrice: Number((value.priceSum / value.count).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const gearboxMap = new Map<string, number>();
    rows.forEach((row) => {
      gearboxMap.set(row.gearbox, (gearboxMap.get(row.gearbox) || 0) + 1);
    });
    const gearboxDist = Array.from(gearboxMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const transferMap = new Map<string, number>();
    rows.forEach((row) => {
      const key = `${row.transferCount}次`;
      transferMap.set(key, (transferMap.get(key) || 0) + 1);
    });
    const transferDist = Array.from(transferMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => Number(a.name.replace("次", "")) - Number(b.name.replace("次", "")))
      .slice(0, 6);

    return {
      total,
      avgPrice,
      avgSaveRate,
      cityCoverage: cityCountMap.size,
      topCities,
      brandRank,
      gearboxDist,
      transferDist,
    };
  }, [rows]);

  const mapOption = useMemo(() => {
    const scatterData = dashboard.topCities
      .map((item) => {
        const coord = CITY_COORDS[item.name];
        if (!coord) return null;
        return {
          name: item.name,
          value: [coord[0], coord[1], item.value],
        };
      })
      .filter(Boolean);

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(3, 18, 41, 0.95)",
        borderColor: "rgba(76, 197, 255, 0.58)",
        borderWidth: 1,
        textStyle: { color: "#dbf3ff" },
        formatter: (params: { name?: string; value?: unknown }) => {
          const count = Array.isArray(params.value) ? params.value[2] : params.value;
          return `${params.name || "未知"}<br/>车源: ${count || 0} 台`;
        },
      },
      visualMap: {
        min: 1,
        max: Math.max(...dashboard.topCities.map((item) => item.value), 10),
        orient: "vertical",
        right: 12,
        top: "middle",
        text: ["高", "低"],
        calculable: false,
        textStyle: { color: "#95cfff" },
        inRange: {
          color: ["#134f7b", "#1c82bf", "#36c2ff", "#86ebff"],
        },
      },
      geo: {
        map: "china",
        roam: "move",
        zoom: mapZoom,
        label: {
          show: false,
          color: "#d4eeff",
        },
        itemStyle: {
          areaColor: "#0f3e6a",
          borderColor: "#68cbff",
          borderWidth: 1,
          shadowColor: "rgba(63,197,255,0.62)",
          shadowBlur: 12,
        },
        emphasis: {
          label: { show: false },
          itemStyle: {
            areaColor: "#2f7fbe",
            borderColor: "#8ce3ff",
            shadowBlur: 20,
          },
        },
      },
      series: [
        {
          name: "城市车源",
          type: "effectScatter",
          coordinateSystem: "geo",
          rippleEffect: { scale: 2.2, brushType: "stroke" },
          showEffectOn: "render",
          symbolSize: (val: number[]) => {
            const count = Number(val?.[2] || 0);
            return Math.min(18, 6 + Math.sqrt(Math.max(count, 0)) * 1.6);
          },
          itemStyle: {
            color: "#9be6ff",
            shadowBlur: 15,
            shadowColor: "rgba(80,225,255,0.75)",
          },
          encode: { value: 2 },
          data: scatterData,
          zlevel: 3,
        },
      ],
    };
  }, [dashboard.topCities, mapZoom]);

  const priceDistribution = useMemo(() => {
    const priced = rows
      .map((row) => row.currentPrice)
      .filter((v): v is number => typeof v === "number");
    if (!priced.length) return [];
    const bins = [
      { name: "0-5万", min: 0, max: 5 },
      { name: "5-10万", min: 5, max: 10 },
      { name: "10-15万", min: 10, max: 15 },
      { name: "15-20万", min: 15, max: 20 },
      { name: "20万+", min: 20, max: Number.MAX_SAFE_INTEGER },
    ];
    return bins.map((bin) => ({
      name: bin.name,
      value: priced.filter((p) => p >= bin.min && p < bin.max).length,
    }));
  }, [rows]);

  const ageDistribution = useMemo(() => {
    const ages = rows
      .map((row) => row.ageYears)
      .filter((v): v is number => typeof v === "number");
    if (!ages.length) return [];
    const bins = [
      { name: "0-1年", min: 0, max: 1 },
      { name: "1-3年", min: 1, max: 3 },
      { name: "3-5年", min: 3, max: 5 },
      { name: "5-8年", min: 5, max: 8 },
      { name: "8年+", min: 8, max: Number.MAX_SAFE_INTEGER },
    ];
    return bins.map((bin) => ({
      name: bin.name,
      value: ages.filter((a) => a >= bin.min && a < bin.max).length,
    }));
  }, [rows]);

  const saveDistribution = useMemo(() => {
    const saves = rows
      .map((row) => row.savePrice)
      .filter((v): v is number => typeof v === "number");
    if (!saves.length) return [];
    const bins = [
      { name: "0-3万", min: 0, max: 3 },
      { name: "3-6万", min: 3, max: 6 },
      { name: "6-10万", min: 6, max: 10 },
      { name: "10-15万", min: 10, max: 15 },
      { name: "15万+", min: 15, max: Number.MAX_SAFE_INTEGER },
    ];
    return bins.map((bin) => ({
      name: bin.name,
      value: saves.filter((s) => s >= bin.min && s < bin.max).length,
    }));
  }, [rows]);

  const brandMax = useMemo(
    () => Math.max(...dashboard.brandRank.map((item) => item.count), 1),
    [dashboard.brandRank]
  );
  const cityMax = useMemo(
    () => Math.max(...dashboard.topCities.map((item) => item.value), 1),
    [dashboard.topCities]
  );

  return (
    <div className="viz-screen-wrap">
      {contextHolder}
      <div className="viz-screen-bg" />
      <div className="viz-screen-frame" />

      <header className="viz-screen-header">
        <div className="viz-screen-line viz-screen-line-left" />
        <div className="viz-screen-title-box">
          <Title level={2} className="viz-screen-title">
            数据可视化大屏
          </Title>
          <Text className="viz-screen-subtitle">基于懂车帝爬虫数据构建 | 车源结构化洞察</Text>
        </div>
        <div className="viz-screen-line viz-screen-line-right" />
      </header>

      {loading ? (
        <Card className="viz-panel">
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : (
        <>
          <Row gutter={[12, 12]} className="viz-kpi-row">
            <Col xs={12} md={6}>
              <Card className="viz-kpi">
                <Statistic
                  title="总车源"
                  value={dashboard.total}
                  prefix={<DashboardOutlined />}
                  valueStyle={{ color: "#d7f5ff" }}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card className="viz-kpi">
                <Statistic
                  title="覆盖城市"
                  value={dashboard.cityCoverage}
                  prefix={<EnvironmentOutlined />}
                  valueStyle={{ color: "#9ce1ff" }}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card className="viz-kpi">
                <Statistic
                  title="平均售价"
                  value={dashboard.avgPrice.toFixed(2)}
                  suffix="万"
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: "#79ffd1" }}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card className="viz-kpi">
                <Statistic
                  title="平均省价率"
                  value={(dashboard.avgSaveRate * 100).toFixed(1)}
                  suffix="%"
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: "#ffd588" }}
                />
              </Card>
            </Col>
          </Row>

          <section className="viz-main-grid">
            <div className="viz-col-left">
              <Card className="viz-panel panel-enter-1" title="品牌热度排行">
                <div className="viz-brand-list">
                  {dashboard.brandRank.slice(0, 6).map((item, index) => (
                    <div key={item.name} className="viz-brand-row">
                      <span className="viz-rank">NO.{index + 1}</span>
                      <div className="viz-brand-main">
                        <span className="viz-brand-name">{item.name}</span>
                        <div className="viz-meter">
                          <span style={{ width: `${(item.count / brandMax) * 100}%` }} />
                        </div>
                      </div>
                      <span className="viz-brand-meta">{item.count}台 | 均价{item.avgPrice}万</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="viz-panel panel-enter-2" title="变速箱占比">
                <div className="viz-chart-box">
                  <ResponsiveContainer width="100%" height={196}>
                    <PieChart>
                      <defs>
                        <filter id="pieGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2.2" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <Pie
                        data={dashboard.gearboxDist}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={82}
                        innerRadius={44}
                        paddingAngle={2}
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        style={{ filter: "url(#pieGlow)" }}
                      >
                        {dashboard.gearboxDist.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="viz-col-center">
              <Card className="viz-panel viz-map-panel panel-enter-3" title="城市车源分布总览">
                <div className="viz-map-body">
                  {mapReady ? (
                    <ReactECharts option={mapOption} style={{ width: "100%", height: "100%" }} notMerge lazyUpdate />
                  ) : (
                    <div className="viz-map-loading">中国地图加载中...</div>
                  )}
                  <div className="viz-map-zoom-tools">
                    <Button
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => setMapZoom((prev) => Math.min(2.4, Number((prev + 0.12).toFixed(2))))}
                    />
                    <Button
                      size="small"
                      icon={<MinusOutlined />}
                      onClick={() => setMapZoom((prev) => Math.max(0.72, Number((prev - 0.12).toFixed(2))))}
                    />
                  </div>
                </div>
              </Card>

              <Card className="viz-panel panel-enter-4" title="价格与车况分布">
                <div className="viz-double-chart-box">
                  <div className="viz-subchart">
                    <Text className="viz-subchart-title">价格分布</Text>
                    <ResponsiveContainer width="100%" height={142}>
                      <BarChart data={priceDistribution}>
                        <defs>
                          <linearGradient id="priceBarFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7ee7ff" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="#2286e6" stopOpacity={0.58} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                        <XAxis dataKey="name" tick={AXIS_TICK_STYLE} />
                        <YAxis tick={AXIS_TICK_STYLE} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                          {priceDistribution.map((entry, index) => (
                            <Cell
                              key={`${entry.name}-${index}`}
                              fill={index === 2 ? "url(#priceBarFill)" : COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="viz-subchart">
                    <Text className="viz-subchart-title">车龄分布</Text>
                    <ResponsiveContainer width="100%" height={142}>
                      <AreaChart data={ageDistribution}>
                        <defs>
                          <linearGradient id="ageAreaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#67e4ff" stopOpacity={0.55} />
                            <stop offset="100%" stopColor="#67e4ff" stopOpacity={0.04} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                        <XAxis dataKey="name" tick={AXIS_TICK_STYLE} />
                        <YAxis tick={AXIS_TICK_STYLE} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#7be8ff"
                          strokeWidth={2.3}
                          fill="url(#ageAreaFill)"
                          dot={{ r: 2, stroke: "#9de7ff", fill: "#9de7ff" }}
                          activeDot={{ r: 5, stroke: "#d6fbff", strokeWidth: 1, fill: "#d6fbff" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="viz-subchart">
                    <Text className="viz-subchart-title">省价分布</Text>
                    <ResponsiveContainer width="100%" height={142}>
                      <RadarChart cx="50%" cy="52%" outerRadius="72%" data={saveDistribution}>
                        <defs>
                          <linearGradient id="saveRadarFill" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#72ffd6" stopOpacity={0.52} />
                            <stop offset="100%" stopColor="#2ec9ff" stopOpacity={0.2} />
                          </linearGradient>
                          <filter id="saveRadarGlow" x="-25%" y="-25%" width="150%" height="150%">
                            <feGaussianBlur stdDeviation="2.4" result="coloredBlur" />
                            <feMerge>
                              <feMergeNode in="coloredBlur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <PolarGrid stroke="rgba(122,169,212,0.3)" radialLines={false} />
                        <PolarAngleAxis dataKey="name" tick={{ fill: "#9dc8e6", fontSize: 10 }} />
                        <PolarRadiusAxis tick={{ fill: "#6f9ec0", fontSize: 10 }} axisLine={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Radar
                          dataKey="value"
                          stroke="#7afee1"
                          fill="url(#saveRadarFill)"
                          fillOpacity={1}
                          strokeWidth={2.2}
                          dot={{ r: 2.6, fill: "#c4fff0", stroke: "#7afee1", strokeWidth: 1 }}
                          style={{ filter: "url(#saveRadarGlow)" }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            </div>

            <div className="viz-col-right">
              <Card className="viz-panel panel-enter-5" title="过户次数分布">
                <div className="viz-chart-box">
                  <ResponsiveContainer width="100%" height={196}>
                    <BarChart data={dashboard.transferDist}>
                      <defs>
                        <linearGradient id="transferBarFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#73f5d4" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#1f95da" stopOpacity={0.55} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                      <XAxis dataKey="name" tick={{ ...AXIS_TICK_STYLE, fontSize: 12 }} />
                      <YAxis tick={{ ...AXIS_TICK_STYLE, fontSize: 12 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {dashboard.transferDist.map((entry, index) => (
                          <Cell
                            key={`${entry.name}-${index}`}
                            fill={index === 1 ? "url(#transferBarFill)" : COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="viz-panel panel-enter-6" title="核心城市排名">
                <div className="viz-city-rank">
                  {dashboard.topCities.slice(0, 8).map((item, idx) => (
                    <div key={item.name} className="viz-city-row">
                      <span className="viz-rank">{String(idx + 1).padStart(2, "0")}</span>
                      <div className="viz-city-main">
                        <span className="viz-city-name">{item.name}</span>
                        <div className="viz-meter">
                          <span style={{ width: `${(item.value / cityMax) * 100}%` }} />
                        </div>
                      </div>
                      <span className="viz-city-value">{item.value} 台</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
