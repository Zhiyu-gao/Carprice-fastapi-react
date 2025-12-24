// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";

import "antd/dist/reset.css";
import "./index.css";
import App from "./App";

const { darkAlgorithm } = theme;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: darkAlgorithm,
        token: {
          colorBgBase: "#020617",          // 整体背景
          colorBgContainer: "#020617",     // Card/Table 背景
          colorBorder: "#1f2937",
          colorTextBase: "#e5e7eb",
          colorTextSecondary: "#9ca3af",
          borderRadiusLG: 12,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>
);
