import React, { useState, useMemo } from "react";
import { Modal, Radio, Select, notification, Button, Tag } from "antd";
import { CopyOutlined, SwapOutlined } from "@ant-design/icons";
import type { Task, WorkSpace } from "../../../../@types/work-space.type";
import { useUser } from "../../../../common/hooks/useUser";
import { useTaskContext } from "../../../../common/hooks/useTask";
import { useQueryClient } from "@tanstack/react-query";
import { WORK_SPACE_DETAIL_QUERY_KEY } from "../../../../common/hooks/work-space.hook";
import axiosClient from "../../../../services/axiosClient";

interface ModalMoveCopyTaskProps {
  open: boolean;
  onCancel: () => void;
  task: Task | null;
  onSuccess?: () => void;
}

export default function ModalMoveCopyTask({
  open,
  onCancel,
  task,
  onSuccess,
}: ModalMoveCopyTaskProps) {
  const { workspaces, workspaceId } = useUser();
  const queryClient = useQueryClient();
  const { refetchTasks, setTaskDetail } = useTaskContext();

  const [actionType, setActionType] = useState<"MOVE" | "COPY">("MOVE");
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
    if (actionType === "MOVE" && targetWorkspaceId === String(task.workspace_id)) {
      notification.warning({ message: "Đơn hàng đã ở sẵn trong Bảng công việc này!" });
      return;
    }

    setLoading(true);
    try {
      const targetWsName = availableWorkspaces.find(w => w.id === targetWorkspaceId)?.name || "Bảng mới";
      if (actionType === "MOVE") {
        // Move task to target workspace
        await axiosClient.put(`/task/${task.id}`, {
          workspace_id: targetWorkspaceId,
        });
        notification.success({
          message: "Di chuyển đơn hàng thành công!",
          description: `Đã di chuyển sang bảng: ${targetWsName}`,
        });
      } else {
        // Copy task to target workspace
        const copyPayload = {
          title: `${task.title || "Đơn hàng"} (Bản sao)`,
          description: task.description || "",
          workspace_id: targetWorkspaceId,
          customer_id: typeof task.customer_id === "object" ? task.customer_id?.id : task.customer_id,
          amount: task.amount || 0,
          prepayment: task.prepayment || 0,
          reward: task.reward || 0,
          status: task.status || "OPEN",
          type: task.type || "MONTHLY",
          materials: task.materials || [],
          material_adjustments: task.material_adjustments || [],
          assign_ids: (task.assign_ids || []).map((a: any) => typeof a === "object" ? a.id : a),
        };
        await axiosClient.post("/task/", copyPayload);
        notification.success({
          message: "Sao chép đơn hàng thành công!",
          description: `Bản sao đã được tạo ở bảng: ${targetWsName}`,
        });
      }

      // Invalidate queries & refetch dynamically without reloading page
      await queryClient.invalidateQueries({ queryKey: [WORK_SPACE_DETAIL_QUERY_KEY] });
      await refetchTasks();

      if (actionType === "MOVE") {
        setTaskDetail(null); // Close task modal on move
      }

      if (onSuccess) onSuccess();
      onCancel();
    } catch (err: any) {
      notification.error({
        message: "Thao tác thất bại",
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
          <SwapOutlined className="text-cyan-600" />
          <span>Di chuyển / Sao chép Đơn hàng sang Bảng công việc khác</span>
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
          style={{ backgroundColor: actionType === "MOVE" ? "#0284c7" : "#16a34a", borderColor: "transparent" }}
        >
          {actionType === "MOVE" ? "Xác nhận Di chuyển" : "Xác nhận Sao chép"}
        </Button>,
      ]}
      width={520}
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

        {/* Action Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            1. Chọn hình thức thực hiện:
          </label>
          <Radio.Group
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="w-full grid grid-cols-2 gap-2"
          >
            <Radio.Button
              value="MOVE"
              className="!h-auto !py-2.5 !px-3 text-center !rounded-lg border font-medium flex flex-col items-center justify-center gap-1"
            >
              <div className="flex items-center gap-1.5 font-bold text-sky-700">
                <SwapOutlined /> Di chuyển (Move)
              </div>
              <span className="text-[11px] text-slate-500 font-normal leading-tight">
                Chuyển hẳn sang bảng mới
              </span>
            </Radio.Button>

            <Radio.Button
              value="COPY"
              className="!h-auto !py-2.5 !px-3 text-center !rounded-lg border font-medium flex flex-col items-center justify-center gap-1"
            >
              <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                <CopyOutlined /> Sao chép (Copy)
              </div>
              <span className="text-[11px] text-slate-500 font-normal leading-tight">
                Tạo bản sao ở bảng mới
              </span>
            </Radio.Button>
          </Radio.Group>
        </div>

        {/* Target Workspace */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            2. Chọn Bảng công việc (Workspace) đích:
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
                  {ws.isCurrent && <Tag color="gray" className="!mr-0">Đang chọn</Tag>}
                </div>
              ),
            }))}
          />
        </div>
      </div>
    </Modal>
  );
}
