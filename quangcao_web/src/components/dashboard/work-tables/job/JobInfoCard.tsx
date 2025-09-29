import React from "react";
import { Form, Input, Tag, Typography } from "antd";
import { ProjectOutlined } from "@ant-design/icons";
import type { Mode } from "../../../../@types/work-space.type";

const { Text } = Typography;

// Kiểu các trạng thái công việc
type StatusType = "OPEN" | "IN_PROGRESS" | "DONE" | "REWARD" | string;



// Kiểu props của component
// interface JobInfoCardProps {
//   currentStatus: StatusType;
//   mode: Mode;
// }

const getStatusMeta = (status: string) => {
    const statusMap: Record<string, any> = {
      OPEN: { color: "blue", label: "Phân việc", icon: "📋" },
      IN_PROGRESS: { color: "orange", label: "Sản xuất", icon: "⚡" },
      DONE: { color: "green", label: "Hoàn thiện", icon: "✅" },
      REWARD: { color: "purple", label: "Đã Nghiệm Thu", icon: "🏆" },
    };
    return statusMap[status] || statusMap.OPEN;
  };

const JobInfoCard: React.FC<{currentStatus: StatusType, mode: Mode}> 
  = ({ currentStatus, mode }) => {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 flex items-center justify-center">
          <ProjectOutlined className="!text-cyan-600 !text-xs sm:!text-sm" />
        </div>
        <Text strong className="!text-gray-800 !text-sm sm:!text-base">
          Thông tin cơ bản
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        <Form.Item
          name="title"
          label={
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-1 bg-cyan-500 rounded-full"></div>
              <span className="text-gray-800 font-medium text-xs sm:text-sm">
                Tên công việc
              </span>
              <span className="text-red-500">*</span>
            </div>
          }
          rules={[
            { required: true, message: "Vui lòng nhập tên công việc" },
            { min: 3, message: "Ít nhất 3 ký tự" },
          ]}
          className="!mb-0"
        >
          <Input
            placeholder="Nhập tên công việc..."
            className="!h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !shadow-sm"
            size="middle"
            disabled={!mode.adminMode}
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-600 mb-2 font-medium">Danh sách</span>
            <Tag
              color={getStatusMeta(currentStatus).color}
              className="!px-3 !py-1.5 !rounded-lg !border-none !font-medium !text-xs !shadow-md !w-fit"
            >
              {getStatusMeta(currentStatus).icon} {getStatusMeta(currentStatus).label}
            </Tag>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-600 mb-2 font-medium">Trạng thái</span>
            <Tag
              color={getStatusMeta(currentStatus).color}
              className="!px-3 !py-1.5 !rounded-lg !border-none !font-medium !text-xs !shadow-md !w-fit"
            >
              {currentStatus === "OPEN"
                ? "⏳ Chưa nhận việc"
                : currentStatus === "IN_PROGRESS"
                ? "🚀 Đang thực hiện"
                : currentStatus === "DONE"
                ? "✅ Đã hoàn thành"
                : currentStatus === "REWARD"
                ? "🏆 Đã Nghiệm Thu"
                : "⏳ Chưa nhận việc"}
            </Tag>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobInfoCard;
