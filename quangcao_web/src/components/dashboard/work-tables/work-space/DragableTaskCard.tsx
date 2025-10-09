import { useEffect, useState, useCallback } from "react";
import { Row, Col, Card, Button, message, Modal } from "antd";
import { StarOutlined, PlusOutlined, MoreOutlined } from "@ant-design/icons";
import FormTask from "../FormTask";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

import type {
  ColumnType,
  ManagermentBoardProps,
  Task,
  TasksResponse,
} from "../../../../@types/work-space.type";
import {
  useWorkSpaceQueryTaskById,
  useUpdateTaskStatusById,
  useDeleteTask,
  useWorkSpaceQueryById,
} from "../../../../common/hooks/work-space.hook";
import { useCheckPermission } from "../../../../common/hooks/checkPermission.hook";

interface DragableTaskCardProps {
  task: any;
  col: any;
  idx: any;
  theme: any;
  isDragging: boolean;
  setSelectedTask: React.Dispatch<React.SetStateAction<Task | null>>;
  setEditingTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  setShowFormTask: React.Dispatch<React.SetStateAction<boolean>>;
}

// Component nhận props theo kiểu object 1 lần
const DragableTaskCard: React.FC<DragableTaskCardProps> = ({
  task,
  col,
  idx,
  theme,
  isDragging,
  setSelectedTask,
  setEditingTaskId,
  setShowFormTask,
}) => {
    const isRewardColumn = col.type === "REWARD";

    return (
    <Draggable
        key={task.id}
        draggableId={task.id}
        index={idx}
        isDragDisabled={isRewardColumn} // Vô hiệu hóa drag cho task trong cột khoán thưởng
    >
        {(provided, snapshot) => (
        <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`task-card group/task relative mb-3 transition-all duration-200 ${
            isRewardColumn
                ? "cursor-not-allowed opacity-90" // Style cho task không thể kéo
                : "cursor-pointer"
            } ${
            snapshot.isDragging
                ? "shadow-xl scale-105 ring-2 ring-[#00B4B6]/30 z-50 border-2 border-[#00B4B6]/50 rotate-1"
                : "shadow-md hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5"
            } ${
            !snapshot.isDragging
                ? "drag-item-reset"
                : ""
            }`}
            style={{
            ...provided.draggableProps.style,
            ...(snapshot.isDragging && {
                // Đảm bảo phần tử theo sát con trỏ chuột
                transition: "none",
                zIndex: 99999,
                cursor: "grabbing",
                position: "fixed",
                top: 0,
                left: 0,
                margin: 0,
                // Sử dụng transform từ drag library để theo sát con trỏ
                transform:
                provided.draggableProps.style
                    ?.transform || "none",
            }),
            }}
            onClick={() => {
            // Chỉ cho phép click khi không đang drag và không trong quá trình transition
            if (
                !snapshot.isDragging &&
                !isDragging
            ) {
                setSelectedTask(task);
                setEditingTaskId(task.id);
                setShowFormTask(true);
            }
            }}
        >
            {/* Task glow effect */}
            <div
            className="absolute inset-0 rounded-xl blur opacity-0 group-hover/task:opacity-20 transition-opacity duration-200"
            style={{
                background: `linear-gradient(135deg, ${theme.color}40, ${theme.color}20)`,
            }}
            ></div>

            {/* Task card content */}
            <div
            className={`relative bg-white rounded-xl p-2 sm:p-3 border transition-all duration-300 ${
                isRewardColumn
                ? "border-purple-200 bg-purple-50/30" // Style đặc biệt cho cột khoán thưởng
                : ""
            } ${
                snapshot.isDragging
                ? "shadow-xl border-[#00B4B6]/50 bg-white/95 backdrop-blur-sm"
                : "shadow-md border-gray-100/50 group-hover/task:shadow-lg group-hover/task:border-gray-200/70"
            }`}
            >
            {/* Badge cho task đã hoàn thành khoán thưởng */}
            {isRewardColumn && (
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                🏆
                </div>
            )}

            <div className="space-y-1 sm:space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                <h3
                    className={`font-bold text-xs sm:text-sm line-clamp-2 transition-colors duration-150 flex-1 min-w-0 ${
                    isRewardColumn
                        ? "text-purple-800"
                        : "text-gray-800 group-hover/task:text-gray-900"
                    }`}
                >
                    {task.title}
                </h3>
                
                </div>
                {task.description && (
                <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                    {task.description}
                </p>
                )}
                {task.reward && (
                <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                    <span>💰</span>
                    <span className="truncate">
                    {task.reward.toLocaleString()}{" "}
                    VNĐ
                    </span>
                </div>
                )}
            </div>

            {/* Task footer */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100/50">
                <div className="flex gap-1">
                <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                    backgroundColor: theme.color,
                    }}
                ></div>
                <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
                </div>
                <div className="text-xs text-gray-400 font-mono flex-shrink-0">
                #{task.id?.slice(-4)}
                </div>
            </div>
            </div>
        </div>
        )}
    </Draggable>
    );
}

export default DragableTaskCard;