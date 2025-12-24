// src/pages/RegisterPage.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Typography, Card, message } from "antd";
import { api } from "../api/client";

const { Title, Text } = Typography;

interface RegisterFormValues {
  email: string;
  full_name?: string;
  password: string;
  confirm_password: string;
}

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: RegisterFormValues) => {
    try {
      setLoading(true);

      if (values.password !== values.confirm_password) {
        message.error("两次输入的密码不一致");
        return;
      }

      await api.post("/auth/register", {
        email: values.email,
        full_name: values.full_name,
        password: values.password,
      });

      message.success("注册成功，请登录");
      navigate("/login", { replace: true });
    } catch (err: any) {
      console.error(err);
      message.error(
        err?.response?.data?.detail || "注册失败，请稍后再试"
      );
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
        background: "#f5f5f5",
      }}
    >
      <Card style={{ width: 380 }}>
        <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
          房价预测系统 · 注册
        </Title>

        <Form layout="vertical" onFinish={onFinish}>
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
