import {
  Form,
  Input,
  Button,
  Typography,
  Image,
  Spin,
  InputNumber,
  Modal,
  message,
} from "antd";
import { PlusOutlined, ToolOutlined } from "@ant-design/icons";
import type {
  Material,
  MaterialFormValues,
} from "../../../@types/material.type";
import "./css.css";
import { useState, useEffect } from "react";
import {
  useCreateMaterial,
  useMaterialDetail,
  useUpdateMaterial,
} from "../../../common/hooks/material.hook";

const { Title, Text } = Typography;

interface FormMaterialProps {
  onCancel: () => void;
  material?: Material;
  buttonText: string;
  onRefresh: () => void;
  open: boolean;
}

export default function FormMaterial({
  onCancel,
  material,
  buttonText,
  onRefresh,
  open,
}: FormMaterialProps) {
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);
  const { mutate: createMaterial, isPending: isCreating } = useCreateMaterial();
  const {
    data: materialDetail,
    isLoading: isLoadingMaterialDetail,
    refetch: refetchMaterialDetail,
  } = useMaterialDetail(material?._id);
  const { mutate: updateMaterial, isPending: isUpdating } = useUpdateMaterial();
  const [isDragging, setIsDragging] = useState(false);

  const isEdit = !!material;
  const isPending = isCreating || isUpdating || isLoadingMaterialDetail;

  // Reset form mỗi khi modal mở hoặc đóng
  useEffect(() => {
    // Chỉ gọi form methods khi Form đã được render (không loading)
    if (!isLoadingMaterialDetail) {
      if (materialDetail) {
        // Trường hợp edit - set form với data từ API
        form.setFieldsValue({
          // @ts-ignore
          name: materialDetail.name,
          // @ts-ignore
          quantity: materialDetail.quantity,
          // @ts-ignore
          supplier: materialDetail.supplier,
          // @ts-ignore
          unit: materialDetail.unit,
          // @ts-ignore
          description: materialDetail.description,
          // @ts-ignore
          price: materialDetail.price,
        });
      } else {
        // Trường hợp create - reset form
        form.resetFields();
      }
    }
  }, [
    open,
    material?._id,
    form,
    materialDetail,
    isEdit,
    isLoadingMaterialDetail,
  ]);

  // Reset form và file khi modal đóng
  const handleCancel = () => {
    // Chỉ gọi form.resetFields() khi Form đã được render
    if (!isLoadingMaterialDetail) {
      form.resetFields();
    }
    setFile(null);
    setIsDragging(false);
    onCancel();
  };

  const onFinish = (
    values: Omit<MaterialFormValues, "image"> & {
      image: { file: { originFileObj: File } };
    }
  ) => {
    const { image, ...rest } = values;
    const formData = new FormData();

    // Thêm tất cả các giá trị vào FormData
    for (const key in rest) {
      if (
        rest[key as keyof typeof rest] !== undefined &&
        rest[key as keyof typeof rest] !== null
      ) {
        formData.append(key, rest[key as keyof typeof rest] as string);
      }
    }

    // Thêm ảnh nếu có
    if (file !== null) {
      formData.append("image", file as File);
    }

    // Kiểm tra đúng điều kiện để update
    if (isEdit && material?._id) {
      // Trường hợp update - có material ID
      updateMaterial(
        { dto: formData, id: material._id },
        {
          onSuccess: () => {
            message.success("Cập nhật vật liệu thành công");
            // Không cần gọi form.resetFields() ở đây vì handleCancel() sẽ xử lý
            setFile(null);
            setIsDragging(false);
            refetchMaterialDetail();
            onRefresh();
            handleCancel();
          },
          onError: () => {
            message.error("Cập nhật vật liệu thất bại");
          },
        }
      );
    } else {
      // Trường hợp create - không có material ID
      createMaterial(formData, {
        onSuccess: () => {
          message.success("Tạo vật liệu thành công");
          // Không cần gọi form.resetFields() ở đây vì handleCancel() sẽ xử lý
          setFile(null);
          setIsDragging(false);
          refetchMaterialDetail();
          onRefresh();
          handleCancel();
        },
        onError: () => {
          message.error("Tạo vật liệu thất bại");
        },
      });
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#00B4B6] to-[#0891b2] flex items-center justify-center shadow-lg">
            <ToolOutlined className="!text-white !text-sm sm:!text-base" />
          </div>
          <div className="flex-1 min-w-0">
            <Title
              level={5}
              className="!m-0 !text-gray-900 !font-bold !text-sm sm:!text-base"
            >
              {isEdit ? "Chỉnh sửa vật liệu" : "Thêm vật liệu mới"}
            </Title>
            <Text className="text-gray-500 text-xs sm:text-sm !block !truncate">
              {isEdit
                ? "Cập nhật thông tin vật liệu"
                : "Điền thông tin vật liệu mới"}
            </Text>
          </div>
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
      className="!rounded-xl sm:!rounded-2xl material-modal"
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
                Thông tin vật liệu
              </Text>
            </div>
          </div>
        </div>

        {/* Enhanced Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {isLoadingMaterialDetail ? (
            <div className="flex justify-center items-center h-32">
              <Spin size="large" />
            </div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
              key={material?._id}
              preserve={true}
              className="space-y-3 sm:space-y-4"
            >
              {/* khối 1: Thông tin cơ bản */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-[#00B4B6]/10 to-[#0891b2]/10 flex items-center justify-center">
                    <ToolOutlined className="!text-[#0891b2] !text-xs sm:!text-sm" />
                  </div>
                  <Text
                    strong
                    className="!text-gray-800 !text-sm sm:!text-base"
                  >
                    Thông tin cơ bản
                  </Text>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <Form.Item
                    name="name"
                    label={
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-gray-800 font-medium text-xs sm:text-sm">
                          Tên vật liệu
                        </span>
                        <div className="w-1 h-1 bg-[#00B4B6] rounded-full"></div>
                      </div>
                    }
                    rules={[
                      { required: true, message: "Nhập tên vật liệu" },
                      {
                        type: "string",
                        min: 3,
                        message: "Tên vật liệu phải có ít nhất 3 ký tự",
                      },
                    ]}
                    className="!mb-0"
                  >
                    <Input
                      placeholder="Nhập tên vật liệu"
                      className="!h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-[#00B4B6] focus:!shadow-lg hover:!border-[#00B4B6] !transition-all !duration-200 !shadow-sm"
                      size="middle"
                    />
                  </Form.Item>

                  <Form.Item
                    name="quantity"
                    label={
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-gray-800 font-medium text-xs sm:text-sm">
                          Số lượng
                        </span>
                        <div className="w-1 h-1 bg-[#00B4B6] rounded-full"></div>
                      </div>
                    }
                    rules={[{ required: true, message: "Nhập số lượng" }]}
                    className="!mb-0"
                  >
                    <Input
                      type="number"
                      placeholder="Nhập số lượng"
                      className="!h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-[#00B4B6] focus:!shadow-lg hover:!border-[#00B4B6] !transition-all !duration-200 !shadow-sm"
                      size="middle"
                    />
                  </Form.Item>

                  <Form.Item
                    name="supplier"
                    label={
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-gray-800 font-medium text-xs sm:text-sm">
                          Nhà cung cấp
                        </span>
                        <div className="w-1 h-1 bg-[#00B4B6] rounded-full"></div>
                      </div>
                    }
                    rules={[
                      { required: true, message: "Nhập tên nhà cung cấp" },
                    ]}
                    className="!mb-0"
                  >
                    <Input
                      placeholder="Nhập tên nhà cung cấp"
                      className="!h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-[#00B4B6] focus:!shadow-lg hover:!border-[#00B4B6] !transition-all !duration-200 !shadow-sm"
                      size="middle"
                    />
                  </Form.Item>

                  <Form.Item
                    name="unit"
                    label={
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-gray-800 font-medium text-xs sm:text-sm">
                          Đơn vị tính
                        </span>
                        <div className="w-1 h-1 bg-[#00B4B6] rounded-full"></div>
                      </div>
                    }
                    rules={[{ required: true, message: "Nhập đơn vị tính" }]}
                    className="!mb-0"
                  >
                    <Input
                      placeholder="Ví dụ: cuộn, mét, kg..."
                      className="!h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-[#00B4B6] focus:!shadow-lg hover:!border-[#00B4B6] !transition-all !duration-200 !shadow-sm"
                      size="middle"
                    />
                  </Form.Item>
                </div>
              </div>

              {/* khối 2: Mô tả và giá cả */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-orange-100 to-orange-200 flex items-center justify-center">
                    <ToolOutlined className="!text-orange-600 !text-xs sm:!text-sm" />
                  </div>
                  <Text
                    strong
                    className="!text-gray-800 !text-sm sm:!text-base"
                  >
                    Mô tả và giá cả
                  </Text>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <Form.Item
                    name="description"
                    label={
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-800 font-medium text-xs sm:text-sm">
                          Mô tả vật liệu
                        </span>
                        <span className="text-gray-400 text-xs font-normal">
                          (Tùy chọn)
                        </span>
                      </div>
                    }
                    className="!mb-0"
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Nhập mô tả chi tiết vật liệu..."
                      className="!rounded-lg !border !border-gray-300 focus:!border-[#00B4B6] focus:!shadow-lg hover:!border-[#00B4B6] !transition-all !duration-200 !shadow-sm !resize-none !text-xs sm:!text-sm"
                    />
                  </Form.Item>

                  <Form.Item
                    name="price"
                    label={
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-800 font-medium text-xs sm:text-sm">
                          Đơn giá
                        </span>
                      </div>
                    }
                    className="!mb-0"
                  >
                    <InputNumber
                      placeholder="Nhập đơn giá bán ra"
                      min={0}
                      step={1000}
                      formatter={(value) =>
                        `${value ?? 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                      }
                      parser={(value) => {
                        if (!value) return 0;
                        const numValue = value.replace(/\./g, "");
                        return (numValue ? Number(numValue) : 0) as 0;
                      }}
                      className="!w-full !h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-[#00B4B6] focus:!shadow-lg hover:!border-[#00B4B6] !transition-all !duration-200 !shadow-sm"
                      size="middle"
                    />
                  </Form.Item>

                  <Form.Item
                    name="image"
                    rules={[{ required: false, message: "Chọn ảnh vật liệu" }]}
                    label={
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-800 font-medium text-xs sm:text-sm">
                          Ảnh vật liệu
                        </span>
                        <span className="text-gray-400 text-xs font-normal">
                          (Tùy chọn)
                        </span>
                      </div>
                    }
                    className="!mb-0"
                  >
                    <div className="flex flex-col items-center">
                      {/* Upload Area */}
                      <div
                        className={`w-full h-32 sm:h-40 border-2 border-dashed border-[#00B4B6] rounded-lg sm:rounded-xl flex flex-col items-center justify-center bg-white transition-colors duration-200 cursor-pointer relative ${
                          isDragging
                            ? "bg-[#00B4B6]/10 border-[#00B4B6]"
                            : " hover:bg-[#00B4B6]/5 border-[#00B4B6]"
                        }`}
                        onClick={() =>
                          document.getElementById("file-input")?.click()
                        }
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
                            const droppedFile = e.dataTransfer.files[0];
                            setFile(droppedFile);
                          }
                        }}
                      >
                        {/* @ts-ignore */}
                        {file || materialDetail?.image ? (
                          <Image
                            src={
                              file
                                ? URL.createObjectURL(file)
                                : `${import.meta.env.VITE_API_IMAGE}${
                                    // @ts-ignore
                                    materialDetail?.image ||
                                    "https://static.thenounproject.com/png/5034901-200.png"
                                  }`
                            }
                            alt="preview"
                            className="w-full !h-28 sm:!h-36 object-cover rounded-lg"
                            preview={false}
                          />
                        ) : (
                          <>
                            {/* Upload Icon */}
                            <PlusOutlined
                              style={{ fontSize: 20, color: "#00B4B6" }}
                              className="sm:text-2xl"
                            />
                          </>
                        )}
                      </div>

                      {/* Hidden File Input */}
                      <Input
                        id="file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          setFile(e.target.files?.[0] || null);
                        }}
                        style={{ display: "none" }}
                      />

                      {/* Buttons Below */}
                      <div className="flex flex-col items-center gap-2 mt-3">
                        <span className="text-xs sm:text-sm text-gray-600 text-center">
                          Kéo thả ảnh hoặc chọn từ tệp
                        </span>
                        <Button
                          type="primary"
                          className="!px-3 sm:!px-4 !py-1.5 sm:!py-2 !text-xs sm:!text-sm !bg-[#00B4B6] hover:!bg-[#0891b2] !text-white !rounded-lg !font-medium !transition-all !duration-200 !shadow-sm hover:!shadow-md !cursor-pointer !drop-shadow-md"
                          onClick={() =>
                            document.getElementById("file-input")?.click()
                          }
                        >
                          Chọn tệp
                        </Button>
                      </div>
                    </div>
                  </Form.Item>
                </div>
              </div>
            </Form>
          )}
        </div>
        {/* Enhanced Footer - Fixed */}
        <div className="flex flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-100 mt-4 sm:mt-6 bg-white sticky bottom-0 px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Nút Hủy bỏ */}
          <Button
            onClick={handleCancel}
            disabled={isPending}
            size="middle"
            className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !text-gray-700 hover:!bg-gray-50 !font-medium !text-xs sm:!text-sm !transition-all !duration-200 !shadow-sm hover:!shadow-md hover:!scale-105 !order-1 sm:!order-1 !drop-shadow-md !border-none"
          >
            ❌ Hủy bỏ
          </Button>

          {/* Nút Tạo */}
          <Button
            type="primary"
            onClick={() => form.submit()}
            size="middle"
            className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !bg-gradient-to-r !from-[#00B4B6] !to-[#0891b2] hover:!from-[#0891b2] hover:!to-[#00B4B6] !border-0 !shadow-lg hover:!shadow-xl !font-bold !text-xs sm:!text-sm !transition-all !duration-200 !transform hover:!scale-105 !order-2 sm:!order-2 !drop-shadow-md"
          >
            {isPending ? (
              <span className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">
                  {isEdit ? "Đang cập nhật..." : "Đang tạo..."}
                </span>
                <span className="sm:hidden">
                  {isEdit ? "Cập nhật..." : "Tạo..."}
                </span>{" "}
              </span>
            ) : (
              `✅ ${buttonText} vật liệu`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
