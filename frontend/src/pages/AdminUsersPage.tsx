import { useEffect, useState } from "react";
import { Card, Table, Tag, Button, Space, message, Typography, Row, Col, Statistic } from "antd";
import { api, getErrorMessage } from "../api/client";
import type { AdminUser } from "../api/types";
import {
  UserOutlined,
  TeamOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  StopOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const cardStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(148, 163, 184, 0.1)",
  borderRadius: 16,
  backdropFilter: "blur(12px)",
};



const roleConfig = (role?: string) => {
  if (role === "admin") return { color: "#f59e0b", icon: <CrownOutlined />, text: "管理员" };
  if (role === "buyer") return { color: "#10b981", icon: <UserOutlined />, text: "买家" };
  if (role === "seller") return { color: "#22d3ee", icon: <UserOutlined />, text: "卖家" };
  return { color: "#64748b", icon: <UserOutlined />, text: "用户" };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async (pageNo: number) => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users", {
        params: { page: pageNo, page_size: 50 },
      });
      const data = res.data || {};
      setUsers(Array.isArray(data.items) ? data.items : []);
      setPage(data.page || pageNo);
      setTotal(data.total || 0);
    } catch (e: any) {
      message.error(getErrorMessage(e, "获取用户失败"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const ban = async (id: number) => {
    try {
      await api.post(`/admin/users/${id}/ban`);
      message.success("已封禁");
      fetchUsers(page);
    } catch (e: any) {
      message.error(getErrorMessage(e, "封禁失败"));
    }
  };

  const unban = async (id: number) => {
    try {
      await api.post(`/admin/users/${id}/unban`);
      message.success("已解封");
      fetchUsers(page);
    } catch (e: any) {
      message.error(getErrorMessage(e, "解封失败"));
    }
  };

  // 统计数据
  const activeUsers = users.filter(u => u.is_active).length;
  const bannedUsers = users.filter(u => !u.is_active).length;
  const adminUsers = users.filter(u => u.role === "admin").length;

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 70,
      render: (text: string) => <Text style={{ color: "#64748b" }}>{text}</Text>,
    },
    {
      title: "用户名",
      dataIndex: "username",
      width: 140,
      render: (text: string) => <Text style={{ color: "#e2e8f0", fontWeight: 500 }}>{text}</Text>,
    },
    {
      title: "邮箱",
      dataIndex: "email",
      width: 220,
      render: (text: string) => <Text style={{ color: "#94a3b8" }}>{text}</Text>,
    },
    {
      title: "角色",
      dataIndex: "role",
      width: 120,
      render: (v: string) => {
        const role = roleConfig(v);
        return (
          <Tag
            style={{
              background: `${role.color}20`,
              color: role.color,
              border: `1px solid ${role.color}40`,
            }}
          >
            {role.icon} {role.text}
          </Tag>
        );
      },
    },
    {
      title: "状态",
      dataIndex: "is_active",
      width: 100,
      render: (v: boolean) => (
        <Tag
          style={{
            background: v ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
            color: v ? "#10b981" : "#ef4444",
            border: v ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          {v ? <><CheckCircleOutlined /> 正常</> : <><StopOutlined /> 封禁</>}
        </Tag>
      ),
    },
    {
      title: "注册时间",
      dataIndex: "created_at",
      width: 180,
      render: (text: string) => <Text style={{ color: "#94a3b8" }}>{text}</Text>,
    },
    {
      title: "操作",
      width: 200,
      render: (_: any, row: AdminUser) => (
        <Space>
          <Button
            size="small"
            danger
            disabled={row.role === "admin" || row.is_active === 0}
            onClick={() => ban(row.id)}
            icon={<LockOutlined />}
          >
            封禁
          </Button>
          <Button
            size="small"
            disabled={row.is_active === 1}
            onClick={() => unban(row.id)}
            icon={<UnlockOutlined />}
            style={{
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#10b981",
            }}
          >
            解封
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ color: "#f1f5f9", marginBottom: 8 }}>
          <TeamOutlined style={{ marginRight: 12, color: "#22d3ee" }} />
          用户管理
        </Title>
        <Text style={{ color: "#94a3b8" }}>
          查看注册用户并进行封禁管理
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>总用户</Text>}
              value={total}
              prefix={<TeamOutlined style={{ color: "#22d3ee" }} />}
              valueStyle={{ color: "#f1f5f9", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>正常用户</Text>}
              value={activeUsers}
              prefix={<CheckCircleOutlined style={{ color: "#10b981" }} />}
              valueStyle={{ color: "#10b981", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>封禁用户</Text>}
              value={bannedUsers}
              prefix={<StopOutlined style={{ color: "#ef4444" }} />}
              valueStyle={{ color: "#ef4444", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>管理员</Text>}
              value={adminUsers}
              prefix={<CrownOutlined style={{ color: "#f59e0b" }} />}
              valueStyle={{ color: "#f59e0b", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 用户表格 */}
      <Card style={cardStyle}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={users}
          pagination={{
            current: page,
            pageSize: 50,
            total,
            showSizeChanger: false,
            onChange: (p) => fetchUsers(p),
            style: { marginTop: 16 },
          }}
          columns={columns}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}
