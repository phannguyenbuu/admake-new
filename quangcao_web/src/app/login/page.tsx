import { redirect } from "react-router-dom";
import type { IPage } from "../../@types/common.type";
import { TOKEN_LABEL } from "../../common/config";
import LoginForm from "./login.form";
import { useEffect } from "react";

export const Component: IPage["Component"] = () => {
  // Clear token cũ khi vào trang login
  useEffect(() => {
    localStorage.removeItem(TOKEN_LABEL);
  }, []);

  return (
    <div className="flex items-center justify-center  min-h-screen">
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

export const loader = async () => {
  if (localStorage.getItem(TOKEN_LABEL)) {
    return redirect("/dashboard");
  }
  return null;
};
