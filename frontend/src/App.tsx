// src/App.tsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Layout, Menu, Button, Typography, Space, Spin } from "antd";
import {
  HomeOutlined,
  BarChartOutlined,
  RobotOutlined,
  IdcardOutlined,
  DatabaseOutlined,
  GithubOutlined,
  LogoutOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";


import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PredictPage from "./pages/PredictPage";
// import VehicleCrudPage from "./pages/VehicleCrudPage";
import AccountPage from "./pages/AccountPage";
import VisualizationPage from "./pages/VisualizationPage";
import CrawlerTaskPage from "./pages/CrawlerTaskPage";
import MetadataPage from "./pages/MetadataPage";
import AiChatPage from "./pages/AiChatPage";
import ProjectIntroPage from "./pages/ProjectIntroPage";
import RequireAuth from "./auth/RequireAuth";
import {clearToken } from "./auth/token";
import { api } from "./api/client";
import { useEffect, useState } from "react";

import BuyerPage from "./pages/BuyerPage";
import AdminMonitorPage from "./pages/AdminMonitorPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import ForumPage from "./pages/ForumPage";
import ChatPage from "./pages/ChatPage";
import SaasLandingPage from "./pages/SaasLandingPage";
import HealthcareDashboardPage from "./pages/HealthcareDashboardPage";
import PortfolioPage from "./pages/PortfolioPage";
import EcommerceMobilePage from "./pages/EcommerceMobilePage";
import FintechBankingPage from "./pages/FintechBankingPage";

const { Sider, Header, Content } = Layout;
const { Text } = Typography;
/** 登录后主布局 */
function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const path = location.pathname;

  const pathKeyMap: Record<string, string> = {
    "/predict": "predict",
    "/vehicles": "vehicles",
    "/visualization": "visualization",
    "/account": "account",
    "/ai_chat": "ai_chat",
    "/crawler": "crawler",
    "/metadata": "metadata",
    "/buyer": "buyer",
    "/admin/monitor": "admin_monitor",
    "/admin/users": "admin_users",
    "/forum": "forum",
    "/chat": "chat",
    "/intro": "intro",
  };

  const selectedKey =
    Object.entries(pathKeyMap).find(([p]) => path.startsWith(p))?.[1] ??
    "intro";


  const handleLogout = () => {
    clearToken?.(); // 如果你没有 clearToken，就删掉这一行，把 token 清理逻辑放这里
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    let mounted = true;
    api
      .get("/me")
      .then((res) => {
        if (!mounted) return;
        setMe(res.data);
      })
      .catch(() => {
        if (!mounted) return;
        setMe(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingMe(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loadingMe) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  const role = me?.role || "seller";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* 左侧 Sider */}
    <Sider
      width={240}
      style={{
        background: "linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(17, 24, 39, 0.9))",
        borderRight: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* 顶部 logo */}
      <div
        style={{
          height: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 18,
          color: "var(--text-primary)",
          borderBottom: "1px solid var(--border-color)",
          padding: "0 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "999px",
              background: "linear-gradient(135deg, #22d3ee, #f97316)",
              boxShadow: "0 0 12px rgba(34, 211, 238, 0.6)",
              display: "inline-block",
            }}
          />
          <span>车辆智能平台</span>
        </div>
      </div>

      {/* 主菜单 */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={({ key }) => {
          if (key === "predict") navigate("/predict");
          if (key === "vehicles") navigate("/vehicles");
          if (key === "visualization") navigate("/visualization");
          if (key === "account") navigate("/account");
          if (key === "ai_chat") navigate("/ai_chat");
          if (key === "crawler") navigate("/crawler");
          if (key === "metadata") navigate("/metadata");
          if (key === "buyer") navigate("/buyer");
          if (key === "admin_monitor") navigate("/admin/monitor");
          if (key === "admin_users") navigate("/admin/users");
          if (key === "forum") navigate("/forum");
          if (key === "chat") navigate("/chat");
          if (key === "intro") navigate("/intro");
          if (key === "github") {
            window.open("https://github.com/Zhiyu-gao/Carprice-fastapi-react", "_blank");
          }
        }}
        style={{
          paddingTop: 20,
          background: "transparent",
          flex: 1,
        }}
        items={[
        {
          key: "intro",
          icon: <InfoCircleOutlined />,
          label: "项目介绍",
        },
        {
          key: "predict",
          icon: <HomeOutlined />,
          label: "车辆价格预测",
        },
        {
          key: "visualization",
          icon: <BarChartOutlined />,
          label: "可视化大屏",
        },
        {
          key: "account",
          icon: <IdcardOutlined />,
          label: "我的信息",
        },

        { type: "divider" },

        {
          key: "ai_chat",
          icon: <RobotOutlined />,
          label: "AI 问答助手",
        },
        {
          key: "forum",
          icon: <DatabaseOutlined />,
          label: "论坛",
        },
        {
          key: "chat",
          icon: <RobotOutlined />,
          label: "聊天",
        },
        ...(role === "buyer" || role === "admin"
          ? [
              {
                key: "buyer",
                icon: <DatabaseOutlined />,
                label: "我要买房",
              },
            ]
          : []),
        ...(role === "admin"
          ? [
              {
                key: "admin_monitor",
                icon: <BarChartOutlined />,
                label: "系统监控",
              },
              {
                key: "admin_users",
                icon: <IdcardOutlined />,
                label: "用户管理",
              },
            ]
          : []),
        {
          key: "crawler",
          icon: <DatabaseOutlined />,
          label: "爬虫任务",
        },
        {
          key: "metadata",
          icon: <DatabaseOutlined />,
          label: "元数据标注后台",
        },
        {
          key: "github",
          icon: <GithubOutlined />,
          label: "源码仓库",
        },
      ]}

    />

      {/* 底部退出按钮 */}
      <div
        style={{
          borderTop: "1px solid var(--border-color)",
          padding: 16,
        }}
      >
        <Button
          block
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{
            borderRadius: '8px',
          }}
        >
          退出登录
        </Button>
      </div>
    </Sider>


      <Layout>
        {/* 顶部导航栏 */}
        <Header
          style={{
            background: "rgba(15, 23, 42, 0.9)",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            height: 70,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Text style={{ color: "var(--text-primary)", fontSize: 18, fontWeight: 600 }}>
              车辆智能平台管理系统
            </Text>
          </div>
          <Space size={24}>
            <a
              href="https://github.com/Zhiyu-gao/Carprice-fastapi-react" 
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--text-secondary)", fontSize: 20 }}
            >
              <GithubOutlined />
            </a>
            <Text type="secondary" style={{ fontSize: 13, color: "var(--text-muted)" }}>
              已登录
            </Text>
            <Button
              size="middle"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{
                borderRadius: '8px',
              }}
            >
              退出登录
            </Button>
          </Space>
        </Header>

        <Content
          style={{
            background: "transparent",
            padding: 32,
            minHeight: 'calc(100vh - 70px)',
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

function RequireRole({ allow, children }: { allow: string[]; children: React.ReactElement }) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .get("/me")
      .then((res) => {
        if (!mounted) return;
        setRole(res.data?.role || null);
      })
      .catch(() => {
        if (!mounted) return;
        setRole(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin />
      </div>
    );
  }

  if (!role || !allow.includes(role)) {
    return <Navigate to="/intro" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* UI/UX ProMax 页面预览（无需登录） */}
        <Route path="/ui/saas-landing" element={<SaasLandingPage />} />
        <Route path="/ui/healthcare-dashboard" element={<HealthcareDashboardPage />} />
        <Route path="/ui/portfolio" element={<PortfolioPage />} />
        <Route path="/ui/ecommerce-mobile" element={<EcommerceMobilePage />} />
        <Route path="/ui/fintech-banking" element={<FintechBankingPage />} />

        {/* 登录/注册 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 受保护的主应用 */}
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/intro" element={<ProjectIntroPage />} />
          <Route path="/predict" element={<PredictPage />} />
          {/* <Route path="/vehicles" element={<VehicleCrudPage />} /> */}
          <Route path="/visualization" element={<VisualizationPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/ai_chat" element={<AiChatPage />} />
          <Route index element={<Navigate to="/intro" replace />} />
          <Route path="/crawler" element={<CrawlerTaskPage />} />
          <Route path="/metadata" element={<MetadataPage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:userId" element={<ChatPage />} />
          <Route
            path="/buyer"
            element={
              <RequireRole allow={["buyer", "admin"]}>
                <BuyerPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/monitor"
            element={
              <RequireRole allow={["admin"]}>
                <AdminMonitorPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireRole allow={["admin"]}>
                <AdminUsersPage />
              </RequireRole>
            }
          />
        </Route>

        {/* 兜底 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
