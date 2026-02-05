// src/pages/AccountPage.tsx
import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, Typography, Space, Tag, message, Divider, Upload, Avatar, Row, Col, Tabs } from "antd";
import type { UploadProps } from "antd";
import { api, getErrorMessage } from "../api/client";
import type { UserMe } from "../api/types";

const { Text, Title } = Typography;

const AccountPage: React.FC = () => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [user, setUser] = useState<UserMe | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchMe = async () => {
    try {
      setLoadingProfile(true);
      const res = await api.get<UserMe>("/me");
      const data = res.data;
      setUser(data);
      profileForm.setFieldsValue({
        email: data.email,
        full_name: data.full_name,
      });
    } catch (err: any) {
      console.error(err);
      messageApi.error(getErrorMessage(err, "获取用户信息失败"));
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
      const res = await api.put<UserMe>("/me", values);
      const data = res.data;
      setUser(data);
      messageApi.success("个人信息已更新");
    } catch (err: any) {
      console.error(err);
      messageApi.error(getErrorMessage(err, "更新资料失败"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (values: { old_password: string; new_password: string }) => {
    try {
      setSavingPassword(true);
      await api.put("/me/password", values);
      passwordForm.resetFields();
      messageApi.success("密码已修改");
    } catch (err: any) {
      console.error(err);
      messageApi.error(getErrorMessage(err, "修改密码失败"));
    } finally {
      setSavingPassword(false);
    }
  };

  const uploadProps: UploadProps = {
    name: "file",
    showUploadList: false,
    customRequest: async (options) => {
      try {
        const form = new FormData();
        form.append("file", options.file as Blob);
        const res = await api.post("/users/me/avatar", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        messageApi.success("头像已更新");
        setUser((prev) => (prev ? { ...prev, avatar_path: res.data.avatar_path } : prev));
        options.onSuccess?.({}, options.file as any);
      } catch (e: any) {
        messageApi.error(getErrorMessage(e, "上传失败"));
        options.onError?.(e);
      }
    },
  };

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={8}>
              <Card style={{ textAlign: "center" }}>
                <Avatar
                  size={96}
                  src={
                    user?.avatar_path
                      ? `${import.meta.env.VITE_API_BASE_URL}/files/${user.avatar_path}`
                      : undefined
                  }
                >
                  {user?.username?.slice(0, 1).toUpperCase()}
                </Avatar>
                <div style={{ marginTop: 12 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {user?.username || "-"}
                  </Title>
                  <Tag color={user?.role === "admin" ? "gold" : user?.role === "buyer" ? "green" : "blue"}>
                    {user?.role || "-"}
                  </Tag>
                </div>
                <Upload {...uploadProps}>
                  <Button style={{ marginTop: 8 }}>更换头像</Button>
                </Upload>
              </Card>
            </Col>
            <Col xs={24} md={16}>
              <Title level={4}>我的信息</Title>
              {user && (
                <Space direction="vertical" style={{ marginBottom: 8 }}>
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
            </Col>
          </Row>

          <Divider />

          <Tabs
            items={[
              {
                key: "profile",
                label: "基本资料",
                children: (
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
                ),
              },
              {
                key: "password",
                label: "修改密码",
                children: (
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
                ),
              },
            ]}
          />
        </Card>
      </Space>
    </>
  );
};

export default AccountPage;
