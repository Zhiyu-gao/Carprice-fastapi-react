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
          colorBgContainer: "#1f2937",     // Card/Table 背景
          colorBorder: "#374151",
          colorTextBase: "#f9fafb",
          colorTextSecondary: "#d1d5db",
          borderRadiusLG: 12,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>
);
