import React from "react";
import { Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { Mode } from "../../../../@types/work-space.type";

const { Text } = Typography;

// Kiểu dữ liệu User
interface User {
  id: string | number;
  fullName?: string;
  username?: string;
}

// Kiểu handlers cho UserSection (giả định có 2 hàm)
interface Handlers {
  userCheck: (checked: boolean, id: string) => void;
  userRemove: (id: string) => void;
}

// Kiểu props cho component AgentInfo
interface AgentInfoProps {
  currentStatus: string;
  isEditMode: boolean;
  mode: Mode;
  users: {selectedUsers: string[]};
  handlers: Handlers;
  mappedTask?: {
    assigns?: User[];
  };
}

// // Component phụ UserSection giả định (bạn có thể thay thế hoặc triển khai riêng)
const UserSection: React.FC<{
  selectedUsers: string[];
  onUserCheck: (checked: boolean, id: string) => void;
  onRemoveUser: (id: string) => void;
}> = ({ selectedUsers, onUserCheck, onRemoveUser }) => {
  // TODO: triển khai giao diện chọn người dùng khi sửa, hiện ở trạng thái OPEN và không DONE/REWARD
  return <div>{/* UI chọn người dùng ở đây */}</div>;
};

const AgentInfo: React.FC<AgentInfoProps> = ({
  currentStatus,
  isEditMode,
  mode,
  users,
  handlers,
  mappedTask,
}) => {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-indigo-100 to-indigo-200 flex items-center justify-center">
          <UserOutlined className="!text-indigo-600 !text-xs sm:!text-sm" />
        </div>
        <Text strong className="!text-gray-800 !text-sm sm:!text-base">
          Nhân sự thực hiện
        </Text>
      </div>

      {currentStatus !== "DONE" && currentStatus !== "REWARD" ? (
        <UserSection
          selectedUsers={users.selectedUsers}
          onUserCheck={handlers.userCheck}
          onRemoveUser={handlers.userRemove}
        />
      ) : (
        <div
          className="px-4 pb-4 max-h-60 overflow-y-auto"
          style={{ maxHeight: "240px" }}
        >
          {/* @ts-ignore */}
          {mappedTask?.assigns?.map((user: User) => (
            <div
              key={user.id}
              className="flex items-center border-b last:border-b-0 py-2"
            >
              <span className="text-cyan-600 font-semibold flex-1 cursor-pointer hover:underline">
                {user?.fullName || user?.username || "Unknown User"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentInfo;
