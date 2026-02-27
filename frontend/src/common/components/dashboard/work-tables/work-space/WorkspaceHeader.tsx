import { useEffect, useState, useCallback } from "react";
import { Row, Col, Card, Button, message, Modal, notification, DatePicker, Space, Select } from "antd";
import { StarOutlined, StarFilled, PlusOutlined, MoreOutlined, CalendarOutlined } from "@ant-design/icons";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useUser } from "../../../../common/hooks/useUser";
import { useApiHost } from "../../../../common/hooks/useApiHost";
import { useTaskContext } from "../../../../common/hooks/useTask";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface WorkspaceHeaderProps {
  workspaceData: any; // Bạn nên định nghĩa kiểu chính xác hơn
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ workspaceData }) => {
  const {currentWorkspace, workspaceId, setWorkspaces, isMobile} = useUser();
  const { 
    selectedMonth, setSelectedMonth, 
    filterDateType, setFilterDateType
  } = useTaskContext();
  
  const [pinned, setPinned] = useState<boolean>(currentWorkspace?.pinned || false);

  useEffect(()=>{
    console.log('currentWorkspace', currentWorkspace);
    setPinned(currentWorkspace?.pinned ?? false);
  },[currentWorkspace]);
  
  const generateMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const now = dayjs();
    const startDateLimit = dayjs("2025-11-01");

    let current = startDateLimit;
    while (current.isBefore(now) || current.isSame(now, "month")) {
      options.unshift({
        value: current.format("YYYY-MM"),
        label: current.format("MM/YYYY"),
      });
      current = current.add(1, "month");
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  const togglePin = async () => {
    fetch(`${useApiHost()}/workspace/${workspaceId}/pin`, {
      method: 'PUT',
      body: JSON.stringify({ id: workspaceId, pin: !pinned }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        notification.success({message:'Ghim bảng công việc thành công!'});

        setWorkspaces(prev => {
          // Tạo mảng mới với item được cập nhật pinned
          const updatedWorkspaces = prev.map(ws =>
            ws.id === currentWorkspace?.id ? { ...ws, pinned: !pinned } : ws
          );

          // Sắp xếp lại: các item pinned=true lên đầu, giữ thứ tự tương đối các item trong mỗi nhóm
          const sortedWorkspaces = [...updatedWorkspaces].sort((a, b) => {
            if (a.pinned === b.pinned) return 0; // giữ nguyên thứ tự nếu pinned giống nhau
            return a.pinned ? -1 : 1; // pinned true lên trước
          });

          return sortedWorkspaces;
        });



        return response.json(); // hoặc response.text() tùy API trả về gì
      })
      .then(data => {
        setPinned(!pinned); // cập nhật trạng thái local sau khi update thành công
      })
      .catch(error => {
        notification.error({message:'Lỗi khi cập nhật trạng thái ghim'});
      });

  };

  const handleMonthChange = (value: string | null) => {
    setSelectedMonth(value);
  };

  const handleFilterTypeChange = (value: 'start' | 'end' | 'all') => {
    setFilterDateType(value);
  };

    return (
    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-4 sm:px-6 pt-4 pb-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="group relative flex-shrink-0">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00B4B6] to-teal-500 rounded-xl blur-md opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>

            {/* Main header */}
            <div className="relative bg-gradient-to-r from-[#00B4B6] to-teal-500 rounded-xl shadow-lg px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 text-white font-bold text-base sm:text-lg border border-white/10 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                <span className="truncate max-w-[150px] sm:max-w-none">
                {/* @ts-ignore */}
                  {workspaceData?.name}
                </span>

                <span style={{fontSize:10, fontWeight:300, fontStyle:'italic'}}>
                {/* @ts-ignore */}
                  {workspaceData?.address}
                </span>
                {/* <StarOutlined className="ml-1 text-white text-base transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0" /> */}
                <Button onClick={togglePin} style={{padding: 0, background:'none', border:'none', color: 'yellow'}}>
                  {pinned ? <StarFilled /> : <StarOutlined />}
                </Button>
            </div>
            </div>

            <Space wrap className="mt-2 sm:mt-0 w-full sm:w-auto">
              <Select
                value={filterDateType}
                onChange={handleFilterTypeChange}
                className="rounded-lg shadow-sm"
                style={{ width: isMobile ? '100%' : 140 }}
              >
                <Option value="all">Tất cả</Option>
                <Option value="start">Ngày bắt đầu</Option>
                <Option value="end">Ngày hoàn thiện</Option>
              </Select>

              <Select
                value={selectedMonth}
                onChange={handleMonthChange}
                placeholder="Chọn tháng"
                className="rounded-lg shadow-sm"
                style={{ width: isMobile ? '100%' : 140 }}
              >
                <Option value="all">Tất cả tháng</Option>
                {monthOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Space>
        </div>

    </div>
    )
}



export default WorkspaceHeader;