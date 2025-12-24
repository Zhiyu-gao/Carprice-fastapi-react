import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Typography,
  Card,
  message,
} from "antd";
import { api } from "../api/client";
import { setToken } from "../auth/token";
import { AFTER_LOGIN_REDIRECT } from "../config/routes";

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password?: string;
  code?: string;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm<LoginFormValues>();

  const [mode] = useState<"password" | "code">("password");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  // ======================
  // 发送邮箱验证码
  // ======================
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

      // 60s 倒计时
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
      message.error(err?.response?.data?.detail || "发送验证码失败");
    } finally {
      setSendingCode(false);
    }
  };

  // ======================
  // 提交登录
  // ======================
  const onFinish = async (values: LoginFormValues) => {
    try {
      setLoading(true);

      let res;

      if (mode === "password") {
        // -------- 密码登录 --------
        const formData = new URLSearchParams();
        formData.append("username", values.email);
        formData.append("password", values.password!);

        res = await api.post("/auth/login", formData, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
      } else {
        // -------- 邮箱验证码登录 --------
        res = await api.post("/auth/email/code-login", {
          email: values.email,
          code: values.code,
        });
      }

      const { access_token } = res.data;
      setToken(access_token);
      message.success("登录成功");
      navigate(AFTER_LOGIN_REDIRECT, { replace: true });
    } catch (err: any) {
      message.error(err?.response?.data?.detail || "登录失败");
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
          房价预测系统 · 登录
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          {/* 邮箱 */}
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

          {/* 密码登录 */}
          {mode === "password" && (
            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          {/* 验证码登录 */}
          {mode === "code" && (
            <Form.Item label="邮箱验证码" required>
              <Input.Group compact>
                <Form.Item
                  name="code"
                  noStyle
                  rules={[{ required: true, message: "请输入验证码" }]}
                >
                  <Input
                    style={{ width: "60%" }}
                    placeholder="6 位验证码"
                  />
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
          )}

          {/* 登录按钮 */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ marginTop: 8 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        {/* 切换登录方式
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <Button
            type="link"
            onClick={() =>
              setMode(mode === "password" ? "code" : "password")
            }
          >
            {mode === "password"
              ? "使用邮箱验证码登录"
              : "使用密码登录"}
          </Button>
        </div> */}

        {/* 注册入口 */}
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <Text type="secondary">
            还没有账号？<Link to="/register">去注册</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
