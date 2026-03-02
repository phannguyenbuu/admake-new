import { useNavigate } from "react-router-dom";
import LoginForm from "./login.form";
import { useEffect } from "react";
import { useApiHost } from "../../common/hooks/useApiHost";

export const Login = () => {
  const navigate = useNavigate();
  const API_HOST = useApiHost();
  
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      localStorage.removeItem("accessToken");
      return;
    }

    const validate = async () => {
      try {
        const res = await fetch(`${API_HOST}/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (res.ok) {
          navigate("/users", { replace: true });
        } else {
          localStorage.removeItem("accessToken");
        }
      } catch {
        localStorage.removeItem("accessToken");
      }
    };

    validate();
  }, [navigate, API_HOST]);

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
  return null;
};

export default Login;
