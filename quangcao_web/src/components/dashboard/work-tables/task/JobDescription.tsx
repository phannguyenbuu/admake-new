import React, {useState,useEffect} from "react";
import { Form, Input, Typography } from "antd";
import type { Mode } from "../../../../@types/work-space.type";
import type { FormTaskDetailProps } from "../../../../@types/work-space.type";
import {Stack, Box} from "@mui/material";
import JobAsset from "./JobAsset";
import type { Task } from "../../../../@types/work-space.type";
import { useTaskContext } from "../../../../common/hooks/useTask";

const { Text } = Typography;
const { TextArea } = Input;

// interface TaskDetailType {
//   description?: string;
// }

interface JobDescriptionProps {
  // taskDetail: Task | null;
  form: any;
  // salaryType: string;
}

const JobDescription: React.FC<JobDescriptionProps> = ({ form }) => {
  const {taskDetail} = useTaskContext();

  useEffect(() => {
  if (taskDetail) {
    form.setFieldsValue({
      description: taskDetail.description,
      // ...các field khác nếu có
    });
  }else{
    form.setFieldsValue({
      description: "",
      // ...các field khác nếu có
    });
  }
}, [taskDetail, form]);


  return (
    <Stack style={{ minWidth:300 }}>
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <span className="text-green-600 text-xs sm:text-sm">📝</span>
        
        <Text strong className="!text-gray-800 !text-sm sm:!text-base">
          Mô tả công việc
        </Text>
      </div>

      
        <Form.Item
          name="description"
          className="!mb-0"
        >
          <TextArea
            rows={3}
            showCount
            maxLength={1000}
            placeholder="Mô tả chi tiết về công việc cần thực hiện..."
            className="!rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !shadow-sm !resize-none !text-xs sm:!text-sm h-40"
          />
        </Form.Item>
      {taskDetail?.type === "REWARD" &&
        <JobAsset key="cash-assets" title = 'Ứng tiền' role="cash"/>}
    </Stack>
  );
};

export default JobDescription;
