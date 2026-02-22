// src/pages/RegisterPage.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Typography, Card, message, Select } from "antd";
import { api, getErrorMessage } from "../api/client";

const { Title, Text } = Typography;

interface RegisterFormValues {
  email: string;
  code: string;
  username: string;
  role: "buyer" | "seller";
  full_name?: string;
  password: string;
  confirm_password: string;
}

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm<RegisterFormValues>();
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const sendEmailCode = async () => {
    try {
      const email = form.getFieldValue("email");
      if (!email) {
        message.warning("请先输入邮箱");
        return;
      }
      setSendingCode(true);
      await api.post("/auth/email/code", { email });
      message.success("验证码已发送，请查收邮箱");
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
    } catch (err: any) {
      message.error(getErrorMessage(err, "发送验证码失败"));
    } finally {
      setSendingCode(false);
    }
  };

  const onFinish = async (values: RegisterFormValues) => {
    try {
      setLoading(true);

      if (values.password !== values.confirm_password) {
        message.error("两次输入的密码不一致");
        return;
      }

      await api.post("/auth/register", {
        email: values.email,
        code: values.code,
        username: values.username,
        role: values.role,
        full_name: values.full_name,
        password: values.password,
      });

      message.success("注册成功，请登录");
      navigate("/login", { replace: true });
    } catch (err: any) {
      console.error(err);
      message.error(getErrorMessage(err, "注册失败，请稍后再试"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(800px 400px at 85% -10%, rgba(34,211,238,0.25), transparent 60%), radial-gradient(700px 500px at 10% -20%, rgba(249,115,22,0.2), transparent 60%), #0b0f14",
      }}
    >
      <Card style={{ width: 420, borderRadius: 18 }}>
        <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
          车辆智能平台 · 注册
        </Title>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "邮箱格式不正确" },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item label="邮箱验证码" required>
            <Input.Group compact>
              <Form.Item
                name="code"
                noStyle
                rules={[{ required: true, message: "请输入验证码" }]}
              >
                <Input style={{ width: "60%" }} placeholder="6 位验证码" />
              </Form.Item>
              <Button
                style={{ width: "40%" }}
                loading={sendingCode}
                disabled={countdown > 0}
                onClick={sendEmailCode}
              >
                {countdown > 0 ? `${countdown}s` : "获取验证码"}
              </Button>
            </Input.Group>
          </Form.Item>

          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input placeholder="请输入用户名（不可为 admin）" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: "请选择角色" }]}
          >
            <Select
              options={[
                { label: "我要买车", value: "buyer" },
                { label: "我要卖车", value: "seller" },
              ]}
              placeholder="请选择角色"
            />
          </Form.Item>

          <Form.Item label="姓名" name="full_name">
            <Input placeholder="请输入姓名（可选）" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
            hasFeedback
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirm_password"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: "请再次输入密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的密码不一致"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入密码" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ marginTop: 8 }}
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center" }}>
          <Text type="secondary">
            已有账号？<Link to="/login">去登录</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
