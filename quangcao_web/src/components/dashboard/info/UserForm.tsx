import { Form, Input, Button, Divider, message } from "antd";
import {
  EditOutlined,
  SaveOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  UserOutlined,
  PhoneOutlined,
  LockOutlined,
  IdcardOutlined,
  CrownOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useUpdateInfo } from "../../../common/hooks/info.hook";
import { useState, useEffect } from "react";
import type {
  FormValues,
  UpdateData,
  UserFormProps,
} from "../../../@types/info.type";
import { useSettingQuery } from "../../../common/hooks/setting.hook";
import type { SalaryLevelItem } from "../../../@types/setting.type";

// Function format số tiền theo định dạng Việt Nam (1.000.000)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN").format(amount);
};

export const UserForm: React.FC<UserFormProps> = ({
  info,
  config,
  toggle,
  onRefetch,
}) => {
  const [form] = Form.useForm();
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: updateInfo, isPending: isUpdatingInfo } = useUpdateInfo();
  const { data: settings } = useSettingQuery();

  const salaryLevelsData =
    (settings?.find((setting) => setting.key === "salary_level")
      ?.value as Array<SalaryLevelItem>) || [];

  // Reset form values when info changes
  useEffect(() => {
    if (info && salaryLevelsData.length > 0) {
      // Tìm salary level tương ứng với info.salary
      const salaryLevel = salaryLevelsData.find(
        (level) => level.index === info.salary
      );

      const core: Omit<FormValues, "salary"> = {
        fullName: info.fullName || "",
        phone: info.phone || "",
        role: info.role?.name || "",
        username: info.username || "",
        total_salary: `${formatCurrency(info.total_salary || 0)}đ`,
      };

      const formValues = {
        ...core,
        salary: salaryLevel
          ? `Bậc ${salaryLevel.index}: ${formatCurrency(salaryLevel.salary)}đ`
          : `Bậc ${info.salary || "N/A"}`,
      };

      // Chỉ set password nếu API trả về (thường thì API không trả về password vì bảo mật)
      if (info.password) {
        formValues.password = info.password;
      }

      form.setFieldsValue(formValues);
    }
  }, [info, salaryLevelsData, form]);

  const handleSave = async (values: FormValues) => {
    try {
      // Chỉ lấy các trường được phép thay đổi và có giá trị
      const updateData: UpdateData = {
        fullName: values.fullName,
        phone: values.phone,
      };

      // Chỉ gửi password nếu user đã nhập password mới
      if (values.password && values.password.trim() !== "") {
        updateData.password = values.password;
      }

      // Không gửi username vì không cho phép thay đổi
      updateInfo(updateData, {
        onSuccess: () => {
          message.success("Cập nhật thông tin thành công!");
          // Xóa errors khi save thành công
          form.resetFields();
          toggle("openEdit")();
          onRefetch?.();
        },
        onError: () => {
          message.error("Có lỗi xảy ra khi cập nhật thông tin!");
        },
      });
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật thông tin!");
    }
  };

  const handleCancel = () => {
    toggle("openEdit")();
    // Xóa tất cả errors khi cancel
    form.resetFields();
    if (info && salaryLevelsData.length > 0) {
      // Tìm salary level tương ứng với info.salary
      const salaryLevel = salaryLevelsData.find(
        (level) => level.index === info.salary
      );

      const core: Omit<FormValues, "salary"> = {
        fullName: info.fullName || "",
        phone: info.phone || "",
        role: info.role?.name || "",
        username: info.username || "",
        total_salary: `${formatCurrency(info.total_salary || 0)}đ`,
      };
      const formValues = {
        ...core,
        salary: salaryLevel
          ? `Bậc ${salaryLevel.index}: ${formatCurrency(salaryLevel.salary)}đ`
          : `Bậc ${info.salary || "N/A"}`,
        username: info.username,
      };

      // Chỉ set password nếu API trả về
      if (info.password) {
        formValues.password = info.password;
      }

      form.setFieldsValue(formValues);
    }
  };

  const handleToggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Xóa errors khi tắt edit mode
  useEffect(() => {
    if (!config.openEdit) {
      form.resetFields();
      // Reset form values khi tắt edit
      if (info && salaryLevelsData.length > 0) {
        // Tìm salary level tương ứng với info.salary
        const salaryLevel = salaryLevelsData.find(
          (level) => level.index === info.salary
        );

        const core: Omit<FormValues, "salary"> = {
          fullName: info.fullName || "",
          phone: info.phone || "",
          role: info.role?.name || "",
          username: info.username || "",
          total_salary: `${formatCurrency(info.total_salary || 0)}đ`,
        };
        const formValues = {
          ...core,
          phone: info.phone || "",
          role: info.role?.name || "",
          salary: salaryLevel
            ? `Bậc ${salaryLevel.index}: ${formatCurrency(salaryLevel.salary)}đ`
            : `Bậc ${info.salary || "N/A"}`,
          username: info.username,
        };

        if (info.password) {
          formValues.password = info.password;
        }

        form.setFieldsValue(formValues);
      }
    }
  }, [config.openEdit, info, salaryLevelsData, form]);
  return (
    <div className="p-6">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={info}
        size="large"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cột trái */}
          <div className="space-y-6">
            <Form.Item
              label={
                <span className="text-gray-700 font-semibold">
                  <UserOutlined className="!mr-2" />
                  Họ tên
                </span>
              }
              name="fullName"
              rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
            >
              <Input
                placeholder="Nhập họ và tên"
                disabled={!config.openEdit}
                suffix={
                  config.openEdit && <EditOutlined className="!text-cyan-500" />
                }
                className={`!rounded-lg !border-gray-300 !shadow-lg !text-cyan-700 ${
                  config.openEdit ? "!bg-white" : "!bg-gray-50"
                }`}
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="text-gray-700 font-semibold">
                  <PhoneOutlined className="!mr-2" />
                  Số điện thoại
                </span>
              }
              name="phone"
              rules={[
                {
                  pattern: /^[0-9]{10,11}$/,
                  message: "Số điện thoại không hợp lệ!",
                },
              ]}
            >
              <Input
                placeholder="Nhập số điện thoại"
                disabled={!config.openEdit}
                className={`!rounded-lg !border-gray-300 !shadow-lg !text-cyan-700 ${
                  config.openEdit ? "!bg-white" : "!bg-gray-50"
                }`}
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="text-gray-500 font-semibold">
                  <IdcardOutlined className="!mr-2" />
                  Tài khoản{" "}
                  <span className="text-gray-400 text-xs">
                    (Không thể thay đổi)
                  </span>
                </span>
              }
              name="username"
            >
              <Input
                placeholder="Tên đăng nhập"
                disabled={true}
                className="!rounded-lg !border-gray-300 !shadow-lg !bg-gray-50 !text-cyan-700"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="text-gray-700 font-semibold">
                  <LockOutlined className="!mr-2" />
                  Mật khẩu{" "}
                  <span className="text-gray-400 text-xs">
                    (Để trống nếu không thay đổi)
                  </span>
                </span>
              }
              name="password"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value.trim() === "") {
                      return Promise.resolve(); // Cho phép để trống
                    }

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
            >
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={config.openEdit ? "Nhập mật khẩu mới" : "••••••••"}
                disabled={!config.openEdit}
                suffix={
                  <Button
                    type="text"
                    icon={
                      showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />
                    }
                    onClick={handleToggleShowPassword}
                    className="!text-cyan-500"
                    size="small"
                  />
                }
                className={`!rounded-lg !border-gray-300 !shadow-lg !text-cyan-700 ${
                  config.openEdit ? "!bg-white" : "!bg-gray-50"
                }`}
              />
              {/* Password requirements help text */}
              {config.openEdit && (
                <div className="text-xs text-gray-500 mt-1 ml-1">
                  <div>Yêu cầu mật khẩu:</div>
                  <div>• Ít nhất 8 ký tự</div>
                  <div>• Có chữ hoa (A-Z)</div>
                  <div>• Có chữ thường (a-z)</div>
                  <div>• Có số (0-9)</div>
                  <div>• Có ký tự đặc biệt (@$!%*?&)</div>
                </div>
              )}
            </Form.Item>
          </div>

          {/* Cột phải */}
          <div className="space-y-6">
            <Form.Item
              label={
                <span className="text-gray-500 font-semibold">
                  <CrownOutlined className="!mr-2" />
                  Chức vụ{" "}
                  <span className="text-gray-400 text-xs">
                    (Không thể thay đổi)
                  </span>
                </span>
              }
              name="role"
            >
              <Input
                placeholder="Chức vụ"
                disabled={true}
                className="!rounded-lg !border-gray-300 !shadow-lg !bg-gray-50 !text-cyan-700"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="text-gray-500 font-semibold">
                  <DollarOutlined className="!mr-2" />
                  Bậc lương{" "}
                  <span className="text-gray-400 text-xs">
                    (Không thể thay đổi)
                  </span>
                </span>
              }
              name="salary"
            >
              <Input
                placeholder="Bậc lương"
                disabled={true}
                className="!rounded-lg !border-gray-300 !shadow-lg !bg-gray-50 !text-cyan-700"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="text-gray-500 font-semibold">
                  <DollarOutlined className="!mr-2" />
                  Lương tích luỹ{" "}
                  <span className="text-gray-400 text-xs">
                    (Không thể thay đổi)
                  </span>
                </span>
              }
              name="total_salary"
            >
              <Input
                placeholder="Lương tích luỹ"
                disabled={true}
                className="!rounded-lg !border-gray-300 !shadow-lg !bg-gray-50 !text-cyan-700"
              />
            </Form.Item>
          </div>
        </div>

        {/* Action Buttons */}
        {config.openEdit && (
          <>
            <Divider className="!my-6" />
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                size="large"
                onClick={handleCancel}
                className="!rounded-lg !border-gray-300 !text-gray-600 hover:!border-gray-400 hover:!text-gray-700 !shadow-lg !w-full sm:!w-auto !h-10 !min-w-[100px]"
              >
                Hủy
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={isUpdatingInfo}
                icon={<SaveOutlined />}
                className="!rounded-lg !bg-cyan-500 !border-cyan-500 hover:!bg-cyan-600 hover:!border-cyan-600 !shadow-lg !w-full sm:!w-auto !h-10 !min-w-[140px]"
              >
                {isUpdatingInfo ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </>
        )}
      </Form>
    </div>
  );
};
