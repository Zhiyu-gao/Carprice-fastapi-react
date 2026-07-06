// src/pages/LandingPage.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Typography,
  Card,
  message,
  Select,
  Tabs,
  Row,
  Col,
  Space,
  Tag,
  Modal,
  Grid,
} from "antd";
import {
  BarChartOutlined,
  RobotOutlined,
  DatabaseOutlined,
  GithubOutlined,
  CarOutlined,
  LineChartOutlined,
  ApiOutlined,
  SafetyOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import { api, getErrorMessage } from "../api/client";
import { setToken } from "../auth/token";
import { AFTER_LOGIN_REDIRECT } from "../config/routes";

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;
const WECHAT_LOGIN_ENABLED = import.meta.env.VITE_WECHAT_LOGIN_ENABLED === "true";

interface LoginFormValues {
  account?: string;
  email?: string;
  password?: string;
  code?: string;
}

interface RegisterFormValues {
  email: string;
  code: string;
  username: string;
  role: "buyer" | "seller";
  full_name?: string;
  password: string;
  confirm_password: string;
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");

  // 登录表单状态
  const [loginForm] = Form.useForm<LoginFormValues>();
  const [loginMode, setLoginMode] = useState<"password" | "code">("password");
  const [loginLoading, setLoginLoading] = useState(false);
  const [wechatLoading, setWechatLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 注册表单状态
  const [registerForm] = Form.useForm<RegisterFormValues>();
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSendingCode, setRegisterSendingCode] = useState(false);
  const [registerCountdown, setRegisterCountdown] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoadError, setPreviewLoadError] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.xl;

  useEffect(() => {
    if (!WECHAT_LOGIN_ENABLED) return;
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const loginType = params.get("login");
    const wxError = params.get("wx_error");

    if (wxError) {
      message.error(`微信登录失败: ${wxError}`);
      return;
    }
    if (token && loginType === "wechat") {
      setToken(token);
      message.success("微信登录成功");
      navigate(AFTER_LOGIN_REDIRECT, { replace: true });
    }
  }, [location.search, navigate]);

  // 发送验证码（登录）
  const sendLoginCode = async () => {
    try {
      const email = loginForm.getFieldValue("email");
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
    } catch (err: unknown) {
      message.error(getErrorMessage(err, "发送验证码失败"));
    } finally {
      setSendingCode(false);
    }
  };

  // 发送验证码（注册）
  const sendRegisterCode = async () => {
    try {
      const email = registerForm.getFieldValue("email");
      if (!email) {
        message.warning("请先输入邮箱");
        return;
      }
      setRegisterSendingCode(true);
      await api.post("/auth/email/code", { email });
      message.success("验证码已发送，请查收邮箱");
      setRegisterCountdown(60);
      const timer = setInterval(() => {
        setRegisterCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      message.error(getErrorMessage(err, "发送验证码失败"));
    } finally {
      setRegisterSendingCode(false);
    }
  };

  // 登录提交
  const onLoginFinish = async (values: LoginFormValues) => {
    try {
      setLoginLoading(true);
      let res;
      if (loginMode === "password") {
        const formData = new URLSearchParams();
        formData.append("username", values.account || "");
        formData.append("password", values.password!);
        res = await api.post("/auth/login", formData, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
      } else {
        res = await api.post("/auth/email/code-login", {
          email: values.email!,
          code: values.code,
        });
      }
      const { access_token } = res.data;
      setToken(access_token);
      message.success("登录成功");
      navigate(AFTER_LOGIN_REDIRECT, { replace: true });
    } catch (err: unknown) {
      message.error(getErrorMessage(err, "登录失败"));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleWechatLogin = async () => {
    try {
      setWechatLoading(true);
      const state = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const res = await api.get<{ authorize_url: string }>("/auth/wechat/url", {
        params: { state },
      });
      const url = res.data?.authorize_url;
      if (!url) {
        message.error("未获取到微信授权地址");
        return;
      }
      window.location.href = url;
    } catch (err: unknown) {
      message.error(getErrorMessage(err, "拉起微信登录失败"));
      setWechatLoading(false);
    }
  };

  // 注册提交
  const onRegisterFinish = async (values: RegisterFormValues) => {
    try {
      setRegisterLoading(true);
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
      setActiveTab("login");
      registerForm.resetFields();
    } catch (err: unknown) {
      message.error(getErrorMessage(err, "注册失败，请稍后再试"));
    } finally {
      setRegisterLoading(false);
    }
  };

  const features = [
    {
      icon: <DatabaseOutlined style={{ fontSize: 24, color: "#22d3ee" }} />,
      title: "真实数据采集",
      desc: "基于 Scrapy 爬虫框架，从主流二手车平台实时采集数据",
    },
    {
      icon: <BarChartOutlined style={{ fontSize: 24, color: "#f97316" }} />,
      title: "智能价格预测",
      desc: "LightGBM + XGBoost + Linear 加权融合，预测车辆价格",
    },
    {
      icon: <RobotOutlined style={{ fontSize: 24, color: "#a78bfa" }} />,
      title: "AI 深度分析",
      desc: "集成 Kimi、Qwen、DeepSeek 等大模型，智能分析车况",
    },
  ];

  const techStack = [
    { name: "FastAPI", color: "#22d3ee" },
    { name: "React", color: "#f97316" },
    { name: "MySQL", color: "#a78bfa" },
    { name: "Redis", color: "#f472b6" },
    { name: "LightGBM", color: "#34d399" },
    { name: "XGBoost", color: "#60a5fa" },
    { name: "Linear baseline", color: "#f97316" },
    { name: "Scrapy", color: "#fbbf24" },
    { name: "Kimi AI", color: "#c084fc" },
  ];

  const previewVideoUrl = `${import.meta.env.VITE_API_BASE_URL}/public/preview/video`;

  const openPreview = () => {
    setPreviewLoadError(false);
    setPreviewOpen(true);
  };

  return (
    <div
      className="landing-page"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1000px 600px at 70% -10%, rgba(34,211,238,0.15), transparent 60%), radial-gradient(800px 500px at 10% -10%, rgba(249,115,22,0.12), transparent 60%), #020617",
      }}
    >
      {/* 顶部导航 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "0 12px" : isTablet ? "0 24px" : "0 48px",
          background: "rgba(2, 6, 23, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #22d3ee, #f97316)",
              boxShadow: "0 0 12px rgba(34, 211, 238, 0.6)",
            }}
          />
          <Text style={{ color: "white", fontSize: isMobile ? 16 : 18, fontWeight: 700 }}>
            车辆智能平台
          </Text>
        </div>
        <Space size={isMobile ? 8 : 12}>
          <Button
            ghost
            onClick={openPreview}
            style={{
              borderColor: "rgba(34,211,238,0.5)",
              color: "#67e8f9",
              paddingInline: isMobile ? 10 : 16,
            }}
          >
            {isMobile ? "预览" : "2分钟快速预览"}
          </Button>
          <Button
            type="text"
            icon={<GithubOutlined style={{ color: "#94A3B8", fontSize: 20 }} />}
            onClick={() =>
              window.open(
                "https://github.com/Zhiyu-gao/Carprice-fastapi-react",
                "_blank"
              )
            }
          />
        </Space>
      </div>

      {/* 主内容区 */}
      <Row style={{ minHeight: "100vh", paddingTop: 64 }}>
        {/* 左侧介绍区 */}
        <Col
          xs={24}
          lg={14}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: isMobile ? "24px 16px" : isTablet ? "32px 24px" : "48px 64px",
          }}
        >
          <div style={{ maxWidth: "100%" }}>
            <Title
              level={1}
              style={{
                color: "white",
                fontSize: "clamp(28px, 2.9vw, 48px)",
                marginTop: -10,
                marginBottom: 20,
                lineHeight: 1.2,
              }}
            >
              基于多智能体与大模型
              <br />
              <span style={{ color: "#22d3ee" }}>协同的价格预测与智能分析系统</span>
            </Title>

            <Paragraph
              style={{
                color: "#94A3B8",
                fontSize: isMobile ? 15 : 18,
                lineHeight: 1.8,
                marginBottom: 32,
              }}
            >
              融合 LightGBM、XGBoost 与线性 baseline，结合 Kimi、Qwen、DeepSeek
              等大模型能力，为您提供精准的车辆估价和深度分析报告。
            </Paragraph>

            {/* 技术栈标签 */}
            <Space wrap style={{ marginBottom: 48 }}>
              {techStack.map((tech) => (
                <Tag
                  key={tech.name}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${tech.color}40`,
                    color: tech.color,
                    padding: "4px 12px",
                    borderRadius: 4,
                  }}
                >
                  {tech.name}
                </Tag>
              ))}
            </Space>

            {/* 功能卡片 */}
            <Row gutter={[16, 16]}>
              {features.map((feature, idx) => (
                <Col xs={24} sm={8} key={idx}>
                  <Card
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      height: "100%",
                    }}
                    bodyStyle={{ padding: 20 }}
                  >
                    <div style={{ marginBottom: 12 }}>{feature.icon}</div>
                    <Text
                      strong
                      style={{ color: "white", display: "block", marginBottom: 8 }}
                    >
                      {feature.title}
                    </Text>
                    <Text style={{ color: "#64748B", fontSize: 13 }}>
                      {feature.desc}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* 系统能力 */}
            <div style={{ marginTop: 48 }}>
              <Text style={{ color: "#64748B", display: "block", marginBottom: 16 }}>
                系统能力
              </Text>
              <Space wrap size={24}>
                {[
                  { icon: <CarOutlined />, text: "多维度车辆特征分析" },
                  { icon: <LineChartOutlined />, text: "实时市场价格追踪" },
                  { icon: <ApiOutlined />, text: "RESTful API 接口" },
                  { icon: <SafetyOutlined />, text: "企业级安全防护" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#94A3B8",
                    }}
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </div>
                ))}
              </Space>
            </div>
          </div>
        </Col>

        {/* 右侧登录/注册区 */}
        <Col
          xs={24}
          lg={10}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: isMobile ? "16px 16px 28px" : isTablet ? "28px 24px 40px" : "48px",
          }}
        >
          <Card
            style={{
              width: "100%",
              maxWidth: 420,
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              backdropFilter: "blur(12px)",
            }}
            bodyStyle={{ padding: isMobile ? 18 : 32 }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              centered
              items={[
                {
                  key: "login",
                  label: "登录",
                  children: (
                    <Form
                      form={loginForm}
                      layout="vertical"
                      onFinish={onLoginFinish}
                      autoComplete="off"
                    >
                      {loginMode === "password" ? (
                        <Form.Item
                          label={<Text style={{ color: "#94A3B8" }}>账号（用户名或邮箱）</Text>}
                          name="account"
                          rules={[{ required: true, message: "请输入账号" }]}
                        >
                          <Input
                            placeholder="请输入用户名或邮箱"
                            autoComplete="username"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "white",
                            }}
                          />
                        </Form.Item>
                      ) : (
                        <Form.Item
                          label={<Text style={{ color: "#94A3B8" }}>邮箱</Text>}
                          name="email"
                          rules={[
                            { required: true, message: "请输入邮箱" },
                            { type: "email", message: "邮箱格式不正确" },
                          ]}
                        >
                          <Input
                            placeholder="请输入邮箱"
                            autoComplete="email"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "white",
                            }}
                          />
                        </Form.Item>
                      )}

                      {loginMode === "password" && (
                        <Form.Item
                          label={<Text style={{ color: "#94A3B8" }}>密码</Text>}
                          name="password"
                          rules={[{ required: true, message: "请输入密码" }]}
                        >
                          <Input.Password
                            className="landing-password-input"
                            placeholder="请输入密码"
                            style={{
                              width: "100%",
                            }}
                          />
                        </Form.Item>
                      )}

                      {loginMode === "code" && (
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
                                style={{ width: "60%" }}
                                placeholder="6 位验证码"
                              />
                            </Form.Item>
                            <Button
                              style={{ width: "40%" }}
                              loading={sendingCode}
                              disabled={countdown > 0}
                              onClick={sendLoginCode}
                            >
                              {countdown > 0 ? `${countdown}s` : "获取验证码"}
                            </Button>
                          </Input.Group>
                        </Form.Item>
                      )}

                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          block
                          loading={loginLoading}
                          style={{
                            marginTop: 8,
                            height: 44,
                            background: "linear-gradient(135deg, #22d3ee, #0ea5e9)",
                            border: "none",
                          }}
                        >
                          登录
                        </Button>
                      </Form.Item>

                      <Form.Item style={{ marginTop: -6 }}>
                        {WECHAT_LOGIN_ENABLED ? (
                          <Button
                            block
                            icon={<WechatOutlined />}
                            loading={wechatLoading}
                            onClick={handleWechatLogin}
                            style={{
                              height: 42,
                              background: "rgba(5, 150, 105, 0.12)",
                              color: "#34d399",
                              border: "1px solid rgba(16, 185, 129, 0.45)",
                            }}
                          >
                            微信扫码登录
                          </Button>
                        ) : null}
                      </Form.Item>

                      <div style={{ textAlign: "center", marginTop: 16 }}>
                        <Button
                          type="link"
                          onClick={() =>
                            setLoginMode(loginMode === "password" ? "code" : "password")
                          }
                          style={{ color: "#22d3ee" }}
                        >
                          {loginMode === "password"
                            ? "使用邮箱验证码登录"
                            : "使用密码登录"}
                        </Button>
                      </div>
                    </Form>
                  ),
                },
                {
                  key: "register",
                  label: "注册",
                  children: (
                    <Form
                      form={registerForm}
                      layout="vertical"
                      onFinish={onRegisterFinish}
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
                          placeholder="请输入邮箱"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "white",
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
                            <Input style={{ width: "60%" }} placeholder="6 位验证码" />
                          </Form.Item>
                          <Button
                            style={{ width: "40%" }}
                            loading={registerSendingCode}
                            disabled={registerCountdown > 0}
                            onClick={sendRegisterCode}
                          >
                            {registerCountdown > 0
                              ? `${registerCountdown}s`
                              : "获取验证码"}
                          </Button>
                        </Input.Group>
                      </Form.Item>

                      <Form.Item
                        label={<Text style={{ color: "#94A3B8" }}>用户名</Text>}
                        name="username"
                        rules={[{ required: true, message: "请输入用户名" }]}
                      >
                        <Input
                          placeholder="请输入用户名"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "white",
                          }}
                        />
                      </Form.Item>

                      <Form.Item
                        label={<Text style={{ color: "#94A3B8" }}>角色</Text>}
                        name="role"
                        rules={[{ required: true, message: "请选择角色" }]}
                      >
                        <Select
                          options={[
                            { label: "我要买车", value: "buyer" },
                            { label: "我要卖车", value: "seller" },
                          ]}
                          placeholder="请选择角色"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                          }}
                        />
                      </Form.Item>

                      <Form.Item
                        label={<Text style={{ color: "#94A3B8" }}>姓名</Text>}
                        name="full_name"
                      >
                        <Input
                          placeholder="请输入姓名（可选）"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "white",
                          }}
                        />
                      </Form.Item>

                      <Form.Item
                        label={<Text style={{ color: "#94A3B8" }}>密码</Text>}
                        name="password"
                        rules={[{ required: true, message: "请输入密码" }]}
                        hasFeedback
                      >
                        <Input.Password
                          className="landing-password-input"
                          placeholder="请输入密码"
                          style={{
                            width: "100%",
                          }}
                        />
                      </Form.Item>

                      <Form.Item
                        label={<Text style={{ color: "#94A3B8" }}>确认密码</Text>}
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
                        <Input.Password
                          className="landing-password-input"
                          placeholder="请再次输入密码"
                          style={{
                            width: "100%",
                          }}
                        />
                      </Form.Item>

                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          block
                          loading={registerLoading}
                          style={{
                            marginTop: 8,
                            height: 44,
                            background: "linear-gradient(135deg, #22d3ee, #0ea5e9)",
                            border: "none",
                          }}
                        >
                          注册
                        </Button>
                      </Form.Item>
                    </Form>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="系统2分钟快速预览"
        open={previewOpen}
        onCancel={() => {
          setPreviewOpen(false);
          setPreviewLoadError(false);
        }}
        footer={null}
        width={isMobile ? "94%" : 960}
        destroyOnClose
      >
        {previewLoadError ? (
          <div
            style={{
              padding: 24,
              borderRadius: 8,
              background: "#111827",
              color: "#e5e7eb",
              textAlign: "center",
            }}
          >
            预览视频暂未部署，请稍后再试。
          </div>
        ) : (
          <video
            key={previewVideoUrl}
            src={previewVideoUrl}
            controls
            preload="metadata"
            onError={() => {
              setPreviewLoadError(true);
              message.warning("预览视频暂未部署");
            }}
            style={{ width: "100%", borderRadius: 8, background: "#000" }}
          />
        )}
      </Modal>
    </div>
  );
};

export default LandingPage;
