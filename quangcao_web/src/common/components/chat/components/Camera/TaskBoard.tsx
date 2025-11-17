import React, { useState, useEffect, useMemo } from "react";
import Modal from "antd/es/modal/Modal";
import JobTimeAndProcess from "../../../dashboard/work-tables/task/JobTimeAndProcess ";
import { Stack, Box, Button, Checkbox, Typography } from "@mui/material";
import { useMutation } from '@tanstack/react-query';
import { useUser } from "../../../../common/hooks/useUser";
import type { Task } from "../../../../@types/work-space.type";
import { useApiHost } from "../../../../common/hooks/useApiHost";
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import CommentIcon from '@mui/icons-material/Comment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { getTitleByStatus } from "../../../dashboard/work-tables/Managerment";
import { notification } from "antd";
import { useTaskContext } from "../../../../common/hooks/useTask";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import JobDescription from "../../../dashboard/work-tables/task/JobDescription";
import { Form, Input } from "antd";
import JobAsset from "../../../dashboard/work-tables/task/JobAsset";
import { Tabs } from 'antd';
import type { NotifyProps } from "../../../../@types/notify.type";

const { TextArea } = Input;

const fetchTaskByUser = async (userId: string): Promise<Task[]> => {
  const response = await fetch(`${useApiHost()}/task/${userId}/by_user`);
  if (!response.ok) {
    throw new Error(`Error fetching tasks for user ${userId}`);
  }

  const json = await response.json();
  console.log('taskk', json.data);
  return json.data;
};

const useTaskByUserMutation = () => {
  return useMutation<Task[], Error, string>({
    mutationFn: fetchTaskByUser,
  });
};

interface TaskBoardProps {
  // mode: { adminMode: boolean; userMode: boolean };
  fullName? : string;
  userId?: string;
  open?: boolean;
  onCancel: () => void;
}

const TaskBoard = ({ userId,fullName, open, onCancel }: TaskBoardProps) => {
  const [activeKey, setActiveKey] = useState('task');
    const { mutate, data, isPending, isError, error } = useTaskByUserMutation();
    const {isMobile,notifyAdmin,generateDatetimeId} = useUser();
    const {taskDetail,setTaskDetail} = useTaskContext();

    const handleFinishWarning = () => {
      const notify : NotifyProps = {
          id: generateDatetimeId(),
          type: 'task',
          description: fullName,
          text: `Công việc <${taskDetail?.workspace}/${taskDetail?.title}> hoàn thành. Vui lòng chuyển trạng thái !`,
          target: `/dashboard/work-tables/${taskDetail?.workspace_id}`,
      };

      notifyAdmin(notify);
    } 

    useEffect(() => {
        if (userId) {
          mutate(userId); // userId đã chắc chắn là string, không undefined
        }
    },[]);

    const [currentPage, setCurrentPage] = React.useState(1);
    const pageSize = 1; // mỗi trang 1 item

    const paginatedData = data && data.length > 0
      ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      : [];

    const totalPages = data ? Math.ceil(data.length / pageSize) : 1;

    useEffect(()=>{
      // console.log('Data', data);
      if (data && data.length > 0) {
        setTaskDetail(data[currentPage - 1] || data[0]);
      }
    },[currentPage, data]);

    const btnStyle = {color:"#fff", padding:10, 
      paddingLeft:30, paddingRight:30, 
      backgroundColor:'#00B5B4',
      whiteSpace:'nowrap', borderRadius:10};

    return (
    <Modal open={open} onCancel={onCancel} footer={null} width={900}>
        
    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <button
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
      >
        <ArrowBackIosNewIcon fontSize="small" />
      </button>
      <span>Trang {currentPage} / {totalPages}</span>
      <button
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
      >
        <ArrowForwardIosIcon fontSize="small" />
      </button>
    </div>

      <Stack spacing = {5} py={2} alignItems="flex-start" justifyContent="flex-start"
        style={{boxSizing:'border-box'}}>
        
        {paginatedData.length > 0 ? paginatedData.map(el =>
      <Stack key={el.id} spacing={1} style={{
        background: '#ddd',
        padding: 10,
        borderRadius: 20,
        width: isMobile ? 320 : ''
      }}>
        <Stack direction="row" spacing={1}>
          <Button style={btnStyle} onClick={handleFinishWarning}>
            <ArrowForwardIcon />
            {getTitleByStatus(el.status)}
          </Button>

          <Typography style={{
            marginTop: 8,
            fontStyle: 'italic',
            color: '#00B5B4',
            fontSize: 10,
            fontWeight: 500
          }}>
            {el?.workspace ?? ''}
          </Typography>
        </Stack>
        <TextArea
          readOnly
          value={el?.description}
          rows={3}
          showCount
          maxLength={1000}
          placeholder="Mô tả chi tiết về công việc cần thực hiện..."
          className="!rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !shadow-sm !resize-none !text-xs sm:!text-sm h-40"
        />
        <JobTimeAndProcess key={el.id} form={null}/>

        <Tabs
          activeKey={activeKey}
          onChange={key => setActiveKey(key)}
          items={[
            {
              key: 'task',
              label: 'Tài Liệu',
              children: <JobAsset title="Tài liệu" type="task" readOnly = {true}/>,
            },
            {
              key: 'comments',
              label: 'Bình luận',
              children: <JobAsset title="Bình luận cho mọi người" type="comment" />,
            },
          ]}
        />
        {/* <JobAsset key="task-assets" title='Tài liệu' type="task"/> */}
      </Stack>
    ) : (
      <Typography style={{ fontStyle: 'italic', textAlign: 'center' }}>Chưa có nhiệm vụ</Typography>
    )}

      </Stack>
    </Modal>
    )
}

export default TaskBoard;
