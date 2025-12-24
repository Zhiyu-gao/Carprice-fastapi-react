// src/pages/AccountPage.tsx
import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, Typography, Space, Tag, message, Divider } from "antd";
import { getToken } from "../auth/token";

const { Text, Title } = Typography;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface UserInfo {
  id: number;
  email: string;
  full_name: string | null;
  is_active: number;
  created_at: string;
}

const AccountPage: React.FC = () => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const buildAuthHeaders = () => {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchMe = async () => {
    try {
      setLoadingProfile(true);
      const res = await fetch(`${API_BASE_URL}/me`, {
        headers: buildAuthHeaders(),
      });
      if (!res.ok) throw new Error(`获取用户信息失败：${res.status}`);
      const data: UserInfo = await res.json();
      setUser(data);
      profileForm.setFieldsValue({
        email: data.email,
        full_name: data.full_name,
      });
    } catch (err: any) {
      console.error(err);
      messageApi.error(err.message || "获取用户信息失败");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const handleProfileSave = async (values: { email: string; full_name: string }) => {
    try {
      setSavingProfile(true);
      const res = await fetch(`${API_BASE_URL}/me`, {
        method: "PUT",
        headers: buildAuthHeaders(),
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`更新资料失败：${res.status}`);
      const data: UserInfo = await res.json();
      setUser(data);
      messageApi.success("个人信息已更新");
    } catch (err: any) {
      console.error(err);
      messageApi.error(err.message || "更新资料失败");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (values: { old_password: string; new_password: string }) => {
    try {
      setSavingPassword(true);
      const res = await fetch(`${API_BASE_URL}/me/password`, {
        method: "PUT",
        headers: buildAuthHeaders(),
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`修改密码失败：${res.status} ${text}`);
      }
      passwordForm.resetFields();
      messageApi.success("密码已修改");
    } catch (err: any) {
      console.error(err);
      messageApi.error(err.message || "修改密码失败");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card>
          <Title level={4}>我的信息</Title>
          {user && (
            <Space direction="vertical" style={{ marginBottom: 16 }}>
              <Text>
                用户 ID：<Text code>{user.id}</Text>
              </Text>
              <Text>
                账号状态：{" "}
                {user.is_active ? <Tag color="green">可用</Tag> : <Tag color="red">禁用</Tag>}
              </Text>
              <Text type="secondary">
                创建时间：{new Date(user.created_at).toLocaleString()}
              </Text>
              <Text>
                密码存储方式：<Text code>已加密存储（后端不返回真实密码）</Text>
              </Text>
            </Space>
          )}

          <Divider />

          <Title level={5}>基本资料</Title>
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleProfileSave}
            disabled={loadingProfile}
          >
            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { required: true, message: "请输入邮箱" },
                { type: "email", message: "邮箱格式不正确" },
              ]}
            >
              <Input placeholder="you@example.com" />
            </Form.Item>

            <Form.Item label="姓名" name="full_name">
              <Input placeholder="请输入姓名" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={savingProfile}>
                保存资料
              </Button>
            </Form.Item>
          </Form>

          <Divider />

          <Title level={5}>修改密码</Title>
          <Form form={passwordForm} layout="vertical" onFinish={handlePasswordSave}>
            <Form.Item
              label="原密码"
              name="old_password"
              rules={[{ required: true, message: "请输入原密码" }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="新密码"
              name="new_password"
              rules={[{ required: true, message: "请输入新密码" }, { min: 6, message: "至少 6 位" }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={savingPassword}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </>
  );
};

export default AccountPage;
