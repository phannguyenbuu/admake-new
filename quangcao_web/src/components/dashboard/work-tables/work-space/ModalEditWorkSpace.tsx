import {
  Modal,
  Button,
  Input,
  Form,
  type FormInstance,
  Typography,
  message,
} from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useUpdateWorkSpace } from "../../../../common/hooks/work-space.hook";
import { useCallback } from "react";
import { useApiHost } from "../../../../common/hooks/useApiHost";

const { Title, Text } = Typography;

interface ModalEditWorkSpaceProps {
  editModalVisible: boolean;
  closeEditModal: () => void;
  editForm: FormInstance;
  taskId: string; // Thêm taskId để biết workspace nào đang edit
  onSuccess?: () => void; // Callback khi update thành công
}

export default function ModalEditWorkSpace({
  editModalVisible,
  closeEditModal,
  editForm,
  taskId,
  onSuccess,
}: ModalEditWorkSpaceProps) {
  const { mutate: updateWorkSpace, isPending: isUpdating } =
    useUpdateWorkSpace();

  // Hàm xử lý update workspace
  const handleUpdate = (values: any) => {
    console.log('TaskID', taskId);
    fetch(`${useApiHost()}/task/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then(() => {
        message.success("Cập nhật workspace thành công!");
        closeEditModal();
        editForm.resetFields();
        onSuccess?.();
      })
      .catch(() => {
        message.error("Có lỗi xảy ra khi cập nhật workspace!");
      });
  };


  return (
    <Modal
      title={
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0891b2] to-[#00B4B6] flex items-center justify-center shadow-lg">
            <EditOutlined className="!text-white !text-lg" />
          </div>
          <div>
            <Title level={4} className="!m-0 !text-gray-900 !font-bold">
              Chỉnh sửa bảng công việc
            </Title>
            <Text className="text-gray-500 text-sm">
              Cập nhật thông tin bảng công việc
            </Text>
          </div>
        </div>
      }
      open={editModalVisible}
      onCancel={closeEditModal}
      footer={null}
      width={600}
      centered
      className="!rounded-3xl edit-workspace-modal"
      styles={{
        content: {
          borderRadius: "24px",
          overflow: "hidden",
          padding: 0,
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)",
        },
        body: {
          padding: 0,
          borderRadius: "24px",
        },
        header: {
          borderBottom: "1px solid #f1f3f4",
          padding: "24px 32px 20px",
          background: "linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)",
          borderRadius: "24px 24px 0 0",
        },
        mask: {
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
        },
      }}
    >
      <div className="bg-white">
        {/* Enhanced Header với gradient background */}
        <div className="px-8 py-6 bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <Text className="text-blue-600 text-base font-medium">
                Thông tin bảng công việc
              </Text>
            </div>
          </div>
        </div>

        {/* Enhanced Content Area */}
        <div className="p-8">
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleUpdate}
            className="space-y-6"
          >
            <Form.Item
              name="name"
              label={
                <div className="flex items-center gap-2">
                  <span className="text-gray-800 font-semibold text-base">
                    Tên bảng công việc
                  </span>{" "}
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                </div>
              }
              rules={[
                { required: true, message: "Vui lòng nhập tên bảng công việc" },
              ]}
              className="!mb-6"
            >
              <Input
                placeholder="Nhập tên bảng công việc..."
                className="!h-12 !text-base !rounded-xl !border !border-gray-300 focus:!border-blue-500 focus:!shadow-lg hover:!border-blue-300 !transition-all !duration-200 !shadow-sm"
                size="large"
              />
            </Form.Item>

            {/* Enhanced Footer */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
              <Button
                onClick={closeEditModal}
                size="large"
                className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !text-gray-700 hover:!bg-gray-50 !font-medium !text-xs sm:!text-sm !transition-all !duration-200 !shadow-sm hover:!shadow-md hover:!scale-105 !order-1 sm:!order-1 !drop-shadow-md !border-none"
              >
                ❌ Hủy bỏ
              </Button>

              <Button
                type="primary"
                htmlType="submit"
                loading={isUpdating}
                size="large"
                className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !bg-gradient-to-r !from-[#00B4B6] !to-[#0891b2] hover:!from-[#0891b2] hover:!to-[#00B4B6] !border-0 !shadow-lg hover:!shadow-xl !font-bold !text-xs sm:!text-sm !transition-all !duration-200 !transform hover:!scale-105 !order-2 sm:!order-2 !drop-shadow-md"
              >
                {isUpdating ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang cập nhật...
                  </span>
                ) : (
                  "✅ Cập nhật"
                )}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </Modal>
  );
}
