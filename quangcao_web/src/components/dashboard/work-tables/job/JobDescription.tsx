import React from "react";
import { Form, Input, Typography } from "antd";
import type { Mode } from "../../../../@types/work-space.type";

const { Text } = Typography;
const { TextArea } = Input;

interface TaskDetailType {
  description?: string;
}

interface JobDescriptionProps {
  mode: Mode;
  taskDetail?: TaskDetailType | null;
}

const JobDescription: React.FC<JobDescriptionProps> = ({ mode, taskDetail }) => {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-green-100 to-green-200 flex items-center justify-center">
          <span className="text-green-600 text-xs sm:text-sm">📝</span>
        </div>
        <Text strong className="!text-gray-800 !text-sm sm:!text-base">
          Mô tả công việc
        </Text>
      </div>

      {mode.adminMode ? (
        <Form.Item
          name="description"
          label={
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-1 bg-green-500 rounded-full"></div>
              <span className="text-gray-800 font-medium text-xs sm:text-sm">
                Chi tiết công việc
              </span>
            </div>
          }
          className="!mb-0"
        >
          <TextArea
            rows={3}
            showCount
            maxLength={1000}
            placeholder="Mô tả chi tiết về công việc cần thực hiện..."
            className="!rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !shadow-sm !resize-none !text-xs sm:!text-sm"
          />
        </Form.Item>
      ) : (
        <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-700 leading-relaxed">
            {/* @ts-ignore */}
            {taskDetail?.description || "Không có mô tả"}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDescription;
