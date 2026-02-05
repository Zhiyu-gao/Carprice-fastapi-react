import { Card, Table, Tag, Button, Space, message, Modal, Select, Form, Input } from "antd";
import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../api/client";

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

  const statusColors = {
    pending: "default",
    running: "processing",
    success: "success",
    failed: "error",
    canceled: "default",
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

  const columns = [
    {
      title: "任务名称",
      dataIndex: "name",
      width: 200,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 120,
      render: (s: CrawlerTask["status"]) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      width: 160,
    },
    {
      title: "更新时间",
      dataIndex: "updated_at",
      width: 160,
    },
    {
      title: "操作",
      width: 280,
      render: (_: any, task: CrawlerTask) => (
        <Space>
          <Button size="small" onClick={() => viewLogs(task)}>
            查看日志
          </Button>
          <Button
            size="small"
            danger
            disabled={task.status !== "running"}
            onClick={() => cancelTask(task)}
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
    <Card
      title="爬虫任务管理后台"
      extra={
        <Space>
          <Button onClick={fetchTasks}>刷新</Button>
          <Button type="primary" onClick={() => setStartModalOpen(true)}>
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
        pagination={{ pageSize: 5 }}
      />

      {/* 启动爬虫弹窗 */}
      <Modal
        title="启动爬虫"
        open={startModalOpen}
        onCancel={() => setStartModalOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={onStartTask} layout="vertical" initialValues={{ start_page: 1, end_page: 1 }}>
          <Form.Item name="city_code" label="城市" rules={[{ required: true }]}>
            <Select
              options={cityOptions}
              placeholder="请选择城市"
            />
          </Form.Item>

          <Form.Item name="start_page" label="开始页">
            <Input placeholder="1" />
          </Form.Item>

          <Form.Item name="end_page" label="结束页">
            <Input placeholder="1" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              开始爬虫
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={logTitle}
        open={logModalOpen}
        onCancel={() => setLogModalOpen(false)}
        footer={null}
        width={700}
      >
        <pre style={{ whiteSpace: "pre-wrap", maxHeight: 500, overflow: "auto" }}>
{logText || "暂无日志"}
        </pre>
      </Modal>
    </Card>
  );
}
