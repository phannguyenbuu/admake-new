import { Row, Col, Card, Button, message, Modal } from "antd";
import type { DeleteConfirmProps } from "../Managerment";

interface WorkspaceModalProps {
  deleteConfirmModal: DeleteConfirmProps; // trạng thái bật/tắt modal xác nhận xoá
  handleDeleteCancel: () => void; // callback đóng modal xoá
  handleDeleteConfirm: () => void; // callback xác nhận xoá
  deleteTaskMutation: any; // kiểu mutation, bạn có thể định nghĩa rõ hơn theo thư viện bạn dùng (ví dụ react-query)
}

const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  deleteConfirmModal,
  handleDeleteCancel,
  handleDeleteConfirm,
  deleteTaskMutation,
}) => {
    return (
      <Modal
        open={deleteConfirmModal.visible}
        onCancel={handleDeleteCancel}
        footer={null}
        title={null}
        width="400px"
        centered
        className="custom-modal"
      >
        <div className="text-center p-6">
          {/* Warning Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Xác nhận xóa task
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Bạn có chắc chắn muốn xóa task{" "}
            <span className="font-semibold text-gray-900">
              "{deleteConfirmModal.taskTitle}"
            </span>
            ? Hành động này không thể hoàn tác.
          </p>

          {/* Buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleDeleteCancel}
              className="px-6 py-2 h-10 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all duration-200"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              loading={deleteTaskMutation.isPending}
              danger
              className="px-6 py-2 h-10 rounded-lg bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600 text-white font-semibold transition-all duration-200"
            >
              Xóa task
            </Button>
          </div>
        </div>
      </Modal>
    )
}

export default WorkspaceModal;