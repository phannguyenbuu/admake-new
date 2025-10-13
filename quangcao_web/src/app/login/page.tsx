import { redirect, useNavigate } from "react-router-dom";
import LoginForm from "./login.form";
import { useEffect } from "react";

export const Component = () => {
  const navigate = useNavigate();
  
  const accessToken = sessionStorage.getItem("accessToken");
  if (accessToken) {
    // Nếu token tồn tại trong sessionStorage thì redirect dashboard tránh nhấp nháy
    navigate("/dashboard", { replace: true });
  } else {
    sessionStorage.removeItem("accessToken"); // xóa nếu không thì có thể còn sót
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm min-w-[400px]">
        {/* logo */}
        <div className="flex items-center justify-center pb-5">
          <div className="flex items-center justify-center">
            <img src="/logo.jpg" alt="logo" className="w-13 h-13" />
          </div>
          <div className="flex items-center justify-center">
            <img src="/ADMAKE.svg" alt="ADMAKE" className="h-8" />
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};

// Loader vẫn có thể dùng để redirect nếu cần
export const loader = async () => {
  if (sessionStorage.getItem("accessToken")) {
    return redirect("/dashboard");
  }
  return null;
};
