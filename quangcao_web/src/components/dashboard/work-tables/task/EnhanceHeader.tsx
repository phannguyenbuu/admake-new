import React from "react";
import { Tag, Typography } from "antd";

const { Text } = Typography;
interface EnhanceHeaderProps {
  duration: number;
}

const EnhanceHeader: React.FC<EnhanceHeaderProps> = ({ duration }) => {
  return (
    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-cyan-500/10 via-white to-cyan-600/10 border-b border-cyan-500/20 flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
          <Text className="text-cyan-600 text-xs sm:text-sm font-medium">
            Thông tin công việc
          </Text>
        </div>
        {duration > 0 && (
          <Tag
            color="cyan"
            className="!px-1.5 sm:!px-2 !py-0.5 !rounded-full !border-none !font-medium !text-xs !shadow-sm !ml-auto"
          >
            Thời gian: {duration} ngày
          </Tag>
        )}
      </div>
    </div>
  );
};

export default EnhanceHeader;
