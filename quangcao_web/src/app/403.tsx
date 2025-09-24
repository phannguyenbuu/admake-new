import React from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const Error403: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="403"
      title="403"
      subTitle="Xin lỗi! Bạn không có quyền truy cập vào trang này."
      extra={
        <Button type="primary" onClick={() => navigate("/")}>
          Về trang chủ
        </Button>
      }
    />
  );
};

export default Error403;
