import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
export default function Error404() {
  const navigate = useNavigate();

  // This function is used to navigate back to the home page.
  const goHome = () => {
    navigate("/");
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Result
        status="404"
        title="404"
        subTitle="Xin lỗi! Trang bạn tìm kiếm không tồn tại."
        extra={
          <Button type="primary" onClick={goHome}>
            Về trang chủ
          </Button>
        }
      />
    </div>
  );
}

// This component is used to display a 404 error page in a React application.
