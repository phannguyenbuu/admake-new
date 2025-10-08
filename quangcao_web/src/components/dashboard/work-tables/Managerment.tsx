import { useEffect, useState, useCallback } from "react";
import { Row, Col, Card, Button, message, Modal } from "antd";
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
  ManagermentBoardProps,
  Task,
  TasksResponse,
} from "../../../@types/work-space.type";
import {
  useWorkSpaceQueryTaskById,
  useUpdateTaskStatusById,
  useDeleteTask,
  useWorkSpaceQueryById,
} from "../../../common/hooks/work-space.hook";
import { useCheckPermission } from "../../../common/hooks/checkPermission.hook";
import DragableTaskCard from "./work-space/DragableTaskCard";

export default function ManagermentBoard({
  workspaceId,
}: ManagermentBoardProps) {
  const adminMode = useCheckPermission();
  const fixedColumns = [
    { id: "col-0", title: "Phân việc", type: "OPEN" },
    { id: "col-1", title: "Sản xuất", type: "IN_PROGRESS" },
    { id: "col-2", title: "Hoàn thiện", type: "DONE" },
    { id: "col-3", title: "Khoán thưởng", type: "REWARD" },
  ];

  // API hooks
  const { data: workspaceData } = useWorkSpaceQueryById(workspaceId);

  // console.log('MAN_WSPACE', workspaceData);

  const { data: tasksData, refetch: refetchTasks } = useWorkSpaceQueryTaskById(workspaceId);


  // console.log('MAN_TASK', tasksData);

  const updateTaskStatusMutation = useUpdateTaskStatusById();
  const deleteTaskMutation = useDeleteTask();

  // Chuyển đổi board data thành columns structure
  const convertBoardToColumns = useCallback(
    (boardData: TasksResponse): ColumnType[] => {
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
    // @ts-ignore
    setColumns(convertBoardToColumns(tasksData || {}));
  }, [tasksData, convertBoardToColumns]);

  const [isDragging, setIsDragging] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    visible: boolean;
    taskId: string | null;
    taskTitle: string;
  }>({
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
      if (!adminMode) return;

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
    [adminMode, columns]
  );

  const onDragUpdate = useCallback(
    (update: any) => {
      if (!adminMode) return;

      // Kiểm tra xem có đang cố gắng kéo vào cột "Khoán thưởng" không
      if (update.destination?.droppableId) {
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
    [adminMode, columns]
  );

  // Hàm cập nhật trạng thái task qua API
  const updateTaskStatus = useCallback(
    async (taskId: string, newStatus: string) => {
      try {
        await updateTaskStatusMutation.mutateAsync({
          id: taskId,
          dto: { status: newStatus },
        });
        message.success("Cập nhật trạng thái thành công!");
        refetchTasks();
      } catch (error) {
        message.error("Có lỗi xảy ra khi cập nhật trạng thái!");
      }
    },
    [updateTaskStatusMutation, refetchTasks]
  );

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!adminMode) return;
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
    [columns, resetDragState, draggedTaskId, updateTaskStatus, adminMode]
  );

  // Load data from API when component mounts or workspaceId changes
  useEffect(() => {
    if (tasksData?.data) {
      setColumns(convertBoardToColumns(tasksData.data));
    }
  }, [tasksData, convertBoardToColumns]);

  // Cleanup effect để đảm bảo reset khi component unmount
  useEffect(() => {
    return () => {
      resetDragState();
    };
  }, [resetDragState]);

  const [showFormTask, setShowFormTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const handleFormSuccess = useCallback(() => {
    setShowFormTask(false);
    setEditingTaskId(null);
    setSelectedTask(null);
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
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-teal-400/5 to-cyan-600/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 pt-4 pb-3">
        <div className="flex items-center justify-center sm:justify-start gap-3">
          <div className="group relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00B4B6] to-teal-500 rounded-xl blur-md opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>

            {/* Main header */}
            <div className="relative bg-gradient-to-r from-[#00B4B6] to-teal-500 rounded-xl shadow-lg px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 text-white font-bold text-base sm:text-lg border border-white/10 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <span className="truncate max-w-[200px] sm:max-w-none">
                {/* @ts-ignore */}
                {workspaceData?.name}
              </span>
              <StarOutlined className="ml-1 text-white text-base transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0" />
            </div>
          </div>
        </div>
        
      </div>

      {/* Board */}
      <div className="relative z-10 px-4 sm:px-6 pt-3">
        <DragDropContext
          onDragStart={onDragStart}
          onDragUpdate={onDragUpdate}
          onDragEnd={onDragEnd}
          sensors={adminMode ? undefined : []}
        >
          <Row gutter={[12, 12]} wrap={false} className="pb-6 overflow-x-auto">
            {columns.map((col, colIdx) => {
              // Column color themes
              const columnThemes = [
                {
                  gradient: "from-red-500 to-pink-500",
                  bg: "bg-gradient-to-br from-red-50 to-pink-50",
                  color: "#ef4444",
                  lightColor: "rgba(239, 68, 68, 0.1)",
                },
                {
                  gradient: "from-yellow-500 to-orange-500",
                  bg: "bg-gradient-to-br from-yellow-50 to-orange-50",
                  color: "#f59e0b",
                  lightColor: "rgba(245, 158, 11, 0.1)",
                },
                {
                  gradient: "from-green-500 to-teal-500",
                  bg: "bg-gradient-to-br from-green-50 to-teal-50",
                  color: "#10b981",
                  lightColor: "rgba(16, 185, 129, 0.1)",
                },
                {
                  gradient: "from-purple-500 to-indigo-500",
                  bg: "bg-gradient-to-br from-purple-50 to-indigo-50",
                  color: "#8b5cf6",
                  lightColor: "rgba(139, 92, 246, 0.1)",
                },
              ];

              const theme = columnThemes[colIdx];

              return (
                <Col
                  key={col.id}
                  className="flex-shrink-0 min-w-[380px] sm:min-w-[260px] max-w-[420px] sm:max-w-[280px]"
                >
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div className="group relative">
                        {/* Enhanced Column Card */}
                        <Card
                          title={
                            <div className="flex items-center justify-between !text-white !text-sm font-semibold">
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className="w-2 h-2 bg-white/30 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor: "rgba(255,255,255,0.3)",
                                  }}
                                ></div>
                                <span className="truncate">{col.title}</span>
                                <div className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold border border-white/5 flex-shrink-0">
                                  {/* @ts-ignore */}
                                  {col.tasks.length}
                                </div>
                              </div>
                              <MoreOutlined className="cursor-pointer hover:bg-white/20 rounded-md p-1.5 transition-all duration-200 flex-shrink-0" />
                            </div>
                          }
                          className={`relative w-full transition-all duration-300 ease-out !border-none shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                            snapshot.isDraggingOver
                              ? "scale-102 shadow-xl"
                              : "scale-100"
                          } ${col.type === "REWARD" ? "reward-column" : ""}`}
                          style={{
                            background: `linear-gradient(135deg, ${theme.color} 0%, ${theme.color}dd 100%)`,
                            borderRadius: "20px",
                            overflow: "hidden",
                          }}
                          styles={{
                            body: {
                              background: `linear-gradient(135deg, ${theme.color} 0%, ${theme.color}dd 100%)`,
                              padding: "12px",
                              minHeight: "120px",
                              border: "none",
                            },
                            header: {
                              background: `linear-gradient(135deg, ${theme.color} 0%, ${theme.color}dd 100%)`,
                              borderRadius: "20px 20px 0 0",
                              border: "none",
                              boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
                            },
                          }}
                        >
                          {/* Tasks Container */}
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`!outline-transparent min-h-[120px] transition-all duration-200 ease-in-out rounded-xl ${
                              snapshot.isDraggingOver
                                ? `${theme.bg} border-2 border-dashed border-gray-200/50 p-2 transform scale-[1.01] backdrop-blur-sm`
                                : "transform scale-100"
                            }`}
                          >
                            {/* @ts-ignore */}
                            {col.tasks.map((task, idx) => {
                              <DragableTaskCard task={task}
                                                col = {col}
                                                idx = {idx}
                                                theme = {theme}
                                                isDragging = {isDragging}
                                                setSelectedTask= {setSelectedTask}
                                                setEditingTaskId={setEditingTaskId}
                                                setShowFormTask={setShowFormTask}
                              />
                            })}
                            {provided.placeholder}

                            {/* Add Task Button */}
                            {colIdx === 0 && (
                              <Button
                                block
                                icon={<PlusOutlined />}
                                className="group/btn relative h-8 sm:h-10 !border-2 !border-dashed !border-white/40 hover:!border-white/70 !bg-transparent hover:!bg-white/20 !text-white hover:!text-white !font-semibold !rounded-xl !mt-3 transition-all duration-200 transform hover:scale-[1.01] backdrop-blur-sm"
                                onClick={() => {
                                  setSelectedTask(null);
                                  setEditingTaskId(null);
                                  setShowFormTask(true);
                                }}
                              >
                                <span className="relative z-10 flex items-center gap-2 text-xs sm:text-sm">
                                  Thêm thẻ mới
                                </span>
                                <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200"></div>
                              </Button>
                            )}
                          </div>
                        </Card>
                      </div>
                    )}
                  </Droppable>
                </Col>
              );
            })}
          </Row>
        </DragDropContext>
      </div>

      <FormTask
        open={showFormTask}
        onCancel={() => {
          setShowFormTask(false);
          // setEditingTaskId(null);
          // setSelectedTask(null);
        }}
        taskId={editingTaskId || undefined}
        workspaceId={workspaceId}
        initialValues={selectedTask}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmModal.visible}
        onCancel={handleDeleteCancel}
        footer={null}
        title={null}
        width="400px"
        centered
        className="custom-modal"
      >
        <div className="text-center p-6">
          {/* Warning Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Xác nhận xóa task
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Bạn có chắc chắn muốn xóa task{" "}
            <span className="font-semibold text-gray-900">
              "{deleteConfirmModal.taskTitle}"
            </span>
            ? Hành động này không thể hoàn tác.
          </p>

          {/* Buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleDeleteCancel}
              className="px-6 py-2 h-10 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all duration-200"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              loading={deleteTaskMutation.isPending}
              danger
              className="px-6 py-2 h-10 rounded-lg bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600 text-white font-semibold transition-all duration-200"
            >
              Xóa task
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .animate-pulse {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Style cho task không thể kéo thả */
        .task-card[data-rbd-draggable-id] {
          transition: all 0.2s ease;
        }
        
        .task-card[data-rbd-draggable-id]:hover {
          transform: none !important;
        }
        
        /* Style đặc biệt cho cột khoán thưởng */
        .reward-column .task-card {
          position: relative;
        }
        
        .reward-column .task-card::before {
          content: "🔒";
          position: absolute;
          top: -8px;
          left: -8px;
          background: #8b5cf6;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          z-index: 10;
        }

        /* Mobile responsive improvements */
        @media (max-width: 640px) {
          .ant-row {
            margin-left: -6px !important;
            margin-right: -6px !important;
          }
          
          .ant-col {
            padding-left: 6px !important;
            padding-right: 6px !important;
          }
          
          .ant-card {
            margin-bottom: 8px;
          }
          
          .task-card {
            margin-bottom: 8px !important;
          }
        }

        /* Ensure proper scrolling on mobile */
        .overflow-x-auto {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
