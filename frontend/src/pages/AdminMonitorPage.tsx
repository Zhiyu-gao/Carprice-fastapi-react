import { useEffect, useMemo, useState } from "react";
import { Card, Row, Col, Statistic, Typography, message } from "antd";
import { api, getErrorMessage } from "../api/client";
import type { AdminOverview, AdminMetrics } from "../api/types";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import {
  DashboardOutlined,
  TeamOutlined,
  UserAddOutlined,
  StopOutlined,
  DatabaseOutlined,
  CarOutlined,
  DesktopOutlined,
} from "@ant-design/icons";
import { FiCpu, FiHardDrive } from "react-icons/fi";

const { Title, Text } = Typography;

const cardStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(148, 163, 184, 0.1)",
  borderRadius: 16,
  backdropFilter: "blur(12px)",
};

const metricCardStyle = (color: string): React.CSSProperties => ({
  background: `${color}15`,
  border: `1px solid ${color}30`,
  borderRadius: 12,
  padding: 16,
});

export default function AdminMonitorPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ov, mt] = await Promise.all([
          api.get("/admin/overview"),
          api.get("/admin/metrics"),
        ]);
        setOverview(ov.data);
        setMetrics(mt.data);
      } catch (e: unknown) {
        message.error(getErrorMessage(e, "获取监控数据失败"));
      }
    };
    fetchData();
    const timer = setInterval(fetchData, 5000);
    return () => clearInterval(timer);
  }, []);

  const chartData = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: "CPU", value: metrics.cpu_percent, color: "#22d3ee" },
      { name: "内存", value: metrics.memory_percent, color: "#f59e0b" },
      { name: "磁盘", value: metrics.disk_percent, color: "#10b981" },
    ];
  }, [metrics]);

  return (
    <div style={{ padding: "24px" }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ color: "#f1f5f9", marginBottom: 8 }}>
          <DashboardOutlined style={{ marginRight: 12, color: "#22d3ee" }} />
          系统监控
        </Title>
        <Text style={{ color: "#94a3b8" }}>
          实时查看资源占用和业务指标
        </Text>
      </div>

      {/* 用户统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>总用户</Text>}
              value={overview?.total_users || 0}
              prefix={<TeamOutlined style={{ color: "#22d3ee" }} />}
              valueStyle={{ color: "#f1f5f9", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>活跃用户</Text>}
              value={overview?.active_users || 0}
              prefix={<UserAddOutlined style={{ color: "#10b981" }} />}
              valueStyle={{ color: "#10b981", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>封禁用户</Text>}
              value={overview?.banned_users || 0}
              prefix={<StopOutlined style={{ color: "#ef4444" }} />}
              valueStyle={{ color: "#ef4444", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>在线率</Text>}
              value={overview?.total_users ? Math.round((overview.active_users / overview.total_users) * 100) : 0}
              suffix="%"
              prefix={<DesktopOutlined style={{ color: "#a78bfa" }} />}
              valueStyle={{ color: "#a78bfa", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据量统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>爬虫数据量</Text>}
              value={overview?.total_crawl || 0}
              prefix={<DatabaseOutlined style={{ color: "#f59e0b" }} />}
              valueStyle={{ color: "#f59e0b", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>训练集数量</Text>}
              value={overview?.total_train || 0}
              prefix={<CarOutlined style={{ color: "#22d3ee" }} />}
              valueStyle={{ color: "#22d3ee", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 资源占用图表 */}
      <Card style={cardStyle}>
        <Title level={4} style={{ color: "#f1f5f9", marginBottom: 24 }}>
          <FiCpu style={{ marginRight: 8, color: "#22d3ee" }} />
          系统资源占用
        </Title>
        
        {/* 资源指标卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={8}>
            <div style={metricCardStyle("#22d3ee")}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <FiCpu style={{ color: "#22d3ee", fontSize: 20 }} />
                <Text style={{ color: "#94a3b8" }}>CPU</Text>
              </div>
              <Text style={{ color: "#22d3ee", fontSize: 24, fontWeight: 700 }}>
                {metrics?.cpu_percent || 0}%
              </Text>
            </div>
          </Col>
          <Col xs={8}>
            <div style={metricCardStyle("#f59e0b")}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <DesktopOutlined style={{ color: "#f59e0b", fontSize: 20 }} />
                <Text style={{ color: "#94a3b8" }}>内存</Text>
              </div>
              <Text style={{ color: "#f59e0b", fontSize: 24, fontWeight: 700 }}>
                {metrics?.memory_percent || 0}%
              </Text>
            </div>
          </Col>
          <Col xs={8}>
            <div style={metricCardStyle("#10b981")}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <FiHardDrive style={{ color: "#10b981", fontSize: 20 }} />
                <Text style={{ color: "#94a3b8" }}>磁盘</Text>
              </div>
              <Text style={{ color: "#10b981", fontSize: 24, fontWeight: 700 }}>
                {metrics?.disk_percent || 0}%
              </Text>
            </div>
          </Col>
        </Row>

        <ResponsiveContainer height={300}>
          <BarChart data={chartData}>
            <XAxis 
              dataKey="name" 
              tick={{ fill: "#94a3b8" }}
              axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
            />
            <YAxis 
              tick={{ fill: "#94a3b8" }}
              axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                background: "#0f172a", 
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: 8,
              }}
              itemStyle={{ color: "#e2e8f0" }}
            />
            <Bar 
              dataKey="value" 
              fill="#22d3ee"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
