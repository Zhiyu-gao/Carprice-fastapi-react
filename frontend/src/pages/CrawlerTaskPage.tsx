import { Card, Table, Tag, Button, Space, message, Modal, Select, Form, Input, Typography, Row, Col, Statistic } from "antd";
import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../api/client";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
  BugOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface CrawlerTask {
  id: string;
  name: string;
  status: "pending" | "running" | "success" | "failed" | "canceled";
  created_at: string;
  updated_at: string;
  city_name: string;
  city_code: string;
  log_url?: string;
}

const cardStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(148, 163, 184, 0.1)",
  borderRadius: 16,
  backdropFilter: "blur(12px)",
};

const gradientButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
  border: "none",
  borderRadius: 8,
  height: 40,
  fontWeight: 600,
};

export default function CrawlerTaskPage() {
  const [tasks, setTasks] = useState<CrawlerTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logText, setLogText] = useState("");
  const [logTitle, setLogTitle] = useState("");

  const [startModalOpen, setStartModalOpen] = useState(false);
  const [form] = Form.useForm();

  const cityOptions = [
    { label: "北京", value: "110000" },
    { label: "广州", value: "440100" },
  ];

  const statusConfig = {
    pending: { color: "#64748B", icon: <ClockCircleOutlined />, text: "待处理" },
    running: { color: "#22d3ee", icon: <PlayCircleOutlined />, text: "运行中" },
    success: { color: "#10b981", icon: <CheckCircleOutlined />, text: "成功" },
    failed: { color: "#ef4444", icon: <CloseCircleOutlined />, text: "失败" },
    canceled: { color: "#f59e0b", icon: <PauseCircleOutlined />, text: "已取消" },
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get("/crawl-tasks");
      setTasks(res.data || []);
    } catch (e: any) {
      message.error(getErrorMessage(e, "获取任务失败"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const viewLogs = async (task: CrawlerTask) => {
    try {
      const res = await api.get(`/crawl-tasks/${task.id}/log`);
      setLogTitle(`${task.name} — 日志`);
      setLogText(res.data?.log || "");
      setLogModalOpen(true);
    } catch (e: any) {
      message.error(getErrorMessage(e, "读取日志失败"));
    }
  };

  const cancelTask = async (task: CrawlerTask) => {
    try {
      await api.post(`/crawl-tasks/${task.id}/cancel`);
      message.success("任务已取消");
      fetchTasks();
    } catch (e: any) {
      message.error(getErrorMessage(e, "取消失败"));
    }
  };

  // 统计数据
  const stats = {
    total: tasks.length,
    running: tasks.filter(t => t.status === "running").length,
    success: tasks.filter(t => t.status === "success").length,
    failed: tasks.filter(t => t.status === "failed").length,
  };

  const columns = [
    {
      title: "任务名称",
      dataIndex: "name",
      width: 200,
      render: (text: string) => (
        <Text style={{ color: "#e2e8f0", fontWeight: 500 }}>{text}</Text>
      ),
    },
    {
      title: "城市",
      dataIndex: "city_name",
      width: 100,
      render: (text: string) => (
        <Tag style={{ background: "rgba(34, 211, 238, 0.1)", color: "#22d3ee", border: "1px solid rgba(34, 211, 238, 0.3)" }}>
          {text}
        </Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 120,
      render: (s: CrawlerTask["status"]) => {
        const config = statusConfig[s];
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: config.color }}>{config.icon}</span>
            <Text style={{ color: config.color }}>{config.text}</Text>
          </div>
        );
      },
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      width: 180,
      render: (text: string) => (
        <Text style={{ color: "#94a3b8" }}>{text}</Text>
      ),
    },
    {
      title: "更新时间",
      dataIndex: "updated_at",
      width: 180,
      render: (text: string) => (
        <Text style={{ color: "#94a3b8" }}>{text}</Text>
      ),
    },
    {
      title: "操作",
      width: 200,
      render: (_: any, task: CrawlerTask) => (
        <Space>
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => viewLogs(task)}
            style={{
              background: "rgba(34, 211, 238, 0.1)",
              border: "1px solid rgba(34, 211, 238, 0.3)",
              color: "#22d3ee",
            }}
          >
            日志
          </Button>
          <Button
            size="small"
            danger
            disabled={task.status !== "running"}
            onClick={() => cancelTask(task)}
            icon={<CloseCircleOutlined />}
          >
            取消
          </Button>
        </Space>
      ),
    },
  ];

  const onStartTask = async (values: any) => {
    const city = cityOptions.find((c) => c.value === values.city_code);
    try {
      await api.post("/crawl-tasks/start", {
        city_code: values.city_code,
        city_name: city?.label || values.city_code,
        start_page: Number(values.start_page || 1),
        end_page: Number(values.end_page || 1),
      });
      message.success("任务已启动");
      setStartModalOpen(false);
      form.resetFields();
      fetchTasks();
    } catch (e: any) {
      message.error(getErrorMessage(e, "启动失败"));
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ color: "#f1f5f9", marginBottom: 8 }}>
          <BugOutlined style={{ marginRight: 12, color: "#22d3ee" }} />
          爬虫任务管理
        </Title>
        <Text style={{ color: "#94a3b8" }}>
          管理和监控车辆数据采集任务
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>总任务</Text>}
              value={stats.total}
              valueStyle={{ color: "#f1f5f9", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>运行中</Text>}
              value={stats.running}
              valueStyle={{ color: "#22d3ee", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>成功</Text>}
              value={stats.success}
              valueStyle={{ color: "#10b981", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>失败</Text>}
              value={stats.failed}
              valueStyle={{ color: "#ef4444", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 任务列表 */}
      <Card
        style={cardStyle}
        title={<Text style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 600 }}>任务列表</Text>}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchTasks}
              style={{
                background: "rgba(148, 163, 184, 0.1)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                color: "#94a3b8",
              }}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => setStartModalOpen(true)}
              style={gradientButtonStyle}
            >
              启动爬虫
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tasks}
          loading={loading}
          pagination={{ pageSize: 10 }}
          style={{
            background: "transparent",
          }}
        />
      </Card>

      {/* 启动爬虫弹窗 */}
      <Modal
        title={<Text style={{ color: "#f1f5f9" }}>启动爬虫</Text>}
        open={startModalOpen}
        onCancel={() => setStartModalOpen(false)}
        footer={null}
        styles={{
          header: { background: "#0f172a", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" },
          body: { background: "#0f172a" },
          mask: { background: "rgba(0, 0, 0, 0.7)" },
        }}
      >
        <Form form={form} onFinish={onStartTask} layout="vertical" initialValues={{ start_page: 1, end_page: 1 }}>
          <Form.Item
            name="city_code"
            label={<Text style={{ color: "#94a3b8" }}>城市</Text>}
            rules={[{ required: true }]}
          >
            <Select
              options={cityOptions}
              placeholder="请选择城市"
              style={{
                background: "rgba(15, 23, 42, 0.6)",
              }}
            />
          </Form.Item>

          <Form.Item name="start_page" label={<Text style={{ color: "#94a3b8" }}>开始页</Text>}>
            <Input placeholder="1" style={{ background: "rgba(15, 23, 42, 0.6)" }} />
          </Form.Item>

          <Form.Item name="end_page" label={<Text style={{ color: "#94a3b8" }}>结束页</Text>}>
            <Input placeholder="1" style={{ background: "rgba(15, 23, 42, 0.6)" }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block style={gradientButtonStyle}>
              开始爬虫
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<Text style={{ color: "#f1f5f9" }}>{logTitle}</Text>}
        open={logModalOpen}
        onCancel={() => setLogModalOpen(false)}
        footer={null}
        width={700}
        styles={{
          header: { background: "#0f172a", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" },
          body: { background: "#0f172a" },
          mask: { background: "rgba(0, 0, 0, 0.7)" },
        }}
      >
        <pre
          style={{
            whiteSpace: "pre-wrap",
            maxHeight: 500,
            overflow: "auto",
            background: "rgba(15, 23, 42, 0.8)",
            padding: 16,
            borderRadius: 8,
            color: "#e2e8f0",
            border: "1px solid rgba(148, 163, 184, 0.1)",
          }}
        >
          {logText || "暂无日志"}
        </pre>
      </Modal>
    </div>
  );
}
