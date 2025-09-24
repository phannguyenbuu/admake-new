import {
  Form,
  Input,
  Button,
  Typography,
  Row,
  Col,
  message,
  Image,
  Select,
  Tooltip,
} from "antd";
import { PlusOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import type { FormUserProps } from "../../../@types/user.type";
import { useCreateUser, useUpdateUser } from "../../../common/hooks/user.hook";
import { useSettingQuery } from "../../../common/hooks/setting.hook";
import { useRoleQuery } from "../../../common/hooks/role.hook";
import type { Role } from "../../../@types/role.type";

export default function FormUser({
  onCancel,
  onRefresh,
  user,
  buttonText,
}: FormUserProps) {
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { data: settings } = useSettingQuery();
  const { data: roles } = useRoleQuery();

  // Get salary levels from settings
  const salaryLevels =
    (settings?.find((setting) => setting.key === "salary_level")
      ?.value as Array<{ id: string; salary: number; index: number }>) || [];

  // @ts-ignore
  const role = roles?.find((role: Role) => role._id === user?.role?._id);
  const isEditing = !!user;

  // options
  const rolesData = (Array.isArray(roles) && roles) || [];
  const roleOptions = rolesData.map((role: Role) => ({
    label: role.name,
    value: role._id,
  }));

  const salaryOptions = salaryLevels.map((level) => ({
    label: `Bậc ${level.index} - ${level.salary.toLocaleString("vi-VN")} VNĐ`,
    value: level.index,
  }));

  const getButtonText = () => {
    if (buttonText) return buttonText;
    return isEditing ? "Cập nhật" : "Tạo";
  };

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        phone: user.phone,
        username: user.username,
        password: user.password,
        role: role ? role?._id : user.role?._id,
        level_salary: user.level_salary,
      });
    } else {
      form.resetFields();
    }
  }, [user, form, roles]);

  const handleSubmit = async (values: any) => {
    try {
      const formData = new FormData();
      formData.append("fullName", values.fullName);
      formData.append("phone", values.phone);
      formData.append("username", values.username);

      if (values.password && values.password.trim() !== "") {
        formData.append("password", values.password);
      }

      formData.append("type", "employee");
      formData.append("role", values.role);
      formData.append("level_salary", values.level_salary?.toString() || "1");

      if (file) formData.append("avatar", file);

      if (isEditing && user) {
        updateUser(
          { dto: formData, id: user._id },
          {
            onSuccess: () => {
              message.success("Cập nhật người dùng thành công!");
              onCancel();
              onRefresh?.();
            },
            onError: () =>
              message.error("Có lỗi xảy ra khi cập nhật người dùng!"),
          }
        );
      } else {
        createUser(formData, {
          onSuccess: () => {
            message.success("Tạo người dùng thành công!");
            onCancel();
            onRefresh?.();
          },
          onError: () => message.error("Có lỗi xảy ra khi tạo người dùng!"),
        });
      }
    } catch {
      message.error("Có lỗi xảy ra!");
    }
  };

  return (
    <div
      className="
        w-full max-w-4xl mx-auto bg-white rounded-lg sm:rounded-xl lg:rounded-2xl
        shadow-lg sm:shadow-xl lg:shadow-2xl p-3 sm:p-4 border border-gray-100
        flex flex-col overflow-hidden
        max-h-[calc(100vh-200px)] -mt-13 sm:max-h-[calc(100vh-120px)]
      "
    >
      <Typography.Title
        level={3}
        className="text-center !text-[#00B4B6] !mb-4 sm:mb-6 !font-bold !text-lg sm:!text-xl lg:!text-2xl flex-shrink-0"
      >
        BẢNG NHÂN SỰ
      </Typography.Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        className="flex-1 flex flex-col min-h-0"
      >
        {/* Upload avatar */}
        <div className="flex flex-col items-center mb-4 sm:mb-6 flex-shrink-0">
          <div className="w-full text-left mb-3 sm:mb-4 text-sm sm:text-base font-semibold text-gray-700">
            Ảnh đại diện:
          </div>
          <div className="flex flex-col items-center">
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 border-2 border-dashed border-cyan-400 rounded-full flex flex-col items-center justify-center bg-white transition-all duration-300 cursor-pointer relative overflow-hidden shadow-lg hover:shadow-xl ${
                isDragging
                  ? "bg-cyan-100 border-cyan-600 shadow-2xl"
                  : "hover:bg-cyan-50 border-cyan-400"
              }`}
              onClick={() => document.getElementById("avatar-input")?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setFile(e.dataTransfer.files[0]);
                }
              }}
            >
              {file || user?.avatar ? (
                <Image
                  src={
                    file
                      ? URL.createObjectURL(file)
                      : `${import.meta.env.VITE_API_IMAGE}/${user?.avatar}`
                  }
                  alt="avatar preview"
                  className="w-full h-full object-cover rounded-full"
                  preview={false}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-1 sm:p-2">
                  <PlusOutlined className="!text-sm sm:!text-lg lg:!text-xl !text-[#00B4B6] !mb-1" />
                  <span className="text-xs text-gray-500 text-center px-1">
                    Thêm ảnh
                  </span>
                </div>
              )}
            </div>

            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />

            <div className="flex flex-col items-center mt-2 sm:mt-3 space-y-2">
              <span className="text-xs text-gray-500 text-center px-2">
                Kéo thả ảnh hoặc chọn từ tệp
              </span>
              <button
                type="button"
                className="text-xs bg-cyan-500 hover:bg-cyan-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                onClick={() => document.getElementById("avatar-input")?.click()}
              >
                Chọn tệp
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable fields */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 sm:space-y-4 pr-2 scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-gray-100 hover:scrollbar-thumb-cyan-600">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} lg={12}>
              <Form.Item
                name="fullName"
                label={
                  <span className="text-sm sm:text-base font-semibold text-gray-700">
                    Họ và tên:
                  </span>
                }
                rules={[{ required: true, message: "Nhập họ tên nhân sự" }]}
                className="!mb-0"
              >
                <Input
                  placeholder="Nhập họ tên nhân sự"
                  className="!text-sm sm:!text-base !h-9 sm:!h-10 !rounded-lg !border-gray-300 focus:!border-cyan-500 !shadow-lg hover:!shadow-xl !transition-all !duration-300"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={24} lg={12}>
              <Form.Item
                name="username"
                label={
                  <span className="text-sm sm:text-base font-semibold text-gray-700">
                    Tài khoản:
                    {isEditing && (
                      <span className="text-gray-400 text-xs ml-2">
                        (Không cho đổi tài khoản)
                      </span>
                    )}
                  </span>
                }
                rules={[{ required: true, message: "Nhập tên đăng nhập" }]}
                className="!mb-0"
              >
                <Input
                  placeholder="Nhập tên đăng nhập"
                  disabled={isEditing}
                  className={`!text-sm sm:!text-base !h-9 sm:!h-10 !rounded-lg !border-gray-300 focus:!border-cyan-500 !shadow-lg hover:!shadow-xl !transition-all !duration-300 ${
                    isEditing ? "!bg-gray-50" : ""
                  }`}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} lg={12}>
              <Form.Item
                name="password"
                label={
                  <span className="text-sm sm:text-base font-semibold text-gray-700 flex flex-row sm:items-center gap-1 sm:gap-2">
                    <span>Mật khẩu:</span>
                    <span className="text-gray-400 text-xs">
                      (Nếu không thay đổi không cần nhập)
                    </span>
                    <span>
                      <Tooltip
                        title={
                          <div className="text-xs">
                            <div className="font-semibold mb-2">
                              Yêu cầu mật khẩu:
                            </div>
                            <div>• Ít nhất 8 ký tự</div>
                            <div>• Có chữ hoa (A-Z)</div>
                            <div>• Có chữ thường (a-z)</div>
                            <div>• Có số (0-9)</div>
                            <div>• Có ký tự đặc biệt (@$!%*?&)</div>
                          </div>
                        }
                        placement="top"
                        color="#00B4B6"
                        getPopupContainer={() => document.body}
                      >
                        <InfoCircleOutlined className="!text-cyan-500 !text-sm cursor-help hover:!text-cyan-600 !transition-colors" />
                      </Tooltip>
                    </span>
                  </span>
                }
                rules={[
                  {
                    validator: (_, value) => {
                      if (!value || value.trim() === "")
                        return Promise.resolve();
                      const passwordRegex =
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                      if (!passwordRegex.test(value)) {
                        return Promise.reject(
                          "Mật khẩu phải có ít nhất 8 ký tự, bao gồm: chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)"
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                className="!mb-0"
              >
                <Input.Password
                  placeholder="Nhập mật khẩu"
                  className="!text-sm sm:!text-base !h-9 sm:!h-10 !rounded-lg !border-gray-300 focus:!border-cyan-500 !shadow-lg hover:!shadow-xl !transition-all !duration-300"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={24} lg={12}>
              <Form.Item
                name="phone"
                label={
                  <span className="text-sm sm:text-base font-semibold text-gray-700">
                    Số điện thoại:
                  </span>
                }
                rules={[{ required: true, message: "Nhập số điện thoại" }]}
                className="!mb-0"
              >
                <Input
                  placeholder="Nhập số điện thoại"
                  className="!text-sm sm:!text-base !h-9 sm:!h-10 !rounded-lg !border-gray-300 focus:!border-cyan-500 !shadow-lg hover:!shadow-xl !transition-all !duration-300"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={12}>
              <Form.Item
                name="role"
                label={
                  <span className="text-sm sm:text-base font-semibold text-gray-700">
                    Chức vụ:
                  </span>
                }
                rules={[{ required: true, message: "Chọn chức vụ" }]}
                className="!mb-0"
              >
                <Select
                  placeholder="Chọn chức vụ"
                  options={roleOptions}
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  getPopupContainer={() => document.body}
                  dropdownStyle={{ zIndex: 10000 }}
                  className="!text-sm sm:!text-base !h-9 sm:!h-10 !rounded-lg !border-gray-300 focus:!border-cyan-500 !shadow-lg hover:!shadow-xl !transition-all !duration-300"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={12}>
              <Form.Item
                name="level_salary"
                label={
                  <span className="text-sm sm:text-base font-semibold text-gray-700">
                    Bậc lương:
                  </span>
                }
                rules={[{ required: true, message: "Chọn bậc lương" }]}
                className="!mb-0"
              >
                <Select
                  placeholder="Chọn bậc lương"
                  options={salaryOptions}
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  getPopupContainer={() => document.body}
                  dropdownStyle={{ zIndex: 10000 }}
                  className="!text-sm sm:!text-base !h-9 sm:!h-10 !rounded-lg !border-gray-300 focus:!border-cyan-500 !shadow-lg hover:!shadow-xl !transition-all !duration-300"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Footer buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 lg:gap-6 mt-4 sm:mt-6 flex-shrink-0">
          <Button
            onClick={onCancel}
            disabled={isCreating || isUpdating}
            className="!border-cyan-400 !text-cyan-500 !text-sm sm:!text-base !font-semibold !px-6 sm:!px-8 !py-2 sm:!py-3 !h-9 sm:!h-10 !min-w-[100px] sm:!min-w-[120px] !rounded-lg hover:!bg-cyan-50 hover:!border-cyan-500 !transition-all !duration-300 !shadow-lg hover:!shadow-xl !order-2 sm:!order-1"
          >
            HỦY
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isCreating || isUpdating}
            className="!bg-cyan-500 !border-cyan-500 !text-white !text-sm sm:!text-base !font-semibold !px-6 sm:!px-8 !py-2 sm:!py-3 !h-9 sm:!h-10 !min-w-[100px] sm:!min-w-[120px] !rounded-lg hover:!bg-cyan-600 hover:!border-cyan-600 !transition-all !duration-300 !shadow-xl hover:!shadow-2xl hover:!scale-105 !order-1 sm:!order-2"
          >
            {isCreating || isUpdating ? "Đang xử lý..." : getButtonText()}
          </Button>
        </div>
      </Form>
    </div>
  );
}
