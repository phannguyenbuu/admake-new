import { Button, Form, Input, notification } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLoading } from "../../common/hooks/useLoading";
import type { User } from "../../@types/user.type";
import { AuthService } from "../../services/auth.service";
import { TOKEN_LABEL } from "../../common/config";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const { loading, toggle } = useLoading();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: async (values: Pick<User, "username" | "password">) => {
      // Chuyển đổi username thành lowercase trước khi gửi
      const normalizedValues = {
        ...values,
        username: values.username.toLowerCase(),
      };
      return AuthService.login(normalizedValues);
    },
    onError: (error) => {
      notification.error({
        message: "Đăng nhập thất bại",
        description:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi đăng nhập",
      });
    },
    onSuccess: (data) => {
      // Clear tất cả cache cũ trước khi login
      queryClient.clear();

      localStorage.setItem(TOKEN_LABEL, data.access_token);
      notification.success({
        message: "Đăng nhập thành công",
        description: `Chào mừng bạn quay trở lại!`,
      });
      navigate("/dashboard");
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
