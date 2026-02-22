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
import { Layout, Menu, Button, Typography, Space, Spin, Dropdown, Avatar } from "antd";
import {
  HomeOutlined,
  BarChartOutlined,
  RobotOutlined,
  IdcardOutlined,
  DatabaseOutlined,
  GithubOutlined,
  LogoutOutlined,
  MessageOutlined,
  UsergroupAddOutlined,
  UserOutlined,
  FundProjectionScreenOutlined,
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";

import LandingPage from "./pages/LandingPage";
import PredictPage from "./pages/PredictPage";
import AccountPage from "./pages/AccountPage";
import VisualizationPage from "./pages/VisualizationPage";
import VisualizationScreenPage from "./pages/VisualizationScreenPage";
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

const { Header, Content } = Layout;
const { Text } = Typography;

/** 登录后主布局 - 顶部导航栏 */
function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [me, setMe] = useState<{ role: string; username?: string } | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [screenMenuVisible, setScreenMenuVisible] = useState(false);

  const path = location.pathname;
  const isVisualizationScreen = path.startsWith("/visualization-screen");
  const showTopHeader = !isVisualizationScreen || screenMenuVisible;

  const pathKeyMap: Record<string, string> = {
    "/intro": "intro",
    "/predict": "predict",
    "/visualization": "visualization",
    "/visualization-screen": "visualization_screen",
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

  useEffect(() => {
    setScreenMenuVisible(!isVisualizationScreen);
  }, [isVisualizationScreen]);

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
    // 暂时隐藏「可视化」
    {
      key: "visualization_screen",
      icon: <FundProjectionScreenOutlined />,
      label: "数据大屏",
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
            label: "我要买车",
          },
        ]
      : []),
    ...(role === "admin"
      ? [
          // 暂时隐藏「系统监控」
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
  ];

  const userMenuItems = [
    {
      key: "account",
      icon: <IdcardOutlined />,
      label: "个人信息",
      onClick: () => navigate("/account"),
    },
    {
      key: "author",
      icon: <UserOutlined />,
      label: "关于作者",
      onClick: () => navigate("/author"),
    },
    {
      key: "github",
      icon: <GithubOutlined />,
      label: "GitHub",
      onClick: () =>
        window.open("https://github.com/Zhiyu-gao/Carprice-fastapi-react", "_blank"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出",
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {showTopHeader && (
        <Header
          style={{
            background: "#0F172A",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "grid",
            gridTemplateColumns: "220px 1fr 220px",
            alignItems: "center",
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
          <div
            style={{
              width: "100%",
              overflowX: "auto",
              scrollbarWidth: "none",
              display: "flex",
              justifyContent: "center",
            }}
            >
              <Menu
                theme="dark"
                mode="horizontal"
                selectedKeys={[selectedKey]}
                disabledOverflow
                onClick={({ key }) => {
                  if (key === "predict") navigate("/predict");
                  if (key === "visualization") navigate("/visualization");
                  if (key === "visualization_screen") navigate("/visualization-screen");
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
                  minWidth: "max-content",
                }}
              />
            </div>

          {/* 右侧操作区 */}
          <Space size={16} style={{ justifySelf: "end" }}>
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                type="text"
                style={{ height: 42, paddingInline: 10, color: "#e2e8f0" }}
              >
                <Space size={8}>
                  <Avatar
                    size={30}
                    style={{ background: "linear-gradient(135deg, #22d3ee, #0ea5e9)" }}
                    icon={<UserOutlined />}
                  />
                  <span style={{ fontSize: 13 }}>{me?.username || "用户中心"}</span>
                  <DownOutlined style={{ fontSize: 12, color: "#94a3b8" }} />
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>
      )}

      {isVisualizationScreen && (
        <Button
          type="primary"
          shape="round"
          icon={showTopHeader ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={() => setScreenMenuVisible((prev) => !prev)}
          style={{
            position: "fixed",
            right: 16,
            top: showTopHeader ? 74 : 12,
            zIndex: 1300,
            background: "rgba(13, 52, 94, 0.92)",
            borderColor: "rgba(109, 212, 255, 0.72)",
            boxShadow: "0 0 14px rgba(84, 198, 255, 0.36)",
          }}
        >
          {showTopHeader ? "隐藏菜单" : "显示菜单"}
        </Button>
      )}

      {/* 主内容区 */}
      <Content
        style={{
          background: "#020617",
          padding: 0,
          marginTop: showTopHeader ? 64 : 0,
          minHeight: showTopHeader ? "calc(100vh - 64px)" : "100vh",
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

        {/* 登录/注册/介绍合并页 */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LandingPage />} />
        <Route path="/register" element={<LandingPage />} />

        {/* 受保护的主应用 */}
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/intro" element={<ProjectIntroPage />} />
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/visualization" element={<VisualizationPage />} />
          <Route path="/visualization-screen" element={<VisualizationScreenPage />} />
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
