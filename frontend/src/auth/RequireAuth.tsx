import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn } from "./token";

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const location = useLocation();

  // 👇 关键：允许首次 render
  if (!isLoggedIn()) {
    // 如果已经在 login 页面，不要死循环
    if (location.pathname === "/login") {
      return children;
    }

    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
};

export default RequireAuth;
