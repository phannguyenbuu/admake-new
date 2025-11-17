import type { IPage } from "../../@types/common.type";
import { useState } from "react";
import { Card, Button, Modal, Form, Input, message, notification } from "antd";
import { useUser } from "../../common/hooks/useUser";
import { useApiHost } from "../../common/hooks/useApiHost";

export const InforDashboard: IPage["Component"] = () => {
  const {userId, username, userRole, fullName, setFullName} = useUser();

  const [form] = Form.useForm();
  const [config, setConfig] = useState({
    openEdit: false,
  });

  const toggle = (key: keyof typeof config) => {
    return () => {
      setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
    };
  };

  const onFinish = async (values: any) => {
    console.log("Form values", values);

    try {
      const response = await fetch(`${useApiHost()}/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        notification.error({message:"Lỗi server:", description:data.description});
        // message.error(data.description || "Cập nhật thất bại");
        return;
      }

      setFullName(values.fullName);
      message.success("Cập nhật thông tin thành công");
      setConfig((prev) => ({ ...prev, openEdit: false }));
    } catch (error) {
      console.error("Fetch error:", error);
      message.error("Lỗi server");
    }
  };


  const validatePassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error("Vui lòng nhập mật khẩu"));
    }
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(value)) {
      return Promise.reject(
        new Error(
          "Mật khẩu phải gồm ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
        )
      );
    }
    return Promise.resolve();
  };

  return (
    <>
    <div className="py-3 lg:pt-20 w-full flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" />

      <div className="w-full max-w-2xl mx-auto relative z-10 px-2">
        {/* Single Card Container */}
        <Card
          className="!shadow-2xl !border-0 !backdrop-blur-xl !rounded-2xl"
          bodyStyle={{ padding: "0" }}
        >
          {/* Header với Avatar */}
          
          <div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-t-xl sm:rounded-t-2xl p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col items-center relative">
              {/* User Info */}
              <div className="text-center text-white">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-1 drop-shadow-lg">
                  {fullName}
                </h2>
                <p className="text-sm sm:text-base text-cyan-200 drop-shadow-md">
                  {userRole?.name}
                </p>
              </div>


              <Button type="primary" onClick={toggle("openEdit")} className="mt-4">
                THAY ĐỔI THÔNG TIN
              </Button>
            </div>
          </div>

          
        </Card>
      </div>


      
    </div>

    <Modal
        title="Thay đổi thông tin cá nhân"
        open={config.openEdit}
        onCancel={toggle("openEdit")}
        footer={null}
        // destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish} preserve={false}>
          <Form.Item label="Tên" name="fullName" rules={[{ required: false, message: "Vui lòng nhập tên" }]}>
            <Input placeholder="Tên của bạn" defaultValue={fullName ?? ''} />
          </Form.Item>

          <OldPasswordInput userId={userId ?? ''}/>

          <Form.Item
            label="Mật khẩu mới"
            name="password"
            rules={[{ validator: validatePassword }]}
            hasFeedback
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Xác nhận mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>

  );
};

export const loader = async () => {
  return null;
};


const OldPasswordInput = ({ userId }: { userId: string }) => {
  const [valid, setValid] = useState(true);

  const checkOldPassword = async (e: React.FocusEvent<HTMLInputElement>) => {
    const oldPassword = e.target.value;
    if (!oldPassword) return;

    try {
      const res = await fetch(`${useApiHost()}/user/${userId}/check-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_password: oldPassword }),
      });
      const data = await res.json();
      console.log('message',data);
      if (data.message = "right password") {
        setValid(true);
        notification.success({message:"Mật khẩu cũ đúng"});
      } else {
        setValid(false);
        notification.error({message:"Mật khẩu cũ không đúng"});
      }
    } catch (error) {
      notification.error({message:"Mật khẩu cũ không đúng"});
    }
  };

  return (
    <Form.Item
      name="old_password"
      label="Mật khẩu cũ"
      validateStatus={valid ? "" : "error"}
      help={valid ? "" : "Mật khẩu cũ không đúng"}
      rules={[{ required: true, message: "Vui lòng nhập mật khẩu cũ" }]}
    >
      <Input.Password onBlur={checkOldPassword} />
    </Form.Item>
  );
};
