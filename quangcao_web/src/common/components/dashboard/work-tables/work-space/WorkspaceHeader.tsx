import { useEffect, useState, useCallback } from "react";
import { Row, Col, Card, Button, message, Modal } from "antd";
import { StarOutlined, PlusOutlined, MoreOutlined } from "@ant-design/icons";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

interface WorkspaceHeaderProps {
  workspaceData: any; // Bạn nên định nghĩa kiểu chính xác hơn
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ workspaceData }) => {
    return (
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

                <span style={{fontSize:10, fontWeight:300, fontStyle:'italic'}}>
                {/* @ts-ignore */}
                  {workspaceData?.address}
                </span>
                <StarOutlined className="ml-1 text-white text-base transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0" />
            </div>
            </div>
        </div>

    </div>
    )
}

export default WorkspaceHeader;