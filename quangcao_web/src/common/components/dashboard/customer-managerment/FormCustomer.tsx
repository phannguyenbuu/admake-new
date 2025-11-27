import {
  Form,
  Input,
  Button,
  Typography,
  DatePicker,
  Select,
  InputNumber,
  Modal,
  message,
} from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  UserOutlined,
  PhoneOutlined,
  ToolOutlined,
  EnvironmentOutlined,
  DollarOutlined,
} from "@ant-design/icons";
// import type { Customer } from "../../../@types/customer.type";
import {
  useCreateCustomer,
  useCustomerDetail,
  useUpdateCustomer,
} from "../../../common/hooks/customer.hook";
// import { useCreateUser } from "../../../common/hooks/user.hook";
import { useUser } from "../../../common/hooks/useUser";
import type { WorkSpace } from "../../../@types/work-space.type";

const { Title, Text } = Typography;

interface FormCustomerProps {
  onDelete?: () => void | null;
  onCancel: () => void;
  initialValues?: WorkSpace;
  open: boolean;
  onRefresh: () => void;
}

export default function FormCustomer({
  onDelete,onCancel,
  initialValues,
  open,
  onRefresh,
}: FormCustomerProps) {
  const [form] = Form.useForm();
  const {userLeadId, workspaces, setWorkspaces} = useUser();
  const [formValues, setFormValues] = useState<any>({});
  const { mutate: createCustomer, data:workSpaceItem, error, isPending: isCreating } = useCreateCustomer();
  const { mutate: updateCustomer, isPending: isUpdating } = useUpdateCustomer();
  const { data: customerDetail, isLoading: isLoadingCustomerDetail } = useCustomerDetail(initialValues?.id);

  const isEdit = !!initialValues;
  const isPending = isCreating || isUpdating || isLoadingCustomerDetail;

  useEffect(() => {
    console.log('initialValues', initialValues, userLeadId);
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        // workStart: dayjs(initialValues.workStart),
        // workEnd: dayjs(initialValues.workEnd),
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const onFinish = (
    values: Omit<WorkSpace, "createdAt" | "updatedAt" | "deletedAt">
  ) => {
    
    const formattedValues = {
      ...values,
      lead:userLeadId,
      // ...(values.workInfo && {
      //   workInfo: values.workInfo,
      // }),
      // ...(values.workAddress && {
      //   workAddress: values.workAddress,
      // }),
      // ...(values.workPrice && {
      //   workPrice: values.workPrice,
      // }),
      // ...(values.status && {
      //   status: values.status,
      // }),
      // ...(values.workStart && {
      //   workStart: dayjs(values.workStart).format("YYYY-MM-DD"),
      // }),
      // ...(values.workEnd && {
      //   workEnd: dayjs(values.workEnd).format("YYYY-MM-DD"),
      // }),
    };


    // console.log("Customers:", values, initialValues?.id, customerDetail);
    if (customerDetail) {
      updateCustomer(
        { dto: formattedValues, id: initialValues?.id || "" },
        {
          onSuccess: () => {
            message.success("Cập nhật khách hàng thành công");
            form.resetFields();
            // onDelete();
            onRefresh();
            // window.location.reload();
          },
          onError: () => {
            message.error("Cập nhật khách hàng thất bại");
          },
        }
      );
    } else {
      console.log('Cretae customer', formattedValues);
      
      createCustomer(formattedValues, {
        onSuccess: () => {
          message.success("Tạo khách hàng thành công");
          form.resetFields();
          // onDelete();
          onRefresh();
        },
        onError: () => {
          message.error("Tạo khách hàng thất bại");
        },
      });
    }
  };

  // Hàm kiểm tra form có hợp lệ không
  const isFormValid = () => {
    
    try {
      // Kiểm tra các trường bắt buộc cơ bản
      if (!formValues.name || !formValues.phone) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  // Kiểm tra form có hợp lệ để enable/disable nút submit
  const canSubmit = isFormValid();

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };


  // Hàm xử lý khi click nút submit
  const handleSubmit = () => {
    if (!isFormValid()) {
      message.warning("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }

    form
      .validateFields()
      .then(() => {
        onFinish(form.getFieldsValue());
      })
      .catch(() => {
        message.error("Vui lòng kiểm tra lại thông tin");
      });

      onCancel();
  };

  // Theo dõi thay đổi form để cập nhật validation
  useEffect(() => {
    const interval = setInterval(() => {
      const currentValues = form.getFieldsValue();
      setFormValues(currentValues);
    }, 100);

    return () => clearInterval(interval);
  }, [form]);

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#00B4B6] to-[#0891b2] flex items-center justify-center shadow-lg">
            <UserOutlined className="!text-white !text-sm sm:!text-base" />
          </div>
          <div className="flex-1 min-w-0">
            <Title
              level={5}
              className="!m-0 !text-gray-900 !font-bold !text-sm sm:!text-base"
            >
              {isEdit ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}
            </Title>
            <Text className="text-gray-500 text-xs sm:text-sm !block !truncate">
              {isEdit
                ? "Cập nhật thông tin khách hàng"
                : "Điền thông tin khách hàng mới"}
            </Text>
          </div>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width="calc(100vw - 32px)"
      style={{
        maxWidth: "600px",
      }}
      centered
      destroyOnHidden
      maskClosable={false}
      className="!rounded-xl sm:!rounded-2xl customer-modal"
      styles={{
        content: {
          borderRadius: "12px",
          overflow: "hidden",
          padding: 0,
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)",
        },
        body: {
          padding: 0,
          borderRadius: "12px",
          maxHeight: "calc(100vh - 250px)", // Giới hạn chiều cao
          overflowY: "auto", // Ẩn overflow của body
        },
        header: {
          borderBottom: "1px solid #f1f3f4",
          padding: "12px 16px",
          background: "linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)",
          borderRadius: "12px 12px 0 0",
          flexShrink: 0, // Không cho header co lại
        },
        mask: {
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
        },
      }}
    >
      <div className="bg-white h-full flex flex-col">
        {/* Enhanced Header với gradient background - Fixed */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-[#00B4B6]/10 via-white to-[#0891b2]/10 border-b border-[#00B4B6]/20 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#00B4B6] animate-pulse"></div>
              <Text className="text-[#00B4B6] text-xs sm:text-sm font-medium">
                Thông tin khách hàng
              </Text>
            </div>
            <div className="ml-auto">
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-500">
                  {canSubmit ? (
                    <span className="text-green-600 font-medium">
                      ✓ Đã hoàn thành
                    </span>
                  ) : (
                    <span className="text-orange-600 font-medium">
                      ⚠ Cần bổ sung
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 sm:pt-6 custom-scrollbar">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            className="space-y-3 sm:space-y-4"
          >
            {/* khối 1: Thông tin cơ bản */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-[#00B4B6]/10 to-[#0891b2]/10 flex items-center justify-center">
                  <UserOutlined className="!text-[#0891b2] !text-xs sm:!text-sm" />
                </div>
                <Text strong className="!text-gray-800 !text-sm sm:!text-base">
                  Thông tin cơ bản
                </Text>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                

                <Form.Item
                  name="name"
                  label={
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-gray-800 font-medium text-xs sm:text-sm">
                        Tên khách hàng
                      </span>
                      <div className="w-1 h-1 bg-[#00B4B6] rounded-full"></div>
                    </div>
                  }
                  rules={[{ required: false, message: "Nhập tên khách hàng" }]}
                  className="!mb-0"
                >
                  <Input
                    placeholder="Nhập tên gợi nhớ"
                    className="!h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-[#00B4B6] focus:!shadow-lg hover:!border-[#00B4B6] !transition-all !duration-200 !shadow-sm"
                    size="middle"
                    prefix={<UserOutlined className="text-[#00B4B6] mr-2" />}
                  />
                </Form.Item>


                <Form.Item
                  name="phone"
                  label={
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-gray-800 font-medium text-xs sm:text-sm">
                        Số điện thoại
                      </span>
                      <div className="w-1 h-1 bg-[#00B4B6] rounded-full"></div>
                    </div>
                  }
                  rules={[
                    { required: true, message: "Nhập số điện thoại" },
                    {
                      pattern: /^[0-9]{9,10}$/,
                      message: "Số điện thoại không hợp lệ",
                    },
                  ]}
                  className="!mb-0"
                >
                  <Input
                    placeholder="Nhập số điện thoại"
                    className="!h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-[#00B4B6] focus:!shadow-lg hover:!border-[#00B4B6] !transition-all !duration-200 !shadow-sm"
                    size="middle"
                    prefix={<PhoneOutlined className="text-[#00B4B6] mr-2" />}
                  />
                </Form.Item>

                {/* khối 3: Địa điểm và giá cả */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-purple-100 to-purple-200 flex items-center justify-center">
                  <EnvironmentOutlined className="!text-purple-600 !text-xs sm:!text-sm" />
                </div>
                <Text strong className="!text-gray-800 !text-sm sm:!text-base">
                  Địa chỉ
                </Text>
              </div>

              <Form.Item
                name="address"
                label={
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                    {/*<span className="text-gray-800 font-medium text-xs sm:text-sm">
                      Địa điểm thi công
                    </span>*/}
                    <span className="text-gray-400 text-xs font-normal">
                      (Tùy chọn)
                    </span>
                  </div>
                }
                className="!mb-3"
              >
                <Input.TextArea
                  rows={2}
                  placeholder="Nhập địa điểm thi công..."
                  className="!rounded-lg !border !border-gray-300 focus:!border-[#00B4B6] focus:!shadow-lg hover:!border-[#00B4B6] !transition-all !duration-200 !shadow-sm !resize-none !text-xs sm:!text-sm"
                />
              </Form.Item>

            </div>

          </div>
        </div>

      </Form>
        </div>
        <div className="flex flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-100 mt-4 sm:mt-6 bg-white sticky bottom-0 px-4 sm:px-6 pb-4 sm:pb-6">
          {onDelete  &&
          <Button
            onClick={() => {
              onDelete();
              onRefresh();
              handleCancel();
            }}
            disabled={isPending}
            size="middle"
            className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !text-gray-700 hover:!bg-gray-50 !font-medium !text-xs sm:!text-sm !transition-all !duration-200 !shadow-sm hover:!shadow-md hover:!scale-105 !order-1 sm:!order-1 !drop-shadow-md !border-none"
          >
            ❌ Xóa khách hàng
          </Button>}
          <Button
            type="primary"
            htmlType="submit"
            size="middle"
            className={`!h-9 sm:!h-10 !px-4 sm:px-6 !rounded-lg !border-0 !shadow-lg !font-bold !text-xs sm:!text-sm !transition-all !duration-200 !transform !order-2 sm:!order-2 !drop-shadow-md ${
              canSubmit
                ? "!bg-gradient-to-r !from-[#00B4B6] !to-[#0891b2] hover:!from-[#0891b2] hover:!to-[#00B4B6] hover:!shadow-xl hover:!scale-105"
                : "!bg-gray-300 !text-gray-500 !cursor-not-allowed hover:!shadow-lg"
            }`}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isPending ? (
              <span className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">
                  {isEdit ? "Đang cập nhật..." : "Đang tạo..."}
                </span>
                <span className="sm:hidden">
                  {isEdit ? "Cập nhật..." : "Tạo..."}
                </span>
              </span>
            ) : (
              `✅ ${isEdit ? "Cập nhật" : "Tạo khách hàng"}`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
