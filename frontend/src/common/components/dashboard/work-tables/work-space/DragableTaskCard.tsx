import { useEffect, useState, useCallback } from "react";
import { Row, Col, Card, Button, message, Modal, notification } from "antd";
import { StarOutlined, PlusOutlined, MoreOutlined, StarFilled } from "@ant-design/icons";
import CloseIcon from '@mui/icons-material/Close';
import { Typography, Stack, IconButton, Box, TextField, Avatar } from "@mui/material";
import { useApiHost, useApiStatic } from "../../../../common/hooks/useApiHost";
import { TOKEN_LABEL } from "../../../../common/config";

import FormTask from "../FormTask";
import {
  DragDropContext,
  Droppable,
  Draggable,
  
  type DropResult,
} from "@hello-pangea/dnd";



import {
  getPrimaryTaskIcon,
  type ColumnType,
  type Task,
  type TasksResponse,
} from "../../../../@types/work-space.type";
import {
  useWorkSpaceQueryTaskById,
  useUpdateTaskStatusById,
  useDeleteTask,
  useWorkSpaceQueryById,
} from "../../../../common/hooks/work-space.hook";
// import { useCheckPermission } from "../../../../common/hooks/checkPermission.hook";
import type { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { useTaskContext } from "../../../../common/hooks/useTask";
import { useUser } from "../../../../common/hooks/useUser";

interface DragableTaskCardProps {
  task: any;
  col: any;
  idx: any;
  theme: any;
  isDragging: boolean;
  // setSelectedTask: React.Dispatch<React.SetStateAction<Task | null>>;
  // setEditingTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  setShowFormTask: React.Dispatch<React.SetStateAction<boolean>>;
}

function getAuthHeaders(): HeadersInit {
  const accessToken =
    localStorage.getItem(TOKEN_LABEL) || sessionStorage.getItem(TOKEN_LABEL);

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

// Component nhận props theo kiểu object 1 lần
const DragableTaskCard: React.FC<DragableTaskCardProps> = ({
  task,
  col,
  idx,
  theme,
  isDragging,
  // setSelectedTask,
  // setEditingTaskId,
  setShowFormTask,
}) => {
    const { userRoleId } = useUser();
    const isRewardColumn = col.type === "REWARD";
    const isDragDisabled = isRewardColumn && userRoleId !== -2;

    return (
    <Draggable
        key={task.id}
        draggableId={task.id}
        index={idx}
        isDragDisabled={isDragDisabled} // Vô hiệu hóa drag cho task trong cột khoán thưởng đối với nhân viên thường
    >
        {(provided, snapshot?) => 
        <CardItem provided={provided} 
            snapshot={snapshot} 
            theme={theme}
            isRewardColumn={isRewardColumn}
            isDragDisabled={isDragDisabled}
            task={task}
            isDragging={isDragging}
            // setSelectedTask={setSelectedTask}
            // setEditingTaskId={setEditingTaskId}
            setShowFormTask={setShowFormTask}
        />}
    </Draggable>
    );
}

export default DragableTaskCard;

interface CardItemProps {
  provided?: DraggableProvided;
  snapshot?: DraggableStateSnapshot;
  isRewardColumn: boolean;
  isDragDisabled: boolean;
  task: Task;
  theme: any;
  isDragging?: boolean;
  // setSelectedTask?: React.Dispatch<React.SetStateAction<any | null>>;
  // setEditingTaskId?: React.Dispatch<React.SetStateAction<string | null>>;
  setShowFormTask?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CardItem: React.FC<CardItemProps> = ({
  provided,
  snapshot,
  isRewardColumn,
  isDragDisabled,
  task,
  theme,
  isDragging,
  // setSelectedTask,
  // setEditingTaskId,
  setShowFormTask,
}) => {
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const {tasksData, updateTaskStatus, refetchTasks, taskDetail, setTaskDetail} = useTaskContext();
  // const {setTaskDetail} = useTaskContext();

  const handleDelete = async (id: string) => {
    setShowConfirm(false);

    try {
      const response = await fetch(`${useApiHost()}/task/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        notification.error({"message":`Xóa task không thành công:`, description:response.statusText});
      }else
      {
        notification.success({"message":"Task đã đưa vào thùng rác!"});
        refetchTasks();
      }
      // Bạn có thể gọi lại mutate hoặc cập nhật UI sau khi xóa thành công
    } catch (error) {
      message.error("Lỗi khi xóa task!");
      console.error(error);
    }
  };

  const isMobileView = window.innerWidth <= 640;
  const card_width = isMobileView
    ? Math.min(250, window.innerWidth - 32)
    : Math.min(300, Math.round((window.innerWidth - 360) / 4));


    return (
      <>
      
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      className={`task-card group/task relative mb-3 transition-all duration-200
        ${
        isDragDisabled ? "cursor-not-allowed opacity-90" : "cursor-pointer"
      } ${
        snapshot?.isDragging
          ? "shadow-xl scale-105 ring-2 ring-[#00B4B6]/30 z-50 border-2 border-[#00B4B6]/50 rotate-1"
          : "shadow-md hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5"
      } ${!snapshot?.isDragging ? "drag-item-reset" : ""}`}
      style={{
        ...provided?.draggableProps.style,
        maxWidth: isMobileView ? card_width : 300,
        width: '100%',
        boxSizing: 'border-box',
        ...(snapshot?.isDragging
          ? {
              transition: "none",
              zIndex: 99999,
              cursor: "grabbing",
              position: "fixed",
              top: 0,
              left: 0,
              margin: 0,
              width: card_width,
              minWidth: card_width,
              transform: provided?.draggableProps.style?.transform || "none",
            }
          : {}),
      }}
      onClick={() => {
        if (!snapshot?.isDragging && !isDragging) {
          if(setTaskDetail) setTaskDetail(task);
          if(setShowFormTask) setShowFormTask(true);
        }
      }}
    >
      

      {/* Task glow effect */}
      <div
        className="absolute inset-0 rounded-xl blur opacity-0 group-hover/task:opacity-20 transition-opacity duration-200"
        style={{ background: `linear-gradient(135deg, ${theme.color}40, ${theme.color}20)` }}
      ></div>

      {/* Task card content */}
      <div
        className={`relative bg-white rounded-xl p-2 sm:p-3 border transition-all duration-300 ${
          isRewardColumn ? "border-purple-200 bg-purple-50/30" : ""
        } ${
          snapshot?.isDragging
            ? "shadow-xl border-[#00B4B6]/50 bg-white/95 backdrop-blur-sm"
            : "shadow-md border-gray-100/50 group-hover/task:shadow-lg group-hover/task:border-gray-200/70"
        }`}
        style={{
          height: '150px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Badge task khoán thưởng đặc biệt */}
        {isRewardColumn && (
          <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
            🏆
          </div>
        )}

        <Stack direction="row" sx={{ height: '100%', overflow: 'hidden', width: '100%' }}>
            {getPrimaryTaskIcon(task?.icon) && 
            <Avatar
                src={`${useApiStatic()}/${getPrimaryTaskIcon(task?.icon)}`}
                alt="Task icon"
                sx={{ width: 70, height: 70, borderRadius: 0, flexShrink: 0 }}
            />}

            <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0" style={{ overflow: 'hidden', minWidth: 0 }}>
              <div className="flex items-start justify-between gap-2">
                <h3
                  className={`font-bold text-xs sm:text-sm transition-colors duration-150 flex-1 min-w-0 ${
                    isRewardColumn ? "text-purple-800" : "text-gray-800 group-hover/task:text-gray-900"
                  }`}
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    whiteSpace: 'normal',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {task.title}
                </h3>
              </div>
              {task.description && (
                <p 
                  className="text-gray-500 text-xs leading-relaxed"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    whiteSpace: 'normal',
                  }}
                >
                  {task.description}
                </p>
              )}
              {task.reward && (
                <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                  <span>💰</span>
                  <span className="truncate">{task.reward.toLocaleString()} VNĐ</span>
                </div>
              )}
            </div>

          
            {/* Task footer */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100/50">
              
              <IconButton
                size="small"
                aria-label="delete"
                color="error"
                onClick={(event) => 
                  {
                    event.preventDefault();
                    event.stopPropagation();
                    setShowConfirm(true);
                    
                  }}
                sx={{
                  color: 'orange',
                  '&:hover': {
                    color: 'red',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
              {!!(task?.rate && task.rate > 0) && (
                <div className="text-xs text-gray-400 font-mono flex-shrink-0">
                  {[...Array(task.rate)].map((_, index) => (
                    <StarFilled key={index} style={{color:'orange'}}/>
                  ))}
                </div>
              )}

            </div>
          </Stack>
      </div>
    </div>
    

     <Modal
          title="Bạn có chắc muốn xóa công việc?"
          open={showConfirm}
          onOk = {() => handleDelete(task.id)}
          onCancel={() => setShowConfirm(false)}
          >
      </Modal>
    </>
  );
}
