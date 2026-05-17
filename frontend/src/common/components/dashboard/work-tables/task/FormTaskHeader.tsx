import { useContext, useEffect, useState } from "react";
import { Typography, Button } from "antd";
import { UpdateButtonContext } from "../../../../common/hooks/useUpdateButtonTask";
import type { Task } from "../../../../@types/work-space.type";
import { Stack, Box } from "@mui/material";
import { useTaskContext } from "../../../../common/hooks/useTask";
import { useUser } from "../../../../common/hooks/useUser";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface TaskHeaderProps {
  onSuccess: () => void;
  onUpdate: () => void;
  onCancel?: () => void;
}

// TaskHeader.tsx
export default function TaskHeader({ onSuccess, onUpdate, onCancel }: TaskHeaderProps) {
  const { taskDetail, updateTaskStatus } = useTaskContext();
  const { isMobile } = useUser();

  const [isReward, setIsReward] = useState<boolean>(false);

  useEffect(() => {
    setIsReward(taskDetail?.status === "REWARD");
  }, [taskDetail]);

  const handleReward = async () => {
    if (!taskDetail) return;
    if (!updateTaskStatus) return;

    try {
      await updateTaskStatus(taskDetail.id, "REWARD");
    } catch (error) {
      console.error("Lỗi nghiệm thu:", error);
    }

    if (onSuccess)
      onSuccess();
  };

  const buttonStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  };

  return (
    <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ width: '100%', mb: 2 }}>

      <div className="flex items-center gap-1 px-4 py-3">
        <Title level={4} style={{ whiteSpace: 'nowrap', margin: 0 }}>{taskDetail ? "Cập nhật công việc" : "Tạo công việc mới"}</Title>
      </div>

      <Stack direction="row" spacing={2} sx={{ pr: 2 }}>
        {!isReward && (taskDetail?.status !== "DONE" ?
          <Button
            type="primary"
            onClick={onUpdate}
            style={{ ...buttonStyle, backgroundColor: '#00B4B6', border: 'none' }} // Admake blue
            title="Cập nhật"
          >
            <CheckOutlined />
          </Button>
          :
          <Button
            type="primary"
            onClick={handleReward}
            style={{ ...buttonStyle, backgroundColor: '#00B4B6', border: 'none' }}
            title="Nghiệm Thu"
          >
            🏆
          </Button>)
        }

        <Button
          onClick={onCancel}
          style={{ ...buttonStyle, backgroundColor: '#9ca3af', color: 'white', border: 'none' }} // Xám
          title="Đóng"
        >
          <CloseOutlined />
        </Button>
      </Stack>

    </Stack>
  );
}