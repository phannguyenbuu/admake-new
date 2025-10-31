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
  notification,
} from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { PlusOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import type { FormUserProps } from "../../../@types/user.type";
import { useCreateUser, useUpdateUser } from "../../../common/hooks/user.hook";
import { useSettingQuery } from "../../../common/hooks/setting.hook";
import { useRoleQuery } from "../../../common/hooks/role.hook";
import type { Role } from "../../../@types/role.type";
import type { User } from '../../../@types/user.type';
import { InputNumber } from "antd";
import { useApiHost } from "../../../common/hooks/useApiHost";

export default function FormUser({
  onCancel,
  onRefresh,
  user,
  buttonText,
  isSupplier,
  isAppend,
}: FormUserProps) {
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { data: settings } = useSettingQuery();
  const { data: roles } = useRoleQuery();

  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (divRef.current) {
      setWidth(divRef.current.offsetWidth);
    }
    
    function handleResize() {
      if (divRef.current) {
        setWidth(divRef.current.offsetWidth);
      }
    }
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get salary levels from settings
  const salaryLevels =
    (settings?.find((setting) => setting.key === "salary_level")
      ?.value as Array<{ id: string; salary: number; index: number }>) || [];

  // @ts-ignore
  const role = roles?.find((role: Role) => role.id === user?.role?.id);
  const isEditing = !!user;

  // options
  const rolesData = (Array.isArray(roles) && roles) || [];
  const roleOptions = rolesData.map((role: Role) => ({
    label: role.name,
    value: role.id,
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
        role_id: isSupplier ? 101 : (role ?  role.id : user.role?.id),
        salary: user.salary,

        gender: user.gender,
        address: user.address,
        citizenId: user.citizenId,
        email: user.email,
        facebookAccount: user.facebookAccount,
        zaloAccount: user.zaloAccount,
        referrer: user.referrer,

        // Thêm các field khác nếu có trong form
      });
    } else {
      form.resetFields();
    }
  }, [user, form, role]);

  const handleDelete = () => {
    if (!user) return;

    fetch(`${useApiHost()}/user/${user.id}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          notification.error({message:"Xóa user thất bại"});
        }
        // Xử lý khi xóa thành công, ví dụ cập nhật state hoặc thông báo
        notification.success({message:`User ${user.fullName} đã được xóa`});
        if(onRefresh)
          onRefresh();

        if(onCancel)
          onCancel();
      })
      .catch((error) => {
        notification.error({message:"Lỗi khi xóa user:", description:error});
        if(onCancel)
          onCancel();
      });

    
  };



  const handleSubmit = async (values: any) => {
  try {
    const formData = new FormData();

    // Lấy tất cả key của values để append vào formData
    Object.entries(values).forEach(([key, value]) => {
      // Nếu là file, xử lý riêng
      
      if(isSupplier && key === "role_id")
        value = 101;
      console.log("Key data", isSupplier, key, value);
      if (key === 'avatar' && file) {
        formData.append(key, file);
      } else if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    // Các xử lý riêng biệt nếu cần, ví dụ password
    if (values.password && values.password.trim() !== "") {
      formData.append("password", values.password);
    }

    console.log("Create User", formData);

    // Các thao tác gọi API create/update
    if (isEditing && user) {
      updateUser({ dto: formData, id: user.id }, {
        onSuccess: () => {
          message.success("Cập nhật người dùng thành công!");
          onCancel();
          onRefresh?.();
        },
        onError: () => message.error("Có lỗi xảy ra khi cập nhật người dùng!")
      });
    } else {
      createUser(formData, {
        onSuccess: () => {
          message.success("Tạo người dùng thành công!");
          onCancel();
          onRefresh?.();
        },
        onError: () => message.error("Có lỗi xảy ra khi tạo người dùng!")
      });
    }
  } catch {
    message.error("Có lỗi xảy ra!");
  }
};
  

  return (
    <div ref={divRef}
      className="
        w-full max-w-4xl mx-auto bg-white rounded-lg sm:rounded-xl lg:rounded-2xl
        shadow-lg sm:shadow-xl lg:shadow-2xl p-3 sm:p-4 border border-gray-100
        flex flex-col overflow-hidden
        max-h-[calc(100vh-200px)] -mt-13 sm:max-h-[calc(100vh-120px)]
      "
    >
      <Button
        type="text"
        icon={<CloseOutlined />}
        onClick={onCancel}  // Hàm xử lý đóng form/modal bạn truyền vào
        style={{position:'relative', marginLeft:width - 60}}
        size="small"
      />
      <Typography.Title
        level={3}
        className="text-center !text-[#00B4B6] !mb-4 sm:mb-6 !font-bold !text-lg sm:!text-xl lg:!text-2xl flex-shrink-0"
      >
        {isSupplier? "BẢNG THẦU PHỤ":"BẢNG NHÂN SỰ"}
      </Typography.Title>

      {/* <Typography.Text>{user?.id}</Typography.Text> */}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        className="flex-1 flex flex-col min-h-0"
      >
        




        

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
                name="role_id"
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
                name="salary"
                label={
                  <span className="text-sm sm:text-base font-semibold text-gray-700">
                    Lương:
                  </span>
                }
                // rules={[{ required: false, message: "Chọn bậc lương" }]}
                className="!mb-0"
              >
               <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Nhập số tiền lương"
                  formatter={(value) =>
                    value
                      ? value
                          .toString()
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ".") // thêm dấu chấm hàng nghìn
                          .replace(",", ",") // dấu phẩy làm phân cách thập phân nếu cần
                      : ""
                  }
                  parser={(value) =>
                    value ? value.replace(/\./g, "").replace(",", ".") : ""
                  }
                />
              </Form.Item>
            </Col>
          </Row>



          <Row gutter={[16, 16]}>
  <Col xs={24} sm={12} lg={12}>
    <Form.Item
      name="gender"
      label={<span className="text-sm sm:text-base font-semibold text-gray-700">Giới tính:</span>}
      className="!mb-0"
    >
      <Select
        placeholder="Chọn giới tính"
        options={[
          { label: 'Nam', value: 'male' },
          { label: 'Nữ', value: 'female' },
          { label: 'Khác', value: 'other' },
        ]}
        allowClear
        getPopupContainer={() => document.body}
        className="!text-sm sm:!text-base !h-9 sm:!h-10 !rounded-lg !border-gray-300 focus:!border-cyan-500 !shadow-lg hover:!shadow-xl !transition-all !duration-300"
      />
    </Form.Item>
  </Col>

  <Col xs={24} sm={12} lg={12}>
    <Form.Item
      name="address"
      label={<span className="text-sm sm:text-base font-semibold text-gray-700">Địa chỉ:</span>}
      className="!mb-0"
    >
      <Input
        placeholder="Nhập địa chỉ"
        className="!text-sm sm:!text-base !h-9 sm:!h-10 !rounded-lg !border-gray-300 focus:!border-cyan-500 !shadow-lg hover:!shadow-xl !transition-all !duration-300"
      />
    </Form.Item>
  </Col>
</Row>

<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} lg={12}>
    <Form.Item
      name="citizenId"
      label={<span className="text-sm sm:text-base font-semibold text-gray-700">Căn cước công dân:</span>}
      className="!mb-0"
    >
      <Input
        placeholder="Nhập số căn cước"
        className="!text-sm sm:!text-base !h-9 sm:!h-10 !rounded-lg !border-gray-300 focus:!border-cyan-500 !shadow-lg hover:!shadow-xl !transition-all !duration-300"
      />
    </Form.Item>
  </Col>

  <Col xs={24} sm={12} lg={12}>
    <Form.Item
      name="email"
      label={<span className="text-sm sm:text-base font-semibold text-gray-700">Email:</span>}
      className="!mb-0"
      rules={[
        {
          type: 'email',
          message: 'Email không hợp lệ',
        },
      ]}
    >
      <Input
        placeholder="Nhập email"
        className="!text-sm sm:!text-base !h-9 sm:!h-10 !rounded-lg !border-gray-300 focus:!border-cyan-500 !shadow-lg hover:!shadow-xl !transition-all !duration-300"
      />
    </Form.Item>
  </Col>
</Row>

<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} lg={8}>
    <Form.Item
      name="facebookAccount"
      label={<span className="text-sm sm:text-base font-semibold text-gray-700">Tài khoản facebook:</span>}
      className="!mb-0"
    >
      <Input
        placeholder="Nhập tài khoản facebook"
        className="!text-sm sm:!text-base !h-9 sm:!h-10 !rounded-lg !border-gray-300 focus:!border-cyan-500 !shadow-lg hover:!shadow-xl !transition-all !duration-300"
      />
    </Form.Item>
  </Col>

  <Col xs={24} sm={12} lg={8}>
    <Form.Item
      name="zaloAccount"
      label={<span className="text-sm sm:text-base font-semibold text-gray-700">Tài khoản zalo:</span>}
      className="!mb-0"
    >
      <Input
        placeholder="Nhập tài khoản zalo"
        className="!text-sm sm:!text-base !h-9 sm:!h-10 !rounded-lg !border-gray-300 focus:!border-cyan-500 !shadow-lg hover:!shadow-xl !transition-all !duration-300"
      />
    </Form.Item>
  </Col>

  <Col xs={24} sm={12} lg={8}>
    <Form.Item
      name="referrer"
      label={<span className="text-sm sm:text-base font-semibold text-gray-700">Người giới thiệu:</span>}
      className="!mb-0"
    >
      <Input
        placeholder="Nhập tên người giới thiệu"
        className="!text-sm sm:!text-base !h-9 sm:!h-10 !rounded-lg !border-gray-300 focus:!border-cyan-500 !shadow-lg hover:!shadow-xl !transition-all !duration-300"
      />
    </Form.Item>
  </Col>
</Row>

        </div>

        {/* Footer buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 lg:gap-6 mt-4 sm:mt-6 flex-shrink-0">
          {!isAppend && <Button
            onClick={handleDelete}
            disabled={isCreating || isUpdating}
            className="!border-cyan-400 !text-cyan-500 !text-sm sm:!text-base !font-semibold !px-6 sm:!px-8 !py-2 sm:!py-3 !h-9 sm:!h-10 !min-w-[100px] sm:!min-w-[120px] !rounded-lg hover:!bg-cyan-50 hover:!border-cyan-500 !transition-all !duration-300 !shadow-lg hover:!shadow-xl !order-2 sm:!order-1"
          >
             {isSupplier? "XÓA THẦU PHỤ":"XÓA NHÂN SỰ"}
          </Button>}
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
