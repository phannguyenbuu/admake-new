import {
  Modal,
  Form,
  Input,
  DatePicker,
  Button,
  Typography,
  Tag,
  message,
} from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import type { HolidayModalProps, Holiday } from "../../../@types/holiday.type";
import dayjs, { Dayjs } from "dayjs";
import {
  useCreateHoliday,
  useUpdateHoliday,
} from "../../../common/hooks/holiday.hook";
import { holidayTypes } from "../../../common/data";
import "./css.css";

const { TextArea } = Input;
const { Title, Text } = Typography;

export default function HolidayModal({
  open,
  onCancel,
  user,
  holiday,
  refetchHolidays,
}: HolidayModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { mutate: createHoliday, isPending: creating } = useCreateHoliday();
  const { mutate: updateHoliday, isPending: updating } = useUpdateHoliday();

  const isEdit = !!holiday;

  // điền form khi mở
  useEffect(() => {
    if (!open) return;
    if (isEdit && holiday) {
      form.setFieldsValue({
        name: holiday.name,
        startDate: dayjs(holiday.startDate),
        endDate: dayjs(holiday.endDate),
        type: holiday.type,
        description: holiday.description,
        forUserId: holiday.forUserId,
      });
    } else {
      form.resetFields();
      if (user) form.setFieldsValue({ forUserId: user._id });
    }
  }, [open, isEdit, holiday, user, form]);

  // watch để hiển thị preview
  const typeValue: string | undefined = Form.useWatch("type", form);
  const startDate: Dayjs | undefined = Form.useWatch("startDate", form);
  const endDate: Dayjs | undefined = Form.useWatch("endDate", form);

  const dayCount =
    startDate && endDate
      ? endDate.endOf("day").diff(startDate.startOf("day"), "day") + 1
      : 0;

  const getTypeMeta = (val?: string) => {
    const t = holidayTypes.find((x) => x.value === val);
    if (!t) return { color: "default" as any, label: "" };
    // map nhanh sang màu Tag theo thiết kế code 2
    const colorMap: Record<string, any> = {
      PUBLIC_HOLIDAY: "red",
      COMPANY_HOLIDAY: "blue",
      PERSONAL_LEAVE: "green",
      SICK_LEAVE: "orange",
      ANNUAL_LEAVE: "purple",
      OTHER: "default",
    };
    return {
      color: colorMap[t.value] ?? "default",
      label: t.label,
      icon: t.icon,
    };
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const dto: Omit<Holiday, "_id" | "createdAt" | "updatedAt"> = {
        name: values.name,
        startDate: values.startDate.valueOf(),
        endDate: values.endDate.valueOf(),
        type: "PERSONAL_LEAVE",
        description: values.description,
        forUserId: values.forUserId,
      };

      const onDone = () => {
        form.resetFields();
        onCancel();
        refetchHolidays?.();
      };

      if (isEdit && holiday) {
        updateHoliday(
          { id: holiday._id, dto },
          {
            onSuccess: () => {
              message.success({
                content: `Đã cập nhật đơn nghỉ phép "${holiday.name}" thành công!`,
                duration: 3,
              });
              onDone();
            },
          }
        );
      } else {
        createHoliday(dto, {
          onSuccess: () => {
            message.success({
              content: `Đã tạo đơn nghỉ phép "${values.name}" thành công!`,
              duration: 3,
            });
            onDone();
          },
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isPending = submitting || creating || updating;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#00B4B6] to-[#0891b2] flex items-center justify-center shadow-lg">
            <CalendarOutlined className="!text-white !text-sm sm:!text-base" />
          </div>
          <div className="flex-1 min-w-0">
            <Title
              level={5}
              className="!m-0 !text-gray-900 !font-bold !text-sm sm:!text-base"
            >
              {isEdit ? "Chỉnh sửa đơn nghỉ phép" : "Tạo đơn nghỉ phép mới"}
            </Title>
            <Text className="text-gray-500 text-xs sm:text-sm !block !truncate">
              {user?.fullName
                ? `Cho nhân viên: ${user.fullName}`
                : "Điền thông tin đơn nghỉ phép"}
            </Text>
          </div>
          {typeValue && (
            <div className="ml-auto flex-shrink-0">
              <Tag
                color={getTypeMeta(typeValue).color}
                className="!px-1.5 !sm:!px-2 !py-0.5 !rounded-full !border-none !font-medium !shadow-sm !text-xs"
              >
                {getTypeMeta(typeValue).label}
              </Tag>
            </div>
          )}
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width="calc(100vw - 32px)"
      style={{
        maxWidth: "600px",
      }}
      centered
      destroyOnHidden
      maskClosable={false}
      className="!rounded-xl sm:!rounded-2xl holiday-modal"
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
          maxHeight: "calc(100vh - 200px)", // Giới hạn chiều cao
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
                Thông tin đơn nghỉ phép
              </Text>
            </div>
            {dayCount > 0 && (
              <Tag
                color="processing"
                className="!px-1.5 !sm:!px-2 !py-0.5 !rounded-full !border-none !font-medium !text-xs !shadow-sm !ml-auto"
              >
                Tổng: {dayCount} ngày
              </Tag>
            )}
          </div>
        </div>

        {/* Enhanced Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <Form form={form} layout="vertical" requiredMark={false}>
            <Form.Item name="forUserId" hidden>
              <Input />
            </Form.Item>

            {/* khối 1: Thông tin cơ bản */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-[#00B4B6]/10 to-[#0891b2]/10 flex items-center justify-center">
                  <CalendarOutlined className="!text-[#0891b2] !text-xs sm:!text-sm" />
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
                      <div className="w-1 h-1 bg-[#00B4B6] rounded-full"></div>
                      <span className="text-gray-800 font-medium text-xs sm:text-sm">
                        Tên đơn nghỉ phép
                      </span>
                      <span className="text-red-500">*</span>
                    </div>
                  }
                  rules={[
                    { required: true, message: "Vui lòng nhập tên nghỉ" },
                    { min: 3, message: "Ít nhất 3 ký tự" },
                  ]}
                  className="!mb-0"
                >
                  <Input
                    placeholder="Ví dụ: Nghỉ lễ Quốc khánh..."
                    className="!h-9 !sm:!h-10 !text-xs !sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-[#00B4B6] focus:!shadow-lg hover:!border-[#00B4B6] !transition-all !duration-200 !shadow-sm"
                    size="middle"
                  />
                </Form.Item>

                {/* <Form.Item
                  name="type"
                  label={
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1 h-1 bg-[#00B4B6] rounded-full"></div>
                      <span className="text-gray-800 font-medium text-xs sm:text-sm">
                        Loại nghỉ phép
                      </span>
                      <span className="text-red-500">*</span>
                    </div>
                  }
                  rules={[{ required: true, message: "Chọn loại nghỉ" }]}
                  className="!mb-0"
                >
                  <Select
                    size="middle"
                    placeholder="Chọn loại nghỉ phép"
                    optionLabelProp="label"
                    showSearch
                    optionFilterProp="label"
                    className="!h-9 !sm:!h-10 !rounded-lg !border !border-gray-300 focus:!border-[#00B4B6] focus:!shadow-lg hover:!border-[#00B4B6] !transition-all !duration-200 !shadow-sm"
                    options={holidayTypes.map((t) => ({
                      value: t.value,
                      label: t.label,
                    }))}
                  />
                </Form.Item> */}
              </div>
            </div>

            {/* khối 2: Thời gian nghỉ */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-orange-100 to-orange-200 flex items-center justify-center">
                  <CalendarOutlined className="!text-orange-600 !text-xs sm:!text-sm" />
                </div>
                <Text strong className="!text-gray-800 !text-sm sm:!text-base">
                  Thời gian nghỉ phép
                </Text>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <Form.Item
                  name="startDate"
                  label={
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-800 font-medium text-xs sm:text-sm">
                        Ngày bắt đầu
                      </span>
                      <span className="text-red-500">*</span>
                    </div>
                  }
                  rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
                  className="!mb-0"
                >
                  <DatePicker
                    className="!w-full !h-9 !sm:!h-10 !text-xs !sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-[#00B4B6] focus:!shadow-lg hover:!border-[#00B4B6] !transition-all !duration-200 !shadow-sm"
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày"
                    disabledDate={(current) =>
                      current && current < dayjs().startOf("day")
                    }
                    size="middle"
                  />
                </Form.Item>

                <Form.Item
                  noStyle
                  shouldUpdate={(prev, curr) =>
                    prev.startDate !== curr.startDate
                  }
                >
                  {({ getFieldValue }) => (
                    <Form.Item
                      name="endDate"
                      label={
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                          <span className="text-gray-800 font-medium text-xs sm:text-sm">
                            Ngày kết thúc
                          </span>
                          <span className="text-red-500">*</span>
                        </div>
                      }
                      rules={[
                        { required: true, message: "Chọn ngày kết thúc" },
                        () => ({
                          validator(_, value) {
                            const s = getFieldValue("startDate");
                            if (!s || !value || !value.isBefore(s, "day"))
                              return Promise.resolve();
                            return Promise.reject(
                              new Error(
                                "Kết thúc phải sau hoặc bằng ngày bắt đầu"
                              )
                            );
                          },
                        }),
                      ]}
                      className="!mb-0"
                    >
                      <DatePicker
                        className="!w-full !h-9 !sm:!h-10 !text-xs !sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-[#00B4B6] focus:!shadow-lg hover:!border-[#00B4B6] !transition-all !duration-200 !shadow-sm"
                        format="DD/MM/YYYY"
                        placeholder="Chọn ngày"
                        disabledDate={(current) => {
                          const s = getFieldValue("startDate");
                          return s
                            ? current && current < s.startOf("day")
                            : false;
                        }}
                        size="middle"
                      />
                    </Form.Item>
                  )}
                </Form.Item>
              </div>
            </div>

            {/* khối 3: Lý do */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-purple-100 to-purple-200 flex items-center justify-center">
                  <CalendarOutlined className="!text-purple-600 !text-xs sm:!text-sm" />
                </div>
                <Text strong className="!text-gray-800 !text-sm sm:!text-base">
                  Lý do nghỉ phép
                </Text>
              </div>

              <Form.Item
                name="description"
                rules={[
                  { required: true, message: "Nhập mô tả lý do nghỉ phép" },
                  { min: 10, message: "Ít nhất 10 ký tự" },
                ]}
                className="!mb-0"
              >
                <TextArea
                  rows={3}
                  showCount
                  maxLength={500}
                  placeholder="Mô tả lý do nghỉ phép..."
                  className="!rounded-lg !border !border-gray-300 focus:!border-[#00B4B6] focus:!shadow-lg hover:!border-[#00B4B6] !transition-all !duration-200 !shadow-sm !resize-none !text-xs !sm:!text-sm"
                />
              </Form.Item>
            </div>
          </Form>
        </div>
        {/* Enhanced Footer - Fixed */}
        <div className="flex flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-100 mt-4 sm:mt-6 bg-white sticky bottom-0 px-4 sm:px-6 pb-4 sm:pb-6">
          <Button
            onClick={handleCancel}
            disabled={isPending}
            size="middle"
            className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !text-gray-700 hover:!bg-gray-50 !font-medium !text-xs sm:!text-sm !transition-all !duration-200 !shadow-sm hover:!shadow-md hover:!scale-105 !order-1 sm:!order-1 !drop-shadow-md !border-none"
          >
            ❌ Hủy bỏ
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isPending}
            size="middle"
            className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !bg-gradient-to-r !from-[#00B4B6] !to-[#0891b2] hover:!from-[#0891b2] hover:!to-[#00B4B6] !border-0 !shadow-lg hover:!shadow-xl !font-bold !text-xs sm:!text-sm !transition-all !duration-200 !transform hover:!scale-105 !order-2 sm:!order-2 !drop-shadow-md"
          >
            {isPending ? (
              <span className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">
                  {isEdit ? "Đang cập nhật..." : "Đang gửi..."}
                </span>
                <span className="sm:hidden">
                  {isEdit ? "Cập nhật..." : "Gửi..."}
                </span>
              </span>
            ) : (
              `✅ ${isEdit ? "Cập nhật" : "Gửi đơn nghỉ phép"}`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
