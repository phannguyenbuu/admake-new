import { Modal, Form, Button, Typography, message, InputNumber } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  DollarOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { useUpdateSetting } from "../../../../common/hooks/setting.hook";
import type {
  SalaryLevelItem,
  SalaryLevelModalProps,
} from "../../../../@types/setting.type";
import "./css.css";

const { Title, Text } = Typography;

export const SalaryLevelModal = ({
  open,
  onCancel,
  refetchSettings,
  currentSalaryLevels = [],
}: SalaryLevelModalProps) => {
  const [form] = Form.useForm();
  const { mutate: updateSetting, isPending: isUpdating } = useUpdateSetting();
  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState<SalaryLevelItem[]>([]);

  useEffect(() => {
    // Lưu data gốc để so sánh
    setOriginalData(currentSalaryLevels || []);

    // Khởi tạo form với data hiện có hoặc form trống
    if (currentSalaryLevels && currentSalaryLevels.length > 0) {
      const initialValues = currentSalaryLevels.map((item, index) => ({
        key: index,
        index: index + 1, // Tự động fill theo thứ tự
        salary: item.salary,
        isOriginal: true, // Đánh dấu item từ API
      }));
      // Chỉ set form values khi component đã mount và form đã sẵn sàng
      setTimeout(() => {
        form.setFieldsValue({ salaryLevels: initialValues });
      }, 0);
    } else {
      // Chỉ reset form khi component đã mount
      setTimeout(() => {
        form.resetFields();
      }, 0);
    }
  }, [currentSalaryLevels, form]);

  const handleUpdate = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const { salaryLevels } = values;

      // Chuyển đổi form data thành SalaryLevelItem[]
      const updatedSalaryLevels: SalaryLevelItem[] = salaryLevels.map(
        (item: any) => ({
          id: item.id,
          index: item.index,
          salary: item.salary,
        })
      );

      // Cập nhật setting
      updateSetting(
        {
          key: "salary_level",
          value: updatedSalaryLevels,
        },
        {
          onSuccess: () => {
            message.success({
              content: "Đã lưu cấu hình bậc lương thành công!",
              duration: 3,
            });
            refetchSettings();
            setIsEditing(false);
            setOriginalData(updatedSalaryLevels);
            onCancel();
          },
          onError: () => {
            message.error("Có lỗi xảy ra khi lưu bậc lương!");
          },
        }
      );
    } catch (error) {
      message.error("Vui lòng kiểm tra lại thông tin!");
    }
  }, [form, updateSetting, refetchSettings, onCancel]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    // Reset form về data gốc
    if (originalData.length > 0) {
      const initialValues = originalData.map((item, index) => ({
        key: index,
        index: index + 1, // Tự động fill theo thứ tự
        salary: item.salary,
        isOriginal: true,
      }));
      // Sử dụng setTimeout để đảm bảo form đã sẵn sàng
      setTimeout(() => {
        form.setFieldsValue({ salaryLevels: initialValues });
      }, 0);
    }
  }, [originalData, form]);

  const handleModalCancel = useCallback(() => {
    if (isEditing) {
      handleCancel();
    }
    // form.resetFields();
    onCancel();
  }, [isEditing, handleCancel, form, onCancel]);

  // Tự động cập nhật index khi thêm/xóa item
  const updateIndexes = useCallback(() => {
    const currentValues = form.getFieldValue("salaryLevels") || [];
    const updatedValues = currentValues.map((item: any, index: number) => ({
      ...item,
      index: index + 1, // Tự động fill theo thứ tự
    }));
    form.setFieldsValue({ salaryLevels: updatedValues });
  }, [form]);

  const isLoading = isUpdating;
  const totalLevels = form.getFieldValue("salaryLevels")?.length || 0;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <DollarOutlined className="!text-white !text-sm sm:!text-base" />
          </div>
          <div className="flex-1 min-w-0">
            <Title
              level={5}
              className="!m-0 !text-gray-900 !font-bold !text-sm sm:!text-base"
            >
              Quản lý bậc lương
            </Title>
            <Text className="text-gray-500 text-xs sm:text-sm !block !truncate">
              {isEditing
                ? "Đang chỉnh sửa cấu hình bậc lương"
                : "Thêm, chỉnh sửa hoặc xóa các bậc lương"}
            </Text>
          </div>
        </div>
      }
      open={open}
      onCancel={handleModalCancel}
      footer={null}
      width="calc(100vw - 32px)"
      style={{
        maxWidth: "800px",
      }}
      centered
      destroyOnHidden
      maskClosable={false}
      className="!rounded-xl sm:!rounded-2xl salary-level-modal"
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
          maxHeight: "calc(100vh - 250px)",
          overflowY: "auto",
        },
        header: {
          borderBottom: "1px solid #f1f3f4",
          padding: "12px 16px",
          background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
          borderRadius: "12px 12px 0 0",
          flexShrink: 0,
        },
        mask: {
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
        },
      }}
    >
      <div className="bg-white h-full flex flex-col">
        {/* Enhanced Header với status */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-emerald-500/10 via-white to-teal-500/10 border-b border-emerald-500/20 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                  isEditing ? "bg-orange-500 animate-pulse" : "bg-emerald-500"
                }`}
              ></div>
              <Text
                className={`text-xs sm:text-sm font-medium ${
                  isEditing ? "text-orange-600" : "text-emerald-600"
                }`}
              >
                {isEditing ? "Chế độ chỉnh sửa" : "Cấu hình bậc lương"}
              </Text>
              {totalLevels > 0 && (
                <div className="ml-auto flex-shrink-0">
                  <div className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full text-xs font-medium shadow-sm">
                    {totalLevels} bậc
                  </div>
                </div>
              )}
            </div>
            {isEditing && (
              <div className="ml-auto">
                <div className="bg-orange-100 text-orange-600 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium shadow-sm">
                  Chưa lưu
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <Form form={form} layout="vertical" requiredMark={false}>
            <Form.List name="salaryLevels">
              {(fields, { add, remove }) => (
                <div className="space-y-3 sm:space-y-4">
                  {/* Empty State */}
                  {fields.length === 0 && (
                    <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8 text-center hover:shadow-md transition-all duration-300">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                        <DollarOutlined className="text-2xl sm:text-3xl text-emerald-600" />
                      </div>
                      <Title
                        level={5}
                        className="!text-gray-700 !mb-2 !text-base sm:!text-lg"
                      >
                        Chưa có bậc lương nào
                      </Title>
                      <Text className="text-gray-500 text-sm sm:text-base block max-w-sm mx-auto mb-4">
                        Hãy thêm bậc lương đầu tiên để bắt đầu cấu hình hệ thống
                        lương bổng.
                      </Text>
                      <Button
                        type="primary"
                        onClick={() => {
                          add({ isOriginal: false });
                          setTimeout(() => updateIndexes(), 0);
                        }}
                        icon={<PlusOutlined />}
                        className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !bg-gradient-to-r !from-emerald-500 !to-teal-600 !border-0 !shadow-lg hover:!shadow-xl !font-medium !text-xs sm:!text-sm !transition-all !duration-200 !transform hover:!scale-105"
                      >
                        Thêm bậc lương đầu tiên
                      </Button>
                    </div>
                  )}

                  {/* Salary Level Items */}
                  {fields.map(({ key, name, ...restField }) => {
                    const fieldValue = form.getFieldValue([
                      "salaryLevels",
                      name,
                    ]);
                    const isOriginalItem = fieldValue?.isOriginal;
                    const isDisabled = isOriginalItem && !isEditing;

                    return (
                      <div
                        key={key}
                        className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 hover:shadow-md transition-all duration-300"
                      >
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-emerald-500/10 to-teal-500/10 flex items-center justify-center">
                            <DollarOutlined className="!text-emerald-600 !text-xs sm:!text-sm" />
                          </div>
                          <Text
                            strong
                            className="!text-gray-800 !text-sm sm:!text-base"
                          >
                            Bậc lương #{name + 1}
                          </Text>
                          {isOriginalItem && (
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                              <Text className="text-xs text-blue-600 font-medium">
                                Từ hệ thống
                              </Text>
                            </div>
                          )}
                          {fields.length > 1 && !isDisabled && (
                            <Button
                              type="text"
                              danger
                              icon={<MinusCircleOutlined />}
                              onClick={() => {
                                remove(name);
                                setTimeout(() => updateIndexes(), 0);
                              }}
                              className="!ml-auto !text-red-500 hover:!text-white hover:!bg-red-500 !border-none !rounded-md !px-2 !py-1 !h-auto !transition-all !duration-300 !font-medium !text-xs"
                              size="small"
                            >
                              Xóa
                            </Button>
                          )}
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                          <Form.Item
                            {...restField}
                            name={[name, "index"]}
                            label={
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                <span className="text-gray-800 font-medium text-xs sm:text-sm">
                                  Thứ tự bậc
                                </span>
                              </div>
                            }
                            className="!mb-0"
                          >
                            <InputNumber
                              placeholder="Tự động"
                              className="!w-full !h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-emerald-500 focus:!shadow-lg hover:!border-emerald-500 !transition-all !duration-200 !shadow-sm"
                              min={1}
                              size="large"
                              disabled={true}
                              formatter={(value) => `Bậc ${value}`}
                            />
                          </Form.Item>

                          <Form.Item
                            {...restField}
                            name={[name, "salary"]}
                            label={
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                                <span className="text-gray-800 font-medium text-xs sm:text-sm">
                                  Mức lương (VNĐ)
                                </span>
                                <span className="text-red-500">*</span>
                              </div>
                            }
                            rules={[
                              {
                                required: true,
                                message: "Vui lòng nhập mức lương",
                              },
                              {
                                type: "number",
                                min: 0,
                                message: "Mức lương không được âm",
                              },
                            ]}
                            className="!mb-0"
                          >
                            <InputNumber
                              placeholder="Nhập mức lương..."
                              className="!w-full !h-10 text-sm !rounded-lg !border !border-gray-300 focus:!border-emerald-500 focus:!shadow-lg hover:!border-emerald-500 !transition-all !duration-200 !shadow-sm"
                              min={0}
                              formatter={(value) =>
                                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                              }
                              size="large"
                              disabled={isDisabled}
                              addonAfter="VNĐ"
                            />
                          </Form.Item>
                        </div>

                        {/* Salary Preview */}
                        {fieldValue?.salary && (
                          <div className="mt-3 p-2 bg-emerald-50 rounded-md border border-emerald-200">
                            <Text className="text-emerald-700 text-xs sm:text-sm font-medium">
                              💰 Mức lương:{" "}
                              {Number(fieldValue.salary).toLocaleString(
                                "vi-VN"
                              )}{" "}
                              VNĐ/tháng
                            </Text>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add New Button */}
                  {fields.length > 0 && (
                    <div className="pt-2">
                      <Button
                        type="dashed"
                        onClick={() => {
                          add({ isOriginal: false });
                          setTimeout(() => updateIndexes(), 0);
                        }}
                        icon={<PlusOutlined />}
                        className="!w-full !h-10 !border-dashed !border-2 !border-emerald-300 !text-emerald-600 hover:!border-emerald-400 hover:!text-emerald-700 hover:!bg-emerald-50 !rounded-lg !font-medium !text-xs sm:!text-sm !transition-all !duration-300 hover:!scale-[1.02]"
                        disabled={!isEditing && originalData.length > 0}
                        size="middle"
                      >
                        Thêm bậc lương mới
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Form.List>
          </Form>
        </div>

        {/* Enhanced Footer - Sticky */}
        <div className="flex flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-100 mt-4 sm:mt-6 bg-white sticky bottom-0 px-4 sm:px-6 pb-4 sm:pb-6">
          {isEditing ? (
            <>
              <Button
                onClick={handleCancel}
                disabled={isLoading}
                size="middle"
                className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !text-gray-700 hover:!bg-gray-50 !font-medium !text-xs sm:!text-sm !transition-all !duration-200 !shadow-sm hover:!shadow-md hover:!scale-105 !order-1 sm:!order-1 !drop-shadow-md !border-none"
              >
                ❌ Hủy thay đổi
              </Button>
              <Button
                type="primary"
                onClick={handleSave}
                loading={isLoading}
                size="middle"
                className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !bg-gradient-to-r !from-emerald-500 !to-teal-600 hover:!from-teal-600 hover:!to-emerald-500 !border-0 !shadow-lg hover:!shadow-xl !font-bold !text-xs sm:!text-sm !transition-all !duration-200 !transform hover:!scale-105 !order-2 sm:!order-2 !drop-shadow-md"
              >
                {isLoading ? (
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Đang lưu...</span>
                    <span className="sm:hidden">Lưu...</span>
                  </span>
                ) : (
                  "✅ Lưu cấu hình"
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleModalCancel}
                disabled={isLoading}
                size="middle"
                className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !text-gray-700 hover:!bg-gray-50 !font-medium !text-xs sm:!text-sm !transition-all !duration-200 !shadow-sm hover:!shadow-md hover:!scale-105 !order-1 sm:!order-1 !drop-shadow-md !border-none"
              >
                ❌ Đóng
              </Button>
              <Button
                type="primary"
                onClick={handleUpdate}
                disabled={isLoading}
                size="middle"
                className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !bg-gradient-to-r !from-emerald-500 !to-teal-600 hover:!from-teal-600 hover:!to-emerald-500 !border-0 !shadow-lg hover:!shadow-xl !font-bold !text-xs sm:!text-sm !transition-all !duration-200 !transform hover:!scale-105 !order-2 sm:!order-2 !drop-shadow-md"
              >
                ✏️ Chỉnh sửa
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
