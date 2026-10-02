import { useContext, useEffect, useState } from "react";
import { Typography, Button, Popconfirm, notification } from "antd";
import { UpdateButtonContext } from "../../../../common/hooks/useUpdateButtonTask";
import type { Task } from "../../../../@types/work-space.type";
import { Stack, Box } from "@mui/material";
import { useTaskContext } from "../../../../common/hooks/useTask";
import { useUser } from "../../../../common/hooks/useUser";
import { CheckOutlined, CloseOutlined, SwapOutlined, DeleteOutlined, CopyOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { WORK_SPACE_DETAIL_QUERY_KEY } from "../../../../common/hooks/work-space.hook";
import axiosClient from "../../../../services/axiosClient";
import ModalMoveTask from "./ModalMoveTask";
import ModalCopyTask from "./ModalCopyTask";

const { Title } = Typography;

interface TaskHeaderProps {
  onSuccess: () => void;
  onUpdate: () => void;
  onCancel?: () => void;
}

// TaskHeader.tsx
export default function TaskHeader({ onSuccess, onUpdate, onCancel }: TaskHeaderProps) {
  const { taskDetail, setTaskDetail, updateTaskStatus, refetchTasks } = useTaskContext();
  const { isMobile } = useUser();
  const queryClient = useQueryClient();

  const [isReward, setIsReward] = useState<boolean>(false);
  const [openMoveModal, setOpenMoveModal] = useState<boolean>(false);
  const [openCopyModal, setOpenCopyModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    setIsReward(taskDetail?.status === "REWARD");
  }, [taskDetail]);

  const handleReward = async () => {
    if (!taskDetail) return;
    if (!updateTaskStatus) return;

    try {
      await updateTaskStatus(taskDetail.id, "REWARD");
    } catch (error) {
      console.error("Lỗi nghiệm thu:", error);
    }

    if (onSuccess)
      onSuccess();
  };

  const handleDeleteTask = async () => {
    if (!taskDetail?.id) return;

    setIsDeleting(true);
    try {
      await axiosClient.delete(`/task/${taskDetail.id}`);
      notification.success({
        message: "Xóa công việc thành công!",
        description: "Công việc đã được chuyển vào thùng rác.",
      });

      await queryClient.invalidateQueries({ queryKey: [WORK_SPACE_DETAIL_QUERY_KEY] });
      await refetchTasks();

      setTaskDetail(null);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      notification.error({
        message: "Lỗi xóa công việc",
        description: error?.response?.data?.message || error?.message || "Đã có lỗi xảy ra",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const buttonStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  };

  return (
    <>
      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ width: '100%', mb: 2 }}>

        <div className="flex items-center gap-2 px-4 py-3">
          <Title level={4} style={{ whiteSpace: 'nowrap', margin: 0 }}>
            {taskDetail ? "Cập nhật công việc" : "Tạo công việc mới"}
          </Title>
        </div>

        <Stack direction="row" spacing={1.5} sx={{ pr: 2 }}>
          {/* Nút Di chuyển (Move - Xanh dương) */}
          {taskDetail && (
            <Button
              onClick={() => setOpenMoveModal(true)}
              style={{ ...buttonStyle, backgroundColor: '#0284c7', color: 'white', border: 'none' }}
              title="Di chuyển đơn hàng sang Bảng công việc khác"
            >
              <SwapOutlined />
            </Button>
          )}

          {/* Nút Sao chép (Copy - Xanh lá) */}
          {taskDetail && (
            <Button
              onClick={() => setOpenCopyModal(true)}
              style={{ ...buttonStyle, backgroundColor: '#16a34a', color: 'white', border: 'none' }}
              title="Sao chép đơn hàng sang Bảng công việc khác"
            >
              <CopyOutlined />
            </Button>
          )}

          {/* Nút Xóa Task (Nền đỏ, trước nút Cập nhật) */}
          {taskDetail && (
            <Popconfirm
              title="Xóa công việc"
              description="Bạn có chắc chắn muốn xóa công việc này vào thùng rác không?"
              onConfirm={handleDeleteTask}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true, loading: isDeleting }}
            >
              <Button
                style={{ ...buttonStyle, backgroundColor: '#ef4444', color: 'white', border: 'none' }}
                title="Xóa công việc"
                loading={isDeleting}
              >
                <DeleteOutlined />
              </Button>
            </Popconfirm>
          )}

          {/* Nút Cập nhật / Nghiệm thu */}
          {!isReward && (taskDetail?.status !== "DONE" ?
            <Button
              type="primary"
              onClick={onUpdate}
              style={{ ...buttonStyle, backgroundColor: '#00B4B6', border: 'none' }} // Admake blue
              title="Cập nhật"
            >
              <CheckOutlined />
            </Button>
            :
            <Button
              type="primary"
              onClick={handleReward}
              style={{ ...buttonStyle, backgroundColor: '#00B4B6', border: 'none' }}
              title="Nghiệm Thu"
            >
              🏆
            </Button>)
          }

          {/* Nút Đóng */}
          <Button
            onClick={onCancel}
            style={{ ...buttonStyle, backgroundColor: '#9ca3af', color: 'white', border: 'none' }} // Xám
            title="Đóng"
          >
            <CloseOutlined />
          </Button>
        </Stack>

      </Stack>

      {/* Modal Di chuyển Task */}
      <ModalMoveTask
        open={openMoveModal}
        onCancel={() => setOpenMoveModal(false)}
        task={taskDetail ?? null}
        onSuccess={() => {
          if (onSuccess) onSuccess();
        }}
      />

      {/* Modal Sao chép Task */}
      <ModalCopyTask
        open={openCopyModal}
        onCancel={() => setOpenCopyModal(false)}
        task={taskDetail ?? null}
        onSuccess={() => {
          if (onSuccess) onSuccess();
        }}
      />
    </>
  );
}