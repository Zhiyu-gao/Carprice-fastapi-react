import { useEffect, useState } from "react";
import { Card, Table, Tag, Button, Space, message, Typography } from "antd";
import { api, getErrorMessage } from "../api/client";
import type { AdminUser } from "../api/types";

const { Title, Text } = Typography;

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

  return (
    <Card>
      <Title level={3} style={{ marginBottom: 4 }}>
        用户管理
      </Title>
      <Text type="secondary">查看注册用户并进行封禁管理</Text>

      <Table
        style={{ marginTop: 16 }}
        rowKey="id"
        loading={loading}
        dataSource={users}
        pagination={{
          current: page,
          pageSize: 50,
          total,
          showSizeChanger: false,
          onChange: (p) => fetchUsers(p),
        }}
        columns={[
          { title: "ID", dataIndex: "id", width: 70 },
          { title: "用户名", dataIndex: "username", width: 140 },
          { title: "邮箱", dataIndex: "email", width: 220 },
          {
            title: "角色",
            dataIndex: "role",
            width: 100,
            render: (v) => <Tag color={v === "admin" ? "gold" : "blue"}>{v}</Tag>,
          },
          {
            title: "状态",
            dataIndex: "is_active",
            width: 100,
            render: (v) => (
              <Tag color={v ? "green" : "red"}>{v ? "正常" : "封禁"}</Tag>
            ),
          },
          { title: "注册时间", dataIndex: "created_at", width: 180 },
          {
            title: "操作",
            width: 180,
            render: (_, row: AdminUser) => (
              <Space>
                <Button
                  size="small"
                  danger
                  disabled={row.role === "admin" || row.is_active === 0}
                  onClick={() => ban(row.id)}
                >
                  封禁
                </Button>
                <Button
                  size="small"
                  disabled={row.is_active === 1}
                  onClick={() => unban(row.id)}
                >
                  解封
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}
