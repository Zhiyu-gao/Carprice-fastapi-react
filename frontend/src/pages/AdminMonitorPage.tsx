import { useEffect, useMemo, useState } from "react";
import { Card, Row, Col, Statistic, Typography, message } from "antd";
import { api, getErrorMessage } from "../api/client";
import type { AdminOverview, AdminMetrics } from "../api/types";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const { Title, Text } = Typography;

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
      } catch (e: any) {
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
      { name: "CPU", value: metrics.cpu_percent },
      { name: "内存", value: metrics.memory_percent },
      { name: "磁盘", value: metrics.disk_percent },
    ];
  }, [metrics]);

  return (
    <Card>
      <Title level={3} style={{ marginBottom: 4 }}>
        系统监控
      </Title>
      <Text type="secondary">实时查看资源占用和业务指标</Text>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="总用户" value={overview?.total_users || 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="活跃用户" value={overview?.active_users || 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="封禁用户" value={overview?.banned_users || 0} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Statistic title="爬虫数据量" value={overview?.total_crawl || 0} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Statistic title="训练集数量" value={overview?.total_train || 0} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Title level={5} style={{ marginBottom: 12 }}>
          资源占用（%）
        </Title>
        <ResponsiveContainer height={260}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#22d3ee" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </Card>
  );
}
