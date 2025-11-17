import { useEffect, useState, useCallback, useContext } from "react";
import { Row, Col, Card, Button, message, Modal, notification } from "antd";
import { StarOutlined, PlusOutlined, MoreOutlined } from "@ant-design/icons";
import FormTask from "./FormTask";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import "./css/css.css";
import type {
  ColumnType,
  Task,
  TasksResponse,
} from "../../../@types/work-space.type";
import {
  useWorkSpaceQueryTaskById,
  useUpdateTaskStatusById,
  useDeleteTask,
  useWorkSpaceQueryById,
} from "../../../common/hooks/work-space.hook";
// import { useCheckPermission } from "../../../common/hooks/checkPermission.hook";
import DragableTaskCard from "./work-space/DragableTaskCard";
import columnThemes from "./theme.json";
import WorkspaceHeader from "./work-space/WorkspaceHeader";
import WorkspaceBoard from "./work-space/WorkspaceBoard";
import WorkspaceModal from "./work-space/WorkspaceModal";
import "./work-space/workspace.css";
import { UpdateButtonContext } from "../../../common/hooks/useUpdateButtonTask";
import { useTaskContext } from "../../../common/hooks/useTask";
import { useUser } from "../../../common/hooks/useUser";

export interface DeleteConfirmProps {
    visible: boolean;
    taskId: string | null;
    taskTitle: string;
}

export const fixedColumns = [
    { id: "col-0", title: "Đơn hàng", type: "OPEN" },
    { id: "col-1", title: "Phân việc", type: "IN_PROGRESS" },
    { id: "col-2", title: "Thực hiện", type: "DONE" },
    { id: "col-3", title: "Hoàn thiện", type: "REWARD" },
  ];

export function getTitleByStatus(type: string): string | undefined {
    const col = fixedColumns.find(col => col.type === type);
    return col ? col.title : undefined;
}

export default function ManagermentBoard() {
  const context = useContext(UpdateButtonContext);
  if (!context) throw new Error("UpdateButtonContext not found");
  const { showUpdateButton, setShowUpdateButton } = context;
  
  const {workspaceId, isCurrentWorkspaceFree, userLeadId} = useUser();
  const { data: workspaceData } = useWorkSpaceQueryById(workspaceId);

  const {tasksData, updateTaskStatus, refetchTasks, taskDetail, setTaskDetail} = useTaskContext();
  const [currentColumn, setCurrentColumn] = useState<number>(0);
  const deleteTaskMutation = useDeleteTask();

  // Chuyển đổi board data thành columns structure
  const convertBoardToColumns = useCallback(
    (boardData: TasksResponse): ColumnType[] => {
      // console.log('OK1', boardData);
      return fixedColumns.map((col) => ({
        ...col,
        tasks: boardData[col.type]?.tasks || [],
      }));
    },
    []
  );

  const [columns, setColumns] = useState<ColumnType[]>(() =>
    // @ts-ignore
    convertBoardToColumns(tasksData || {})
  );

  // Reload columns when board data changes
  useEffect(() => {
    if (showUpdateButton === 1) {
      
    }

    // @ts-ignore
    const res = convertBoardToColumns(tasksData);
    // console.log('resCols', tasksData);
    setColumns(res || {});



  }, [tasksData, convertBoardToColumns, showUpdateButton]);

  const [isDragging, setIsDragging] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<DeleteConfirmProps>({
    visible: false,
    taskId: null,
    taskTitle: "",
  });

  // Callback để reset trạng thái drag
  const resetDragState = useCallback(() => {
    setIsDragging(false);
    setDraggedTaskId(null);

    // Force reset tất cả các element có thể bị stuck
    setTimeout(() => {
      const draggedElements = document.querySelectorAll(
        "[data-rbd-draggable-context-id]"
      );
      draggedElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.transform = "";
        htmlEl.style.transition = "";
        htmlEl.style.zIndex = "";
        htmlEl.style.pointerEvents = "";
        htmlEl.classList.add("force-reset");

        // Remove force-reset class sau khi animation xong
        setTimeout(() => {
          htmlEl.classList.remove("force-reset");
        }, 150);
      });
    }, 50);
  }, []);

  const onDragStart = useCallback(
    (start: any) => {
      // if (!adminMode) return;

      // Kiểm tra xem task có đang ở cột "Khoán thưởng" không
      const sourceColumn = columns.find((col) =>
        // @ts-ignore - Bỏ qua type check vì columns có tasks trong runtime
        col.tasks?.some((task: any) => task.id === start.draggableId)
      );

      if (sourceColumn?.type === "REWARD") {
        message.warning("Không thể di chuyển task đã hoàn thành khoán thưởng!");
        return;
      }

      setIsDragging(true);
      setDraggedTaskId(start.draggableId);

      // Đảm bảo phần tử được kéo luôn theo sát con trỏ - Giống Trello
      const draggedElement = document.querySelector(
        `[data-rbd-draggable-id="${start.draggableId}"]`
      );
      if (draggedElement) {
        const htmlEl = draggedElement as HTMLElement;
        htmlEl.style.position = "fixed";
        htmlEl.style.margin = "0";
        htmlEl.style.zIndex = "99999";
        htmlEl.style.pointerEvents = "none";
        htmlEl.style.transition = "none";
        // Thêm hiệu ứng Trello
        htmlEl.style.transform = "rotate(2deg) scale(1.02)";
        htmlEl.style.boxShadow =
          "0 8px 16px rgba(0, 0, 0, 0.12), 0 3px 6px rgba(0, 0, 0, 0.08)";
        htmlEl.style.outline = "none"; // ← Thêm dòng này
        htmlEl.style.border = "none"; // ← Thêm dòng này
        // Thêm hiệu ứng cho task card bên trong
        const taskCard = htmlEl.querySelector(".task-card");
        if (taskCard) {
          const cardEl = taskCard as HTMLElement;
          cardEl.style.border = "2px solid #00B4B6";
          cardEl.style.background = "rgba(255, 255, 255, 0.95)";
          cardEl.style.backdropFilter = "blur(4px)";
          cardEl.style.outline = "none"; // ← Thêm dòng này
        }
      }
    },
    [ columns]
  );

  const onDragUpdate = useCallback(
    (update: any) => {
      // if (!adminMode) return;


      if(update.destination?.droppableId) {
        const destColIdx = columns.findIndex(
          (c) => c.id === update.destination.droppableId
        );

        if (destColIdx !== -1 && fixedColumns[destColIdx].type === "REWARD") {
          // Nếu đang cố gắng kéo vào cột khoán thưởng, hiển thị cảnh báo
          const warningElement = document.getElementById("drag-warning");
          if (!warningElement) {
            const warning = document.createElement("div");
            warning.id = "drag-warning";
            warning.className =
              "fixed top-4 left-1/2 transform -translate-x-1/2 z-[99999] bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg";
            warning.textContent =
              "⚠️ Không thể kéo công việc vào cột Khoán thưởng!";
            document.body.appendChild(warning);

            // Tự động ẩn cảnh báo sau 2 giây
            setTimeout(() => {
              if (warning.parentNode) {
                warning.parentNode.removeChild(warning);
              }
            }, 2000);
          }
        }
      }

      // Theo dõi việc kéo và đảm bảo phần tử luôn theo sát con trỏ - Giống Trello
      if (
        update.draggableId &&
        update.clientY !== undefined &&
        update.clientX !== undefined
      ) {
        const draggedElement = document.querySelector(
          `[data-rbd-draggable-id="${update.draggableId}"]`
        );
        if (draggedElement) {
          const htmlEl = draggedElement as HTMLElement;
          // Đảm bảo phần tử luôn ở vị trí con trỏ chuột với hiệu ứng Trello
          htmlEl.style.transform = `translate(${update.clientX}px, ${update.clientY}px) translate(-50%, -50%) rotate(2deg) scale(1.02)`;
        }
      }
    },
    [ columns]
  );

  



  const onDragEnd = useCallback(
    (result: DropResult) => {
      setShowUpdateButton(0);
      // if (!adminMode) return;
      const { source, destination } = result;

      // Reset drag state ngay lập tức
      resetDragState();

      // Reset style của phần tử được kéo - Giống Trello
      if (draggedTaskId) {
        const draggedElement = document.querySelector(
          `[data-rbd-draggable-id="${draggedTaskId}"]`
        );
        if (draggedElement) {
          const htmlEl = draggedElement as HTMLElement;
          htmlEl.style.position = "";
          htmlEl.style.margin = "";
          htmlEl.style.zIndex = "";
          htmlEl.style.pointerEvents = "";
          htmlEl.style.transition = "";
          htmlEl.style.transform = "";
          htmlEl.style.boxShadow = "";
          htmlEl.style.outline = "";
          htmlEl.style.border = "";
          // Reset hiệu ứng cho task card
          const taskCard = htmlEl.querySelector(".task-card");
          if (taskCard) {
            const cardEl = taskCard as HTMLElement;
            cardEl.style.border = "";
            cardEl.style.background = "";
            cardEl.style.backdropFilter = "";
            cardEl.style.outline = "";
          }
        }
      }

      if (!destination) return;

      const sourceColIdx = columns.findIndex(
        (c) => c.id === source.droppableId
      );
      const destColIdx = columns.findIndex(
        (c) => c.id === destination.droppableId
      );

      if (sourceColIdx === -1 || destColIdx === -1) return;

      // Kiểm tra nếu kéo trong cùng một cột và cùng vị trí thì không làm gì
      if (sourceColIdx === destColIdx && source.index === destination.index) {
        return;
      }

      // Kiểm tra xem có đang cố gắng kéo vào cột "Khoán thưởng" không
      if (fixedColumns[destColIdx].type === "REWARD") {
        // Chỉ cho phép kéo từ cột "Hoàn thiện" (DONE) vào cột "Khoán thưởng"
        if (fixedColumns[sourceColIdx].type !== "DONE") {
          message.warning(
            "Chỉ có thể kéo task từ cột 'Hoàn thiện' vào cột 'Khoán thưởng'! Task phải hoàn thành trước khi được khoán thưởng."
          );
          return;
        }
        return;
      }

      // Hàm xử lý kéo thả sau khi xác nhận
      const proceedWithDragAndDrop = () => {
        const newColumns = [...columns];

        if (sourceColIdx === destColIdx) {
          // Kéo trong cùng một cột - chỉ cập nhật UI, không cần API call
          // @ts-ignore
          const tasks = [...newColumns[sourceColIdx].tasks];
          const [movedTask] = tasks.splice(source.index, 1);
          tasks.splice(destination.index, 0, movedTask);
          newColumns[sourceColIdx] = {
            ...newColumns[sourceColIdx],
            // @ts-ignore
            tasks: tasks,
          };
        } else {
          // Kéo giữa các cột khác nhau - cần cập nhật status qua API
          // @ts-ignore
          const sourceTasks = [...newColumns[sourceColIdx].tasks];
          const [movedTask] = sourceTasks.splice(source.index, 1);
          // @ts-ignore
          const destTasks = [...newColumns[destColIdx].tasks];
          destTasks.splice(destination.index, 0, movedTask);

          newColumns[sourceColIdx] = {
            ...newColumns[sourceColIdx],
            // @ts-ignore
            tasks: sourceTasks,
          };
          newColumns[destColIdx] = {
            ...newColumns[destColIdx],
            // @ts-ignore
            tasks: destTasks,
          };

          // Cập nhật status của task qua API
          const newStatus = fixedColumns[destColIdx].type;
          if (movedTask.id) {
            updateTaskStatus(movedTask.id, newStatus);
          }
        }

        setColumns(newColumns);
      };

      // Nếu không phải cột khoán thưởng, xử lý bình thường
      proceedWithDragAndDrop();
    },
    [columns, resetDragState, draggedTaskId, updateTaskStatus]
  );

  // Load data from API when component mounts or workspaceId changes
  useEffect(() => {
    if (tasksData) {
      setColumns(convertBoardToColumns(tasksData));
    }
  }, [tasksData, convertBoardToColumns]);

  // Cleanup effect để đảm bảo reset khi component unmount
  useEffect(() => {
    return () => {
      resetDragState();
    };
  }, [resetDragState]);

  const [showFormTask, setShowFormTask] = useState(false);
  const {setWorkspaces} = useUser();
  
  const handleFormSuccess = useCallback(() => {
    setShowFormTask(false);
    // setSelectedTask(null);
    setTaskDetail(null);
    // setSelectedTask(null);
    refetchTasks();
  }, [refetchTasks]);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmModal.taskId) {
      deleteTaskMutation.mutate(deleteConfirmModal.taskId);
      setDeleteConfirmModal({
        visible: false,
        taskId: null,
        taskTitle: "",
      });

      setWorkspaces(prev => prev.filter(el => el.id !== deleteConfirmModal.taskId));
    }
  }, [deleteConfirmModal.taskId, deleteTaskMutation]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmModal({
      visible: false,
      taskId: null,
      taskTitle: "",
    });
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <WorkspaceHeader workspaceData={workspaceData}/>
      
      {/* Board */}
      <WorkspaceBoard onDragStart = {onDragStart} 
                      onDragUpdate = {onDragUpdate}
                      // adminMode = {adminMode}
                      onDragEnd = {onDragEnd}
                      isDragging = {isDragging}
                      columns = {columns}
                      // setSelectedTask = {setSelectedTask} 
                      // setEditingTaskId = {setTaskDetail}
                      setShowFormTask = {setShowFormTask}
                      currentColumn={currentColumn}
                      setCurrentColumn = {setCurrentColumn}
                    />

      <FormTask
        currentColumn={currentColumn}
        open={showFormTask}
        onCancel={() => { setShowFormTask(false); }}
        
        // workspaceId={workspaceId}
        initialValues={taskDetail}
        onSuccess={handleFormSuccess}

        // @ts-ignore
        users = {workspaceData?.users}
        // @ts-ignore
        // customers = {workspaceData?.customers}
        updateTaskStatus={updateTaskStatus}
      />

      <WorkspaceModal deleteConfirmModal={deleteConfirmModal}      
                      handleDeleteCancel={handleDeleteCancel}
                      handleDeleteConfirm={handleDeleteConfirm}
                      deleteTaskMutation={deleteConfirmModal}
                      
                      />
    </div>
  );
}
