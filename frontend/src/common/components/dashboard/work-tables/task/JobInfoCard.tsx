import React, { useEffect, useRef } from "react";
import { Form, Input } from "antd";
import { Stack } from "@mui/material";
import type { Task } from "../../../../@types/work-space.type";
import { useUser } from "../../../../common/hooks/useUser";
import UploadIconButton, { type UploadIconButtonHandle } from "./UploadIconButton";
import { useApiHost } from "../../../../common/hooks/useApiHost";
import { useTaskContext } from "../../../../common/hooks/useTask";

export type StatusType = "OPEN" | "IN_PROGRESS" | "DONE" | "REWARD" | string;

// interface Task {
//   title?: string;
//   // các trường khác...
// }

interface JobInfoCardProps {
  currentStatus: StatusType;
  taskDetail: Task | null;
  form: any; // form instance từ Form.useForm()
  uploadIconRef?: React.RefObject<UploadIconButtonHandle | null>;
}

const JobInfoCard: React.FC<JobInfoCardProps> = ({ currentStatus, taskDetail, form, uploadIconRef }) => {
  const { isMobile } = useUser();
  const { setTaskDetail } = useTaskContext();
  const apiHost = useApiHost();
  const syncedTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    const nextTaskId = taskDetail?.id ?? null;
    if (syncedTaskIdRef.current === nextTaskId) return;

    syncedTaskIdRef.current = nextTaskId;
    form.setFieldsValue({
      title: taskDetail?.title || "",
    });
  }, [taskDetail?.id, taskDetail?.title, form]);

  return (
    <Stack spacing={4} sx={{ width: '100%' }}>
      {/* Khối Thông tin */}
      <Form.Item
        name="title"
        rules={[
          { required: true, message: "Vui lòng nhập tên công việc" },
          { min: 3, message: "Ít nhất 3 ký tự" },
        ]}
        className="!mb-0 w-full"
      >
        <Input
          placeholder="Nhập tên công việc..."
          className="w-full !h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !shadow-sm !font-semibold"
          size="middle"
        />
      </Form.Item>

      {/* Gallery ảnh (không label) */}
      <UploadIconButton
        ref={uploadIconRef}
        taskDetail={taskDetail}
        apiUrl={`${apiHost}/task/${taskDetail?.id || "new"}/upload-icon`}
        onIconsChange={(newIcons) => {
          const nextValue = newIcons.length > 0 ? JSON.stringify(newIcons) : null;

          setTaskDetail(prev => {
            if (!prev) {
              return prev;
            }

            return {
              ...prev,
              icon: nextValue ?? undefined,
            } as Task;
          });

          form.setFieldValue('icon', nextValue);
        }}
      />
    </Stack>

  );
};

export default JobInfoCard;
