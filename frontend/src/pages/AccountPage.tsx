// src/pages/AccountPage.tsx
import React, { useCallback, useEffect, useState } from "react";
import { Card, Form, Input, Button, Typography, Space, Tag, message, Divider, Upload, Avatar, Row, Col, Tabs } from "antd";
import type { UploadProps } from "antd";
import {
  UserOutlined,
  MailOutlined,
  SafetyOutlined,
  EditOutlined,
  LockOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { api, getErrorMessage } from "../api/client";
import type { UserMe } from "../api/types";
import { resolveFileUrl } from "../utils/fileUrl";

const { Text, Title, Paragraph } = Typography;

// 样式常量
const cardStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(148, 163, 184, 0.1)",
  borderRadius: 16,
  backdropFilter: "blur(12px)",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 8,
};

const gradientButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
  border: "none",
  borderRadius: 8,
  height: 44,
  fontWeight: 600,
};

const AccountPage: React.FC = () => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [user, setUser] = useState<UserMe | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchMe = useCallback(async () => {
    try {
      setLoadingProfile(true);
      const res = await api.get<UserMe>("/me");
      const data = res.data;
      setUser(data);
      profileForm.setFieldsValue({
        email: data.email,
        full_name: data.full_name,
      });
    } catch (err: unknown) {
      console.error(err);
      messageApi.error(getErrorMessage(err, "获取用户信息失败"));
    } finally {
      setLoadingProfile(false);
    }
  }, [messageApi, profileForm]);

  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  const handleProfileSave = async (values: { email: string; full_name: string }) => {
    try {
      setSavingProfile(true);
      const res = await api.put<UserMe>("/me", values);
      const data = res.data;
      setUser(data);
      messageApi.success("个人信息已更新");
    } catch (err: unknown) {
      console.error(err);
      messageApi.error(getErrorMessage(err, "更新资料失败"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (values: { code: string; new_password: string }) => {
    try {
      setSavingPassword(true);
      const email = user?.email;
      if (!email) {
        messageApi.error("未获取到邮箱信息");
        return;
      }
      await api.post("/auth/password/reset", {
        email,
        code: values.code,
        new_password: values.new_password,
      });
      passwordForm.resetFields();
      messageApi.success("密码已修改");
    } catch (err: unknown) {
      console.error(err);
      messageApi.error(getErrorMessage(err, "修改密码失败"));
    } finally {
      setSavingPassword(false);
    }
  };

  const sendEmailCode = async () => {
    try {
      const email = user?.email;
      if (!email) {
        messageApi.error("未获取到邮箱信息");
        return;
      }
      setSendingCode(true);
      await api.post("/auth/email/code", { email });
      messageApi.success("验证码已发送，请查收邮箱");
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      messageApi.error(getErrorMessage(err, "发送验证码失败"));
    } finally {
      setSendingCode(false);
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
        options.onSuccess?.({});
      } catch (e: unknown) {
        messageApi.error(getErrorMessage(e, "上传失败"));
        options.onError?.(new Error(getErrorMessage(e, "上传失败")));
      }
    },
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "admin":
        return { color: "#fbbf24", bg: "rgba(251, 191, 36, 0.2)", label: "管理员" };
      case "buyer":
        return { color: "#34d399", bg: "rgba(52, 211, 153, 0.2)", label: "买家" };
      default:
        return { color: "#22d3ee", bg: "rgba(34, 211, 238, 0.2)", label: "卖家" };
    }
  };

  const roleInfo = getRoleColor(user?.role);

  return (
    <div style={{ padding: "24px 48px", maxWidth: 1200, margin: "0 auto" }}>
      {contextHolder}

      {/* 页面标题 */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ color: "white", marginBottom: 8 }}>
          <UserOutlined style={{ marginRight: 12, color: "#22d3ee" }} />
          个人中心
        </Title>
        <Paragraph style={{ color: "#94A3B8", fontSize: 16 }}>
          管理您的账户信息、修改密码和查看个人资料
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {/* 左侧用户信息卡片 */}
        <Col xs={24} lg={8}>
          <Card style={cardStyle} bodyStyle={{ padding: 32 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <Avatar
                  size={120}
                  src={resolveFileUrl(user?.avatar_path)}
                  style={{
                    background: "linear-gradient(135deg, #22d3ee, #0ea5e9)",
                    border: "4px solid rgba(34, 211, 238, 0.3)",
                  }}
                >
                  {user?.username?.slice(0, 1).toUpperCase()}
                </Avatar>
                <Upload {...uploadProps}>
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<UploadOutlined />}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      background: "linear-gradient(135deg, #22d3ee, #0ea5e9)",
                      border: "none",
                    }}
                  />
                </Upload>
              </div>

              <div style={{ marginTop: 20 }}>
                <Title level={3} style={{ color: "white", margin: 0, marginBottom: 8 }}>
                  {user?.username || "-"}
                </Title>
                <Tag
                  style={{
                    background: roleInfo.bg,
                    border: `1px solid ${roleInfo.color}`,
                    color: roleInfo.color,
                    padding: "4px 16px",
                    borderRadius: 4,
                    fontSize: 14,
                  }}
                >
                  {roleInfo.label}
                </Tag>
              </div>

              <Divider style={{ borderColor: "rgba(255,255,255,0.1)", margin: "24px 0" }} />

              <Space direction="vertical" size={16} style={{ width: "100%", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <IdcardOutlined style={{ color: "#64748B", fontSize: 16 }} />
                  <div>
                    <Text style={{ color: "#64748B", fontSize: 12, display: "block" }}>用户 ID</Text>
                    <Text style={{ color: "white", fontFamily: "monospace" }}>{user?.id || "-"}</Text>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <MailOutlined style={{ color: "#64748B", fontSize: 16 }} />
                  <div>
                    <Text style={{ color: "#64748B", fontSize: 12, display: "block" }}>邮箱</Text>
                    <Text style={{ color: "white" }}>{user?.email || "-"}</Text>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <CheckCircleOutlined style={{ color: user?.is_active ? "#34d399" : "#ef4444", fontSize: 16 }} />
                  <div>
                    <Text style={{ color: "#64748B", fontSize: 12, display: "block" }}>账号状态</Text>
                    <Text style={{ color: user?.is_active ? "#34d399" : "#ef4444" }}>
                      {user?.is_active ? "正常可用" : "已禁用"}
                    </Text>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <ClockCircleOutlined style={{ color: "#64748B", fontSize: 16 }} />
                  <div>
                    <Text style={{ color: "#64748B", fontSize: 12, display: "block" }}>注册时间</Text>
                    <Text style={{ color: "white" }}>
                      {user?.created_at ? new Date(user.created_at).toLocaleString() : "-"}
                    </Text>
                  </div>
                </div>
              </Space>
            </div>
          </Card>
        </Col>

        {/* 右侧设置区域 */}
        <Col xs={24} lg={16}>
          <Card style={cardStyle} bodyStyle={{ padding: 32 }}>
            <Tabs
              defaultActiveKey="profile"
              items={[
                {
                  key: "profile",
                  label: (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <EditOutlined />
                      基本资料
                    </span>
                  ),
                  children: (
                    <div style={{ maxWidth: 500 }}>
                      <div style={{ marginBottom: 24 }}>
                        <Text strong style={{ color: "white", fontSize: 18, display: "block", marginBottom: 8 }}>
                          编辑个人资料
                        </Text>
                        <Text style={{ color: "#64748B" }}>
                          更新您的邮箱和姓名信息
                        </Text>
                      </div>

                      <Form
                        form={profileForm}
                        layout="vertical"
                        onFinish={handleProfileSave}
                        disabled={loadingProfile}
                      >
                        <Form.Item
                          label={<Text style={{ color: "#94A3B8" }}>邮箱</Text>}
                          name="email"
                          rules={[
                            { required: true, message: "请输入邮箱" },
                            { type: "email", message: "邮箱格式不正确" },
                          ]}
                        >
                          <Input
                            placeholder="you@example.com"
                            prefix={<MailOutlined style={{ color: "#64748B" }} />}
                            style={{
                              ...inputStyle,
                              color: "white",
                              height: 44,
                            }}
                          />
                        </Form.Item>

                        <Form.Item
                          label={<Text style={{ color: "#94A3B8" }}>姓名</Text>}
                          name="full_name"
                        >
                          <Input
                            placeholder="请输入姓名"
                            prefix={<UserOutlined style={{ color: "#64748B" }} />}
                            style={{
                              ...inputStyle,
                              color: "white",
                              height: 44,
                            }}
                          />
                        </Form.Item>

                        <Form.Item style={{ marginTop: 24 }}>
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={savingProfile}
                            icon={<CheckCircleOutlined />}
                            style={gradientButtonStyle}
                            size="large"
                            block
                          >
                            保存资料
                          </Button>
                        </Form.Item>
                      </Form>
                    </div>
                  ),
                },
                {
                  key: "password",
                  label: (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <LockOutlined />
                      修改密码
                    </span>
                  ),
                  children: (
                    <div style={{ maxWidth: 500 }}>
                      <div style={{ marginBottom: 24 }}>
                        <Text strong style={{ color: "white", fontSize: 18, display: "block", marginBottom: 8 }}>
                          修改登录密码
                        </Text>
                        <Text style={{ color: "#64748B" }}>
                          需要通过邮箱验证码验证身份
                        </Text>
                      </div>

                      <Form form={passwordForm} layout="vertical" onFinish={handlePasswordSave}>
                        <Form.Item
                          label={<Text style={{ color: "#94A3B8" }}>当前邮箱</Text>}
                        >
                          <Input
                            value={user?.email}
                            disabled
                            prefix={<MailOutlined style={{ color: "#64748B" }} />}
                            style={{
                              ...inputStyle,
                              color: "#64748B",
                              height: 44,
                            }}
                          />
                        </Form.Item>

                        <Form.Item
                          label={<Text style={{ color: "#94A3B8" }}>邮箱验证码</Text>}
                          required
                        >
                          <Input.Group compact>
                            <Form.Item
                              name="code"
                              noStyle
                              rules={[{ required: true, message: "请输入验证码" }]}
                            >
                              <Input
                                style={{ width: "60%", ...inputStyle, height: 44 }}
                                placeholder="6 位验证码"
                              />
                            </Form.Item>
                            <Button
                              style={{ width: "40%", height: 44 }}
                              loading={sendingCode}
                              disabled={countdown > 0}
                              onClick={sendEmailCode}
                            >
                              {countdown > 0 ? `${countdown}s` : "获取验证码"}
                            </Button>
                          </Input.Group>
                        </Form.Item>

                        <Form.Item
                          label={<Text style={{ color: "#94A3B8" }}>新密码</Text>}
                          name="new_password"
                          rules={[
                            { required: true, message: "请输入新密码" },
                            { min: 6, message: "至少 6 位" },
                          ]}
                        >
                          <Input.Password
                            placeholder="请输入新密码"
                            prefix={<SafetyOutlined style={{ color: "#64748B" }} />}
                            style={{
                              ...inputStyle,
                              height: 44,
                            }}
                          />
                        </Form.Item>

                        <Form.Item style={{ marginTop: 24 }}>
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={savingPassword}
                            icon={<LockOutlined />}
                            style={{
                              ...gradientButtonStyle,
                              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                            }}
                            size="large"
                            block
                          >
                            修改密码
                          </Button>
                        </Form.Item>
                      </Form>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AccountPage;
