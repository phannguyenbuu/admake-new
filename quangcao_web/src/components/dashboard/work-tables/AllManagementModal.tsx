import { useEffect, useState, useCallback, useContext } from "react";
import { Modal, Dropdown, Menu } from "antd";
import { Button, Stack, Box } from "@mui/material";
import { StarOutlined, PlusOutlined, MoreOutlined } from "@ant-design/icons";
import FormTask from "./FormTask";
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
import columnThemes from "./theme.json";

import WorkspaceBoard from "./work-space/WorkspaceBoard";

import "./work-space/workspace.css";
import { UpdateButtonContext } from "../../../common/hooks/useUpdateButtonTask";
import { useApiHost } from "../../../common/hooks/useApiHost";
import { getTitleByStatus } from "./Managerment";
import { Card } from "antd";
import { CardItem } from "./work-space/DragableTaskCard";
// export interface DeleteConfirmProps {
//     visible: boolean;
//     taskId: string | null;
//     taskTitle: string;
// }

const fixedColumns = [
    { id: "col-0", title: "Phân việc", type: "OPEN" },
    { id: "col-1", title: "Sản xuất", type: "IN_PROGRESS"},
    { id: "col-2", title: "Hoàn thiện", type: "DONE" },
    { id: "col-3", title: "Khoán thưởng", type: "REWARD" },
  ];


const items = [
  { key: 'status', label: 'Tiến trình' },
  { key: 'role', label: 'Phòng ban' },
];

// export function getTitleByStatus(type: string): string | undefined {
//     const col = fixedColumns.find(col => col.type === type);
//     return col ? col.title : undefined;
// }

export default function AllManagementModal() {
  // const adminMode = useCheckPermission();
  // const [refreshFormTask, setRefreshFormTask] = useState<boolean>(false);
  const [columns, setColumns] = useState<ColumnType[]>([]);
  const context = useContext(UpdateButtonContext);
  if (!context) throw new Error("UpdateButtonContext not found");
  // const { showUpdateButton, setShowUpdateButton } = context;

  
  
  const convertBoardToColumns = useCallback(
    (boardData: TasksResponse): ColumnType[] => {
      
      return fixedColumns.map((col) => ({
        ...col,
        tasks: boardData[col.type]?.tasks || [],
      }));
    },
    []
  );

  const [tasksData, setTasksData] = useState<Task[]>([]);

  const groupedTasks = tasksData.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {});


  useEffect(() => {
    async function fetchTasks() {
      const apiUrl = `${useApiHost()}/task/`;
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // thêm token nếu cần
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        setTasksData(data);
        
      } catch (error) {
        console.error('Failed to fetch tasks data:', error);
      }
    }

    fetchTasks();
  }, []);


  
  
  useEffect(() => {
    console.log('TASKS_L', tasksData);
    const groupedTasks = tasksData.reduce((acc, task) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    }, {});

    setColumns(
      fixedColumns.map((col) => ({
        ...col,
        tasks: groupedTasks[col.type] || [],
      }))
    );
  }, [tasksData]);



  useEffect(() => {
    // console.log('OK1', fixedColumns, boardData);
    console.log('Cols', columns);
  },[columns]);

  const handleStatusOk = () => {
    setStatusVisible(false);
  }





  let timer: number | undefined;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [statusVisible, setStatusVisible] = useState(false);
  const [roleVisible, setRoleVisible] = useState(false);
  const [isHover, setIsHover] = useState(false);

  const handleClose = () => {
    setAnchorEl(null);  
  const menu = {
    items,
    onClick: ({ key }: {key:string }) => {
      if (key === 'status') {
        setStatusVisible(true);
        setRoleVisible(false);
      } else {
        setRoleVisible(true);
        setStatusVisible(false);
      }
      handleClose();
    },
  };


  return (
    <>
      <Dropdown menu={menu}>
        <Box
          sx={{
            width: 120,
            height: 25,
            top: 2,
            position: 'relative',
            borderRadius: 10,
            backgroundColor: isHover
              ? 'rgba(255,255,255,0.5)'
              : 'rgba(255,255,255,0.25)',
            transition: 'background-color 1s ease',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
        >
          LỊCH TRÌNH
        </Box>
      </Dropdown>

      <Modal title="Bảng công việc" open={statusVisible} onCancel={handleStatusOk} 
        style={{minWidth:'95vw', padding: 0}} footer={null}>
        <Stack direction="row" spacing={1}>
          {columns.map((col, colIdx) => {
            const theme = columnThemes[colIdx];
            const isRewardColumn = col.type === 'REWARD';

            return (
              <Card
                key={col.id}
                style={{
                  background: `linear-gradient(135deg, ${theme.color} 0%, ${theme.color}dd 100%)`,
                  borderRadius: '20px',
                  overflow: 'hidden',
                  width: '100%',
                  boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                  height: 'fit-content'
                }}
              >
                <CardTitle title={col.title} length={col?.tasks?.length ?? 0} />

                {col.tasks.map((task, idx) => (
                  <CardStaticItem
                    key={task.id}
                    theme={theme}
                    isRewardColumn={isRewardColumn}
                    task={task}
                  />
                ))}
              </Card>
            );
          })}
        </Stack>
      </Modal>
    </>
  );
};


interface CardTitleProps {
  title: string;
  length: number;
}

export const CardTitle: React.FC<CardTitleProps> = ({ title, length }) => {
  return (
    <div className="flex items-center justify-between !text-white !text-sm font-semibold" style={{ padding: 8 }}>
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="w-2 h-2 bg-white/30 rounded-full flex-shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
        />
        <span className="truncate">{title}</span>
        <div className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold border border-white/5 flex-shrink-0">
          {length}
        </div>
      </div>
      <MoreOutlined className="cursor-pointer hover:bg-white/20 rounded-md p-1.5 transition-all duration-200 flex-shrink-0" />
    </div>
  );
};

interface CardStaticItemProps {
  isRewardColumn: boolean;
  task: Task;
  theme:any;
}

export const CardStaticItem: React.FC<CardStaticItemProps> = ({

  isRewardColumn,
  task,
  theme,
}) => {

    return (
    <div className={`task-card group/task relative mb-3 transition-all duration-200`}
      style={{
              transition: "none",
              // zIndex: 99999,
              cursor: "pointer",
              // position: "fixed",
              top: 0,
              left: 0,
              margin: 0,
              transform: "none",
              padding:1,
            }}
      onClick={()=>{
        window.location.href = `/dashboard/work-tables/${task.workspace_id}`;
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
        } "shadow-md border-gray-100/50 group-hover/task:shadow-lg group-hover/task:border-gray-200/70"
        }`}
      >
        {/* Badge task khoán thưởng đặc biệt */}
        {isRewardColumn && (
          <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
            🏆
          </div>
        )}

        <div className="space-y-1 sm:space-y-1.5">
          
          <h3
            className={`font-bold text-xs sm:text-sm line-clamp-2 transition-colors duration-150 flex-1 min-w-0 ${
              isRewardColumn ? "text-purple-800" : "text-gray-800 group-hover/task:text-gray-900"
            }`}
          >
            {task.title}
          </h3>
          <p>:: {task.workspace} ::</p>
          
          {task.description && (
            <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{task.description}</p>
          )}
          {task.reward && task.reward !== 0 && (
            <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
              <span>💰</span>
              <span className="truncate">{task.reward.toLocaleString()} VNĐ</span>
            </div>
          )}
        </div>

        {/* Task footer */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100/50">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.color }}></div>
            <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
          </div>
          <div className="text-xs text-gray-400 font-mono flex-shrink-0">#{task.id?.slice(-4)}</div>
        </div>
      </div>
    </div>
  );
}
