import React, { useEffect } from "react";
import { Form, Input, Tag, Typography } from "antd";
import { ProjectOutlined } from "@ant-design/icons";
import {Stack, Box} from "@mui/material";
import type { Task } from "../../../../@types/work-space.type";
const { Text } = Typography;

export type StatusType = "OPEN" | "IN_PROGRESS" | "DONE" | "REWARD" | string;

// interface Task {
//   title?: string;
//   // các trường khác...
// }

interface JobInfoCardProps {
  currentStatus: StatusType;
  taskDetail: Task | null;
  form: any; // form instance từ Form.useForm()
}

const JobInfoCard: React.FC<JobInfoCardProps> = ({ currentStatus, taskDetail, form }) => {
  useEffect(() => {
    if (taskDetail) {
      form.setFieldsValue({
        title: taskDetail.title || "",
        // có thể set thêm các trường khác
      });
    }else{
      form.setFieldsValue({
        title: "",
        // có thể set thêm các trường khác
      });
    }
  }, [taskDetail, form]);

  return (
    <Stack style={{minWidth:400}}>
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 flex items-center justify-center">
          <ProjectOutlined className="!text-cyan-600 !text-xs sm:!text-sm" />
        </div>
        <Text strong className="!text-gray-800 !text-sm sm:!text-base">
          Thông tin
        </Text>
      </div>

      <Stack direction="row" spacing={1}>
        <Form.Item
          name="title"
          
          rules={[
            { required: true, message: "Vui lòng nhập tên công việc" },
            { min: 3, message: "Ít nhất 3 ký tự" },
          ]}
          className="!mb-0 w-110"
        >
          <Input
            placeholder="Nhập tên công việc..."
            className="w-full !h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !shadow-sm"
            size="middle"
          />
        </Form.Item>

      </Stack>
    </Stack>
    
  );
};

export default JobInfoCard;
