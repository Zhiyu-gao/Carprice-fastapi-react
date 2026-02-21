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
  DashboardOutlined,
  MessageOutlined,
  UsergroupAddOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";

import LandingPage from "./pages/LandingPage";
import PredictPage from "./pages/PredictPage";
import AccountPage from "./pages/AccountPage";
import VisualizationPage from "./pages/VisualizationPage";
import CrawlerTaskPage from "./pages/CrawlerTaskPage";
import MetadataPage from "./pages/MetadataPage";
import AiChatPage from "./pages/AiChatPage";
import ProjectIntroPage from "./pages/ProjectIntroPage";
import RequireAuth from "./auth/RequireAuth";
import { clearToken } from "./auth/token";
import { api } from "./api/client";
import { useEffect, useState } from "react";

import BuyerPage from "./pages/BuyerPage";
import AdminMonitorPage from "./pages/AdminMonitorPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import ForumPage from "./pages/ForumPage";
import ChatPage from "./pages/ChatPage";
import AuthorPage from "./pages/AuthorPage";
import SaasLandingPage from "./uiux-page/SaasLandingPage";
import HealthcareDashboardPage from "./uiux-page/HealthcareDashboardPage";
import PortfolioPage from "./uiux-page/PortfolioPage";
import EcommerceMobilePage from "./uiux-page/EcommerceMobilePage";
import FintechBankingPage from "./uiux-page/FintechBankingPage";
import TestPage from "./pages/Test";

const { Header, Content } = Layout;
const { Text } = Typography;

/** 登录后主布局 - 顶部导航栏 */
function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const path = location.pathname;

  const pathKeyMap: Record<string, string> = {
    "/intro": "intro",
    "/predict": "predict",
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
    "/author": "author",
  };

  const selectedKey =
    Object.entries(pathKeyMap).find(([p]) => path.startsWith(p))?.[1] ??
    "intro";

  const handleLogout = () => {
    clearToken?.();
    navigate("/landing", { replace: true });
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

  // 构建菜单项
  const menuItems = [
    {
      key: "intro",
      icon: <HomeOutlined />,
      label: "首页",
    },
    {
      key: "predict",
      icon: <BarChartOutlined />,
      label: "价格预测",
    },
    {
      key: "visualization",
      icon: <DashboardOutlined />,
      label: "可视化",
    },
    {
      key: "ai_chat",
      icon: <RobotOutlined />,
      label: "AI助手",
    },
    {
      key: "forum",
      icon: <MessageOutlined />,
      label: "论坛",
    },
    {
      key: "chat",
      icon: <IdcardOutlined />,
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
            icon: <SettingOutlined />,
            label: "系统监控",
          },
          {
            key: "admin_users",
            icon: <UsergroupAddOutlined />,
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
      label: "元数据",
    },
    {
      key: "author",
      icon: <UserOutlined />,
      label: "关于作者",
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* 顶部导航栏 */}
      <Header
        style={{
          background: "#0F172A",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          height: 64,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/intro")}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #22d3ee, #f97316)",
              boxShadow: "0 0 12px rgba(34, 211, 238, 0.6)",
            }}
          />
          <Text style={{ color: "white", fontSize: 18, fontWeight: 700 }}>
            车辆智能平台
          </Text>
        </div>

        {/* 导航菜单 */}
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => {
            if (key === "predict") navigate("/predict");
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
            if (key === "author") navigate("/author");
          }}
          items={menuItems}
          style={{
            background: "transparent",
            border: "none",
            flex: 1,
            marginLeft: 48,
            maxWidth: 800,
          }}
        />

        {/* 右侧操作区 */}
        <Space size={24}>
          <Button
            type="text"
            icon={<GithubOutlined style={{ color: "#94A3B8", fontSize: 20 }} />}
            onClick={() =>
              window.open("https://github.com/Zhiyu-gao/Carprice-fastapi-react", "_blank")
            }
          />
          <Button
            type="primary"
            ghost
            icon={<IdcardOutlined />}
            onClick={() => navigate("/account")}
            style={{
              borderColor: "rgba(255,255,255,0.3)",
              color: "white",
            }}
          >
            我的
          </Button>
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            退出
          </Button>
        </Space>
      </Header>

      {/* 主内容区 */}
      <Content
        style={{
          background: "#020617",
          padding: 0,
          marginTop: 64,
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <Outlet />
      </Content>
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

        {/* 测试页面（无需登录） */}
        <Route path="/test" element={<TestPage />} />

        {/* 登录/注册/介绍合并页 */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LandingPage />} />
        <Route path="/register" element={<LandingPage />} />

        {/* 受保护的主应用 */}
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/intro" element={<ProjectIntroPage />} />
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/visualization" element={<VisualizationPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/ai_chat" element={<AiChatPage />} />
          <Route index element={<Navigate to="/intro" replace />} />
          <Route path="/crawler" element={<CrawlerTaskPage />} />
          <Route path="/metadata" element={<MetadataPage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:userId" element={<ChatPage />} />
          <Route path="/author" element={<AuthorPage />} />
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
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
