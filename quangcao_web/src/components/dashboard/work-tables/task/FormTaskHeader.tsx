import { useContext, useEffect } from "react";
import { Modal, Typography, Button } from "antd";
import { UpdateButtonContext } from "../../../../common/hooks/useUpdateButtonTask";
import type { Task } from "../../../../@types/work-space.type";
import { Stack } from "@mui/material";
import { useTaskContext } from "../../../../common/hooks/useTask";
const { Title, Text } = Typography;

interface TaskHeaderProps {
  onSuccess: () => void;
  onUpdate: () => void;
}

// TaskHeader.tsx
export default function TaskHeader({ onSuccess, onUpdate }: TaskHeaderProps) {
  const {taskDetail, isLoading, updateTaskStatus} = useTaskContext();

  const context = useContext(UpdateButtonContext);
  if (!context) throw new Error("UpdateButtonContext not found");
  const { showUpdateButton, setShowUpdateButton } = context;
  
  console.log('Task:', taskDetail);

  useEffect(()=>{
    console.log('showUpdateButton',showUpdateButton);
  },[showUpdateButton]);


  useEffect(()=>{
    if (!taskDetail) setShowUpdateButton(0);
    // console.log('TTT', taskDetail);
    setShowUpdateButton(taskDetail?.status === "DONE" ? 1 : (taskDetail?.status === "REWARD" ? 2: 0));
  },[taskDetail]);

  const handleReward = async () => {
    // console.log("A_Task", taskDetail,updateTaskStatus);
    if (!taskDetail) return;
    if (!updateTaskStatus) return;

    try {
      await updateTaskStatus(taskDetail.id, "REWARD");
      console.log("Nghiệm thu thành công!", taskDetail);
    } catch (error) {
      console.error("Lỗi nghiệm thu:", error);
    }

    if(onSuccess)
      onSuccess();
  };

  


  return (
    <Stack direction="row" spacing={5}>
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="icon-container">
          {/* Icon component here */}
        </div>
        <div>
          <Title level={5}>{taskDetail ? "Cập nhật công việc" : "Tạo công việc mới"}</Title>
        </div>
      </div>

      <Stack direction="row" spacing={1}>
        {showUpdateButton === 0 && 
          <Button type="primary" onClick={onUpdate}>
            ✅ Cập nhật
          </Button>
        }

        {showUpdateButton === 1 && 
          <Button type="primary" onClick={handleReward}>
            🏆 Nghiệm Thu
          </Button>
        }
        
      </Stack>
    </Stack>
  );
}