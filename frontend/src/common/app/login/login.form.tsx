import { Button, Form, Input, notification } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLoading } from "../../common/hooks/useLoading";
import type { User } from "../../@types/user.type";
import { AuthService } from "../../services/auth.service";
// import { useNavigate } from "react-router-dom";
import { useUser } from "../../common/hooks/useUser";
import { TOKEN_LABEL } from "../../common/config";

const LoginForm = () => {
  const { loading, toggle } = useLoading();
  // const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login } = useUser();  // lấy hàm login từ context

  const { mutate } = useMutation({
    mutationFn: async (values: Pick<User, "username" | "password">) => {
      const normalizedValues = {
        ...values,
        username: values.username,
      };
      return AuthService.login(normalizedValues); // gọi API login backend
    },
    onError: (error) => {
      notification.error({
        message: "Đăng nhập thất bại",
        description:
          error instanceof Error ? error.message : "Đã xảy ra lỗi khi đăng nhập",
      });
    },
    onSuccess: async (data) => {
      queryClient.clear();
      // localStorage.setItem(TOKEN_LABEL, data.access_token);

      // Sau khi login backend trả về, gọi login context truyền credentials để cập nhật trạng thái
      try {
        await login({
          username: data.username,
          password: "" // hoặc để "" nếu backend không yêu cầu password ở đây
        });
      } catch (e) {
        notification.error({ message: "Lỗi cập nhật trạng thái người dùng" });
      }

      notification.success({
        message: "Đăng nhập thành công",
        description: `Chào mừng bạn quay trở lại!`,
      });

      window.location.href = "/";
    },
    onMutate: toggle,
    onSettled: toggle,
  });

  return (
    <Form<Pick<User, "username" | "password">>
      name="login-form"
      className="login-form max-w-sm w-full mx-auto mt-10 min-w-[300px]"
      onFinish={mutate}
      layout="vertical"
    >
      <Form.Item
        label="Tên đăng nhập"
        name="username"
        rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập!" }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Nhập tên đăng nhập" />
      </Form.Item>
      <Form.Item
        label="Mật khẩu"
        name="password"
        rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          className="w-full"
          loading={loading}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default LoginForm;
