import { Modal, Button, Typography, message, notification } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useDeleteWorkSpace } from "../../../../common/hooks/work-space.hook";
import { useCallback } from "react";
import type { WorkSpace } from "../../../../@types/work-space.type";
import { useApiHost } from "../../../../common/hooks/useApiHost";

const { Title, Text } = Typography;

interface ModalDeleteWorkSpaceProps {
  deleteModalVisible: boolean;
  closeDeleteModal: () => void;
  deletingWorkspace: WorkSpace;
  onSuccess?: () => void; // Callback khi delete thành công
  refetchWorkSpaces: () => void;
}

export default function ModalDeleteWorkSpace({
  deleteModalVisible,
  closeDeleteModal,
  deletingWorkspace,
  onSuccess,
  refetchWorkSpaces,
}: ModalDeleteWorkSpaceProps) {
  const { mutate: deleteWorkSpace, isPending: isDeleting } =
    useDeleteWorkSpace();

  const handleDelete = useCallback(() => {
  if (!deletingWorkspace?.id) return;

  fetch(`${useApiHost()}/workspace/${deletingWorkspace.id}`, {
    method: 'DELETE',
  })
    .then((response) => {
      if (!response.ok) {
        notification.error({message:`Failed to delete workspace`});
      }
      return response.json();
    })
    .then(() => {
      if (typeof onSuccess === 'function') onSuccess();
      // if (typeof deleteWorkSpace === 'function') deleteWorkSpace();
      if (typeof closeDeleteModal === 'function') closeDeleteModal();
    })
    .catch((error) => {
      notification.error({message:`Delete error: ${error}`});
    });
}, [deleteWorkSpace, closeDeleteModal, deletingWorkspace, onSuccess]);

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
            <DeleteOutlined className="!text-white !text-lg" />
          </div>
          <div>
            <Title level={4} className="!m-0 !text-gray-900 !font-bold">
              Xóa bảng công việc
            </Title>
            <Text className="text-gray-500 text-sm">
              Xác nhận xóa bảng công việc
            </Text>
          </div>
        </div>
      }
      open={deleteModalVisible}
      onCancel={closeDeleteModal}
      footer={null}
      width={500}
      centered
      className="!rounded-3xl delete-workspace-modal"
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
        <div className="px-8 py-6 bg-gradient-to-r from-red-50 via-white to-red-50 border-b border-red-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <Text className="text-red-600 text-base font-medium">
                Xác nhận xóa
              </Text>
            </div>
          </div>
        </div>

        {/* Enhanced Content Area */}
        <div className="p-8">
          <div className="text-center">
            {/* Warning Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center shadow-lg">
              <DeleteOutlined className="!text-3xl !text-red-500" />
            </div>

            {/* Title */}
            <Title level={3} className="!text-gray-900 !font-bold !mb-3">
              Xác nhận xóa bảng công việc
            </Title>

            {/* Message */}
            <div className="max-w-sm mx-auto mb-8">
              <Text className="text-gray-600 text-base leading-relaxed">
                Bạn có chắc chắn muốn xóa bảng công việc{" "}
                <div className="font-semibold text-gray-900 bg-yellow-50 px-2 py-1 rounded-lg">
                  "{deletingWorkspace?.name} ?"
                </div>
              </Text>
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <Text className="text-red-600 text-sm font-medium">
                  ⚠️ Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn tất cả
                  dữ liệu liên quan.
                </Text>
              </div>
            </div>

            {/* Enhanced Footer */}
            <div className="flex justify-center gap-4 pt-6 border-t border-gray-100">
              <Button
                onClick={closeDeleteModal}
                size="large"
                className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !text-gray-700 hover:!bg-gray-50 !font-medium !text-xs sm:!text-sm !transition-all !duration-200 !shadow-sm hover:!shadow-md hover:!scale-105 !order-1 sm:!order-1 !drop-shadow-md !border-none"
              >
                ❌ Hủy bỏ
              </Button>
              <Button
                danger
                loading={isDeleting}
                onClick={handleDelete}
                size="large"
                className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !bg-gradient-to-r !from-red-500 !to-red-600 hover:!from-red-600 hover:!to-red-700 !border-0 !shadow-lg hover:!shadow-xl !font-bold !text-xs sm:!text-sm !transition-all !duration-200 !transform hover:!scale-105 !order-2 sm:!order-2 !drop-shadow-md"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang xóa...
                  </span>
                ) : (
                  "Xóa bảng công việc"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
