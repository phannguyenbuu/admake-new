import React, { useState, useMemo } from "react";
import { Modal, Select, notification, Button, Tag } from "antd";
import { SwapOutlined } from "@ant-design/icons";
import type { Task, WorkSpace } from "../../../../@types/work-space.type";
import { useUser } from "../../../../common/hooks/useUser";
import { useTaskContext } from "../../../../common/hooks/useTask";
import { useQueryClient } from "@tanstack/react-query";
import { WORK_SPACE_DETAIL_QUERY_KEY } from "../../../../common/hooks/work-space.hook";
import axiosClient from "../../../../services/axiosClient";

interface ModalMoveTaskProps {
  open: boolean;
  onCancel: () => void;
  task: Task | null;
  onSuccess?: () => void;
}

export default function ModalMoveTask({
  open,
  onCancel,
  task,
  onSuccess,
}: ModalMoveTaskProps) {
  const { workspaces, workspaceId } = useUser();
  const queryClient = useQueryClient();
  const { refetchTasks, setTaskDetail } = useTaskContext();

  const [targetWorkspaceId, setTargetWorkspaceId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // List of workspaces in the lead
  const availableWorkspaces = useMemo(() => {
    return (workspaces || []).map((ws: WorkSpace) => ({
      id: String(ws.id),
      name: ws.name || `Workspace #${ws.id}`,
      isCurrent: String(ws.id) === String(task?.workspace_id || workspaceId),
    }));
  }, [workspaces, task?.workspace_id, workspaceId]);

  const currentWorkspace = availableWorkspaces.find((w) => w.isCurrent);

  const handleSubmit = async () => {
    if (!task?.id) {
      notification.warning({ message: "Không tìm thấy thông tin đơn hàng!" });
      return;
    }
    if (!targetWorkspaceId) {
      notification.warning({ message: "Vui lòng chọn Bảng công việc (Workspace) đích!" });
      return;
    }
    if (targetWorkspaceId === String(task.workspace_id)) {
      notification.warning({ message: "Đơn hàng đã ở sẵn trong Bảng công việc này!" });
      return;
    }

    setLoading(true);
    try {
      const targetWsName = availableWorkspaces.find(w => w.id === targetWorkspaceId)?.name || "Bảng mới";
      
      // Move task to target workspace
      await axiosClient.put(`/task/${task.id}`, {
        workspace_id: targetWorkspaceId,
      });

      notification.success({
        message: "Di chuyển đơn hàng thành công!",
        description: `Đã di chuyển sang bảng: ${targetWsName}`,
      });

      // Invalidate queries & refetch dynamically without reloading page
      await queryClient.invalidateQueries({ queryKey: [WORK_SPACE_DETAIL_QUERY_KEY] });
      await refetchTasks();

      setTaskDetail(null); // Close task detail modal on move

      if (onSuccess) onSuccess();
      onCancel();
    } catch (err: any) {
      notification.error({
        message: "Thao tác di chuyển thất bại",
        description: err?.response?.data?.message || err?.message || "Đã có lỗi xảy ra",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={
        <div className="flex items-center gap-2 text-base font-bold text-slate-800 border-b pb-3">
          <SwapOutlined className="text-sky-600" />
          <span>Di chuyển Đơn hàng sang Bảng công việc khác</span>
        </div>
      }
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          style={{ backgroundColor: "#0284c7", borderColor: "transparent" }}
        >
          Xác nhận Di chuyển
        </Button>,
      ]}
      width={480}
      centered
    >
      <div className="py-3 flex flex-col gap-4">
        {/* Task Title */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Đơn hàng hiện tại:</div>
          <div className="text-sm font-bold text-slate-800 mt-0.5">{task?.title || "Không có tiêu đề"}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>Bảng hiện tại:</span>
            <Tag color="blue">{currentWorkspace?.name || task?.workspace_id || "Chưa phân loại"}</Tag>
          </div>
        </div>

        {/* Target Workspace */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Chọn Bảng công việc (Workspace) đích đến:
          </label>
          <Select
            showSearch
            value={targetWorkspaceId || undefined}
            onChange={(val) => setTargetWorkspaceId(val)}
            placeholder="🔍 Chọn Bảng công việc..."
            className="w-full"
            style={{ width: "100%", height: 38 }}
            filterOption={(input, option) =>
              (String((option as any)?.searchLabel || "")).toLowerCase().includes(input.toLowerCase())
            }
            options={availableWorkspaces.map((ws) => ({
              value: ws.id,
              searchLabel: ws.name,
              label: (
                <div className="flex items-center justify-between py-0.5">
                  <span className="font-medium text-slate-800">{ws.name}</span>
                  {ws.isCurrent && <Tag color="gray" className="!mr-0">Đang ở bảng này</Tag>}
                </div>
              ),
            }))}
          />
        </div>
      </div>
    </Modal>
  );
}
