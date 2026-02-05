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
          colorBgBase: "#0b0f14",
          colorBgContainer: "#111827",
          colorBorder: "rgba(148, 163, 184, 0.22)",
          colorTextBase: "#f8fafc",
          colorTextSecondary: "#cbd5e1",
          colorPrimary: "#22d3ee",
          colorInfo: "#38bdf8",
          borderRadiusLG: 14,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>
);
