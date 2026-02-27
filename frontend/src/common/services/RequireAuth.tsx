import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../common/hooks/useUser";

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { userId } = useUser();
  const location = useLocation();

  if (!userId) {
    // Token invalid hoặc chưa đăng nhập -> redirect về /login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;