import { Button, Result } from "antd";
import { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";

export default function Error404() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  useEffect(() => {
    if (isNotFound && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, [isNotFound]);

  const goLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Result
        status={isNotFound ? "404" : "error"}
        title={isNotFound ? "404" : "Lỗi hệ thống"}
        subTitle={
          isNotFound
            ? "Xin lỗi! Trang bạn tìm kiếm không tồn tại."
            : "Đã xảy ra lỗi khi tải trang. Vui lòng đăng nhập lại."
        }
        extra={
          <Button type="primary" onClick={goLogin}>
            Về đăng nhập
          </Button>
        }
      />
    </div>
  );
}
