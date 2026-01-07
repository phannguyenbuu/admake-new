import { useEffect, useState, useCallback, useContext } from "react";
import { Modal, Dropdown, Card, Button, notification } from "antd";
import { Stack, Box, Typography, Avatar } from "@mui/material";
import { MoreOutlined, StarFilled } from "@ant-design/icons";
import columnThemes from "./theme.json";
import { UpdateButtonContext } from "../../../common/hooks/useUpdateButtonTask";
import { useApiHost, useApiStatic } from "../../../common/hooks/useApiHost";
import { useUser } from "../../../common/hooks/useUser";
import { SearchOutlined } from "@ant-design/icons";
import { Input as AntdInput, Menu } from "antd";
import type { ColumnType, Task, TasksResponse } from "../../../@types/work-space.type";
import type { WorkSpace } from "../../../@types/work-space.type";
import { useTaskContext } from "../../../common/hooks/useTask";
import "./css/css.css";
import "./work-space/workspace.css";
import { fixedColumns } from "./Managerment";
import { DateFormPicker } from "./task/JobTimeAndProcess ";
import { Form } from "antd";
import dayjs, { Dayjs } from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const items = [
  { key: "status", label: "Tiến trình" },
  { key: "role", label: "Thùng rác" },
];

export default function AllTasksModal() {
  const [clearTrashVisible, setClearTrashVisible] = useState(false);

  const [mode, setMode] = useState<"status" | "trash">("status");

  const [columns, setColumns] = useState<ColumnType[]>([]);
  const context = useContext(UpdateButtonContext);
  const {userLeadId, workspaces, isMobile} = useUser();
  const [searchText, setSearchText] = useState("");

  if (!context) throw new Error("UpdateButtonContext not found");

  const [tasksData, setTasksData] = useState<Task[]>([]);
  // const [statusVisible, setStatusVisible] = useState(false);
  // const [roleVisible, setRoleVisible] = useState(false);
  const { refetchTasks } = useTaskContext();

  const [visible, setVisible] = useState(false);
  

  const [filteredItems, setFilteredItems] = useState<Task[]>([]);
  const [isHover, setIsHover] = useState(false);

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [form] = Form.useForm();
  
  const restoreTask = async (taskId: string) => {
    try {
      const res = await fetch(
        `${useApiHost()}/task/restore/${taskId}`,
        { method: "PUT" }
      );

      if (!res.ok) throw new Error("Restore failed");

      notification.success({message:"Khôi phục công việc thành công"});

      refetchTasks();
      fetchTasks("trash");
      
    } catch (err) {
      console.error(err);
      notification.error({message:"Khôi phục công việc thất bại"});
    }
  };


  const handleSearch = (value: string, startDate?: Dayjs | null, endDate?: Dayjs | null) => {
    setSearchText(value);
    let filtered = tasksData;

    if (value) {
      filtered = filtered.filter((el) =>
        el?.title?.toLowerCase().includes(value.toLowerCase()) 
      ||el?.workspace?.toLowerCase().includes(value.toLowerCase())
      ||el?.description?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(filtered);
    }

    if (startDate) {
      filtered = filtered.filter(el => el.start_time && dayjs(el.start_time).isSameOrAfter(startDate, 'day'));
    }
    
    if (endDate) {
      filtered = filtered.filter(el => el.end_time && dayjs(el.end_time).isSameOrBefore(endDate, 'day'));
    }

    setFilteredItems(filtered);
  };


  async function fetchTasks(type: "status" | "trash") {
    const apiUrl =
      type === "trash"
      ? `${useApiHost()}/task/trash/inlead/${userLeadId}`
      : `${useApiHost()}/task/inlead/${userLeadId}`;

    try {
      const response = await fetch(apiUrl, {method: "GET"});
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      // console.log(data);
      setTasksData(data);
      setFilteredItems(data);
    } catch (error) {
      console.error("Failed to fetch tasks data:", error);
    }
  }

  const handleClearTrash = async () => {
    try {
      const res = await fetch(
        `${useApiHost()}/task/trash/clear/inlead/${userLeadId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Clear trash failed");

      notification.success({
        message: "Đã xóa trống thùng rác",
      });

      setClearTrashVisible(false);

      // 🔥 reload UI
      fetchTasks("trash");
      refetchTasks(); // cập nhật workspace board

    } catch (err) {
      notification.error({
        message: "Xóa thất bại",
        description: String(err),
      });
    }
  };


  useEffect(() => {
    if (!visible) return;
    fetchTasks(mode);
  }, [visible, mode]);



  useEffect(() => {
    // console.log(filteredItems);
    if(!filteredItems) return;

    const groupedTasks = filteredItems.reduce((acc: any, task) => {
      if(!task?.status) return [];
        
      if (!acc[task?.status]) acc[task?.status] = [];
      acc[task?.status].push(task);
      return acc;
    }, {});

    setColumns(
      fixedColumns.map((col) => ({
        ...col,
        tasks: groupedTasks[col.type] || [],
      }))
    );
  }, [filteredItems]);

  const handleStatusOk = () => setVisible(false);

  const menu = {
    items,
    onClick: ({ key }: { key: string }) => {
      if (key === "status") {
        setMode("status");
      } else {
        setMode("trash");
      }
      setVisible(true);
    },
  };


  return (
    <>
      <Dropdown menu={menu}>
    
       
        <Box
          sx={{
            width: 100,
            height: 25,
            top: 0,
            padding: 1.8,
            position: "relative",
            borderRadius: 10,
            backgroundColor: isHover ? "rgba(255,255,255,0.5)" : "#00B4B5",
            transition: "background-color 1s ease",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            whiteSpace:'nowrap',
            color:'#fff',
            fontWeight: 500,
            fontSize: 12
          }}
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
        >
          LỊCH TRÌNH
        </Box>
      </Dropdown>

      <Modal
        title={mode === "trash" ? "THÙNG RÁC CÔNG VIỆC" : "BẢNG CÔNG VIỆC TỔNG HỢP"}
        open={visible}
        onCancel={handleStatusOk}
        style={{ minWidth: isMobile ? "320vw" : "95vw", padding: 0 }}
        footer={null}
        closable={false}
      >
         {mode === "trash" ?
            <Button
              danger
              type="primary"
              style={{ marginLeft: 8 }}
              onClick={() => setClearTrashVisible(true)}
            >
              Xóa trống thùng rác
            </Button>
          :

        <Form>

         

          <Stack direction={isMobile ? "column" : "row"} spacing={2}
            style={{paddingBottom: 2}}>
            <AntdInput
              allowClear  
              placeholder="Tìm kiếm công việc"
              value={searchText}
              prefix={<SearchOutlined className="!text-cyan-500 !text-xs sm:!text-sm" />}  // Biểu tượng search
              onChange={(e) => handleSearch(e.target.value)}
              style={{ marginBottom: 8,width: 300 }}
            />

            { false &&
            <Stack style={{marginTop:isMobile?0:-20}} direction="row" spacing={2}>
              <DateFormPicker
                mode="start_time"
                title="Từ ngày"
                timeValue={startDate}
                onChange={(date) => {
                  setStartDate(date);
                  handleSearch(searchText, date, endDate);
                }}
                form={form}
              />
            
              <DateFormPicker
                mode="end_time"
                title="Đến ngày"
                timeValue={endDate}
                onChange={(date) => {
                  setEndDate(date);
                  handleSearch(searchText, startDate, date);
                }}
                form={form}
              />
            </Stack>}
          </Stack>
        </Form>
        }

        <button
          onClick={handleStatusOk}
          style={{
            position: "fixed",
            top: 64,
            right: isMobile ? 10 : 60,
            zIndex: 1000,
            background: "transparent",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer"
          }}
        >
          ×
        </button>
        
        <Stack direction="row" spacing={1} style={{marginTop: 5}}>
          {columns.map((col, colIdx) => {
            const theme = columnThemes[colIdx];
            const isRewardColumn = col.type === "REWARD";

            return (
              <Card
                key={col.id}
                style={{
                  background: `linear-gradient(135deg, ${theme.color} 0%, ${theme.color}dd 100%)`,
                  borderRadius: 10,
                  overflow: "hidden",
                  width: "100%",
                  boxShadow: "0 0 10px rgba(0,0,0,0.2)",
                  height: "fit-content",
                  padding:0,
                }}
                
              >
                <CardTitle title={col.title} length={col?.tasks?.length ?? 0} mode={mode}/>
                {col?.tasks?.map((task) => (
                  <CardStaticItem
                    key={task.id}
                    theme={theme}
                    isRewardColumn={isRewardColumn}
                    task={task}
                    mode={mode}
                    restoreTask={restoreTask}
                  />
                ))}
              </Card>
            );
          })}
        </Stack>
      </Modal>

      <Modal
  open={clearTrashVisible}
  title="⚠️ XÓA VĨNH VIỄN"
  okText="Xóa vĩnh viễn"
  okButtonProps={{ danger: true }}
  cancelText="Hủy"
  onCancel={() => setClearTrashVisible(false)}
  onOk={handleClearTrash}
>
  <p>
    Tất cả công việc trong <b>Thùng rác</b> sẽ bị{" "}
    <b style={{ color: "red" }}>xóa vĩnh viễn</b> và{" "}
    <b>không thể khôi phục</b>.
  </p>
  <p>Bạn có chắc chắn không?</p>
</Modal>

    </>
  );
}

// === Components phụ ===

interface CardTitleProps {
  title: string;
  length: number;
  mode:string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ title, length, mode }) => (
  <div className="flex items-center justify-between !text-white !text-sm font-semibold" style={{ padding: 8 }}>
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-2 h-2 bg-white/30 rounded-full flex-shrink-0" />
      <span className="truncate">{title}</span>
      <div className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold border border-white/5 flex-shrink-0">
        {length}
      </div>
    </div>
    <MoreOutlined className="cursor-pointer hover:bg-white/20 rounded-md p-1.5 transition-all duration-200 flex-shrink-0" />
  </div>
);

interface CardStaticItemProps {
  isRewardColumn: boolean;
  task: Task;
  theme: any;
  mode:string;
  restoreTask: (id:string) => void;
}

export const CardStaticItem: React.FC<CardStaticItemProps> = ({
  isRewardColumn,
  task,
  theme,
  mode,
  restoreTask
}) => 
  (
  <div
    className="task-card group/task relative mb-3 transition-all duration-200"
    style={{ transition: "none", cursor: "pointer", padding: 1 }}
    onClick={() => {
      if (mode === "trash") {
        Modal.confirm({
          title: "Khôi phục công việc",
          content: "Bạn có chắc muốn khôi phục task này không?",
          okText: "Khôi phục",
          cancelText: "Hủy",
          okButtonProps: { danger: false },
          onOk: () => restoreTask(task.id),
        });
        return;
      }
      window.location.href = `/dashboard/work-tables/${task.workspace_id}`;
    }}
  >
    <div
      className="absolute inset-0 rounded-xl blur opacity-0 group-hover/task:opacity-20 transition-opacity duration-200"
      style={{ background: `linear-gradient(135deg, ${theme.color}40, ${theme.color}20)` }}
    ></div>

    <div
      className={`relative bg-white rounded-xl p-2 sm:p-3 border transition-all duration-300 

      shadow-md border-gray-100/50 group-hover/task:shadow-lg group-hover/task:border-gray-200/70`
    }
    >
      {isRewardColumn && (
        <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
          🏆
        </div>
      )}


      <Stack direction="row">
                  {task?.icon && 
                  <Avatar
                      src={`${useApiStatic()}/${task.icon}`}
                      alt="Task icon"
                      sx={{ width: 100, height: 70, borderRadius: 0}}
                  />}

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

          {task?.rate && task?.rate > 0 &&
            <div className="text-xs text-gray-400 font-mono flex-shrink-0">
              
              {[...Array(task.rate)].map((_, index) => (
                <StarFilled key={index} style={{color:'orange'}}/>
              ))}
            </div>}
        </div>
      </Stack>
    </div>
  </div>
);
