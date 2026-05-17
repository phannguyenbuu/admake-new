import React, { useEffect, useRef, useState } from "react";
import { Form, Input, notification, Typography } from "antd";
import type { Mode } from "../../../../@types/work-space.type";
import type { FormTaskDetailProps } from "../../../../@types/work-space.type";
import { Stack, Box } from "@mui/material";
import JobAsset from "./JobAsset";
import type { Task } from "../../../../@types/work-space.type";
import { useTaskContext } from "../../../../common/hooks/useTask";
import { useApiHost } from "../../../../common/hooks/useApiHost";
import { Tabs } from 'antd';
import { useUser } from "../../../../common/hooks/useUser";
import MaterialsTab from "./MaterialsTab";

const { Text } = Typography;
const { TextArea } = Input;

// interface TaskDetailType {
//   description?: string;
// }

interface JobDescriptionProps {
  // taskDetail: Task | null;
  form: any;
  onPasteImage?: (file: File) => Promise<void>;
  // salaryType: string;
}

const JobDescription: React.FC<JobDescriptionProps> = ({ form, onPasteImage }) => {
  const { taskDetail, setTaskDetail } = useTaskContext();
  const { isMobile } = useUser();
  const syncedTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    const nextTaskId = taskDetail?.id ?? null;
    if (syncedTaskIdRef.current === nextTaskId) return;

    syncedTaskIdRef.current = nextTaskId;
    form.setFieldsValue({
      description: taskDetail?.description || "",
    });
  }, [taskDetail?.id, taskDetail?.description, form]);

  const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!onPasteImage) return;

    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (!item.type.startsWith("image/")) continue;

      const file = item.getAsFile();
      if (!file) continue;

      event.preventDefault();
      await onPasteImage(file);
      return;
    }
  };

  return (
    <Stack className="flex-1 w-full h-full flex flex-col" sx={{
      width: '100%',
      flexGrow: 1,
      minHeight: 160,
      '& .ant-form-item': { flex: 1, display: 'flex', flexDirection: 'column', width: '100%' },
      '& .ant-form-item-row': { flex: 1, display: 'flex', flexDirection: 'column', width: '100%' },
      '& .ant-form-item-control': { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%' },
      '& .ant-form-item-control-input': { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%' },
      '& .ant-form-item-control-input-content': { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%' },
      '& textarea': { height: '100% !important', width: '100% !important' }
    }}>
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <span className="text-green-600 text-xs sm:text-sm">📝</span>

        <Text strong className="!text-gray-800 !text-sm sm:!text-base">
          Mô tả công việc
        </Text>
      </div>

      <Form.Item
        name="description"
        className="!mb-0 w-full flex-1 flex flex-col"
        style={{ height: '100%' }}
      >
        <TextArea
          placeholder="Mô tả chi tiết về công việc cần thực hiện..."
          className="!rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !shadow-sm !resize-none !text-xs sm:!text-sm h-full min-h-[160px] w-full"
          onPaste={handlePaste}
        />
      </Form.Item>
    </Stack>
  );
};

export const JobTabs = ({ taskDetail }: { taskDetail: any }) => {
  const [activeKey, setActiveKey] = useState('materials');
  const job_assets = [
    {
      key: 'materials',
      label: 'Vật liệu',
      children: <MaterialsTab />,
    },
    {
      key: 'task',
      label: 'Tài Liệu',
      children: <JobAsset title="Thông tin từ admin" type="task" />,
    },
    {
      key: 'comments',
      label: 'Bình luận',
      children: <JobAsset title="Bình luận cho mọi người" type="comment" />,
    },
  ];

  return (
    <Tabs
      activeKey={activeKey}
      onChange={key => setActiveKey(key)}
      items={taskDetail ? job_assets : [job_assets[0]]}
      className="w-full mt-4"
      style={{ width: '100%' }}
    />
  );
};

export default JobDescription;
