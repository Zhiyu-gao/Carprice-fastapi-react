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
import { Layout, Menu, Button, Typography, Space } from "antd";
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

const { Sider, Header, Content } = Layout;
const { Text } = Typography;
/** 登录后主布局 */
function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;

  const pathKeyMap: Record<string, string> = {
    "/predict": "predict",
    "/vehicles": "vehicles",
    "/visualization": "visualization",
    "/account": "account",
    "/ai_chat": "ai_chat",
    "/crawler": "crawler",
    "/metadata": "metadata",
    "/intro": "intro",
  };

  const selectedKey =
    Object.entries(pathKeyMap).find(([p]) => path.startsWith(p))?.[1] ??
    "intro";


  const handleLogout = () => {
    clearToken?.(); // 如果你没有 clearToken，就删掉这一行，把 token 清理逻辑放这里
    navigate("/login", { replace: true });
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* 左侧 Sider */}
    <Sider
      width={230}
      style={{
        background: "#020617",
        borderRight: "1px solid #111827",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* 顶部 logo */}
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          fontSize: 18,
          color: "#e5e7eb",
          borderBottom: "1px solid #111827",
        }}
      >
        🚗 车辆价格预测系统
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
          // 新增路由（你之后需要在 Routes 中补上页面）
          if (key === "crawler") navigate("/crawler");
          if (key === "metadata") navigate("/metadata");
          if (key === "intro") navigate("/intro");
          if (key === "github") {
            window.open("https://github.com/Zhiyu-gao/Carprice-fastapi-react", "_blank");
          }
        }}
        style={{
          paddingTop: 12,
          background: "#020617",
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
          key: "metadata",
          icon: <DatabaseOutlined />,
          label: "元数据标注后台",
        },
        // {
        //   key: "crawler",
        //   icon: <CloudDownloadOutlined />,
        //   label: "爬虫任务管理",
        // },
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
          borderTop: "1px solid #111827",
          padding: 12,
        }}
      >
        <Button
          block
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        >
          退出登录
        </Button>
      </div>
    </Sider>


      <Layout>
        {/* 顶部细白条 */}
        <Header
          style={{
            background: "#020617",
            borderBottom: "1px solid #111827",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
          }}
        >
          <Text style={{ color: "#e5e7eb", fontSize: 16 }}>
            车辆价格预测 & 车辆管理后台
          </Text>
          <Space size={16}>
            <a
              href="https://github.com/Zhiyu-gao/Vehicle-Intelligence-Platform" 
              target="_blank"
              rel="noreferrer"
              style={{ color: "#e5e7eb", fontSize: 20 }}
            >
              <GithubOutlined />
            </a>
            <Text type="secondary" style={{ fontSize: 13 }}>
              已登录
            </Text>
            <Button
              size="small"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              退出登录
            </Button>
          </Space>
        </Header>

        <Content
          style={{
            background: "#020617",
            padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 1120,
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
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
        </Route>

        {/* 兜底 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
