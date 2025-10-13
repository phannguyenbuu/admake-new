import { useEffect, useState, useCallback } from "react";
import { Row, Col, Card, Button, message, Modal } from "antd";
import { StarOutlined, PlusOutlined, MoreOutlined } from "@ant-design/icons";
import type { ColumnType } from "../../../../@types/work-space.type";
import DragableTaskCard from "./DragableTaskCard";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import columnThemes from "../theme.json";
import type { Task } from "../../../../@types/work-space.type";

interface WorkspaceBoardProps {
  columns: ColumnType[];
  onDragStart?: (initial: any) => void;   // Kiểu kiểu sự kiện tùy library drag-drop
  onDragUpdate?: (update: any) => void;
  onDragEnd: (result: any) => void;
//   adminMode?: boolean;
  isDragging?: boolean;
  setSelectedTask: (task: Task | null) => void;
  setEditingTaskId: (id: string | null) => void;
  setShowFormTask: (show: boolean) => void;
}

const WorkspaceBoard: React.FC<WorkspaceBoardProps> = 
    ({ onDragStart, onDragUpdate, 
        onDragEnd, isDragging,columns,
        setSelectedTask, setEditingTaskId, setShowFormTask, }) => {
    return (
    <div className="relative z-10 px-4 sm:px-6 pt-3">
            <DragDropContext
            onDragStart={onDragStart}
            onDragUpdate={onDragUpdate}
            onDragEnd={onDragEnd}
            // sensors={adminMode ? undefined : []}
            >
            <Row gutter={[12, 12]} wrap={false} className="pb-6 overflow-x-auto">
                {columns.map((col, colIdx) => {
                // Column color themes
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
                                // @ts-ignore
                                Board: {
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
                                {col.tasks.map((task, idx) => 
                                <DragableTaskCard task = {task}
                                                    col = {col}
                                                    idx = {idx}
                                                    theme = {theme}
                                                    // @ts-ignore
                                                    isDragging = {isDragging}
                                                    // @ts-ignore
                                                    setSelectedTask= {setSelectedTask}
                                                    // @ts-ignore
                                                    setEditingTaskId={setEditingTaskId}
                                                    // @ts-ignore
                                                    setShowFormTask={setShowFormTask}
                                />
                                )}
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
)}

export default WorkspaceBoard;