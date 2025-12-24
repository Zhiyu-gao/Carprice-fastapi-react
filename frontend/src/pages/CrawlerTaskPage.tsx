import { Card, Table, Tag, Button, Space, message, Modal, Form, Input, Select } from "antd";
import { useState } from "react";

interface CrawlerTask {
  id: number;
  name: string;
  status: "pending" | "running" | "success" | "failed";
  created_at: string;
  updated_at: string;
}

export default function CrawlerTaskPage() {
  const [tasks] = useState<CrawlerTask[]>([
    {
      id: 1,
      name: "链家北京租房爬虫",
      status: "running",
      created_at: "2025-12-07 10:00",
      updated_at: "2025-12-07 10:10",
    },
    {
      id: 2,
      name: "链家上海二手房爬虫",
      status: "failed",
      created_at: "2025-12-06 15:00",
      updated_at: "2025-12-06 15:20",
    },
  ]);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const statusColors = {
    pending: "default",
    running: "processing",
    success: "success",
    failed: "error",
  };

  const startTask = (task: CrawlerTask) => {
    message.success(`已启动任务：${task.name}`);
  };

  const stopTask = (task: CrawlerTask) => {
    message.warning(`已停止任务：${task.name}`);
  };

  const viewLogs = (task: CrawlerTask) => {
    Modal.info({
      title: `${task.name} — 日志`,
      width: 600,
      content: (
        <pre style={{ whiteSpace: "pre-wrap", maxHeight: 400, overflow: "auto" }}>
日志示例：
[10:00] 任务启动
[10:01] 抓取链家页面成功
[10:02] 解析数据成功
...
        </pre>
      ),
    });
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
          <Button size="small" onClick={() => startTask(task)} type="primary">
            启动
          </Button>
          <Button size="small" onClick={() => stopTask(task)} danger>
            停止
          </Button>
          <Button size="small" onClick={() => viewLogs(task)}>查看日志</Button>
        </Space>
      ),
    },
  ];

  const onCreateTask = (values: any) => {
    message.success(`创建任务成功：${values.name}`);
    setCreateModalOpen(false);
  };

  return (
    <Card
      title="爬虫任务管理后台"
      extra={
        <Button type="primary" onClick={() => setCreateModalOpen(true)}>
          创建新任务
        </Button>
      }
    >
      <Table rowKey="id" columns={columns} dataSource={tasks} pagination={{ pageSize: 5 }} />

      {/* 创建任务弹窗 */}
      <Modal
        title="创建新任务"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
      >
        <Form onFinish={onCreateTask} layout="vertical">
          <Form.Item name="name" label="任务名称" rules={[{ required: true }]}>
            <Input placeholder="例如：链家北京租房爬虫" />
          </Form.Item>

          <Form.Item name="city" label="城市" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "北京", value: "北京" },
                { label: "上海", value: "上海" },
                { label: "广州", value: "广州" },
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
