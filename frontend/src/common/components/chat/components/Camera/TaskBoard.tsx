import React, { useState, useEffect, useMemo } from "react";
import Modal from "antd/es/modal/Modal";
import { CheckCircleOutlined } from "@ant-design/icons";
import JobTimeAndProcess from "../../../dashboard/work-tables/task/JobTimeAndProcess ";
import { Stack, Box, Button, Checkbox, Typography, Avatar } from "@mui/material";
import { useMutation } from '@tanstack/react-query';
import { useUser } from "../../../../common/hooks/useUser";
import { getPrimaryTaskIcon, type Task } from "../../../../@types/work-space.type";
import { useApiHost, useApiStatic } from "../../../../common/hooks/useApiHost";
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
import MaterialsTab from "../../../dashboard/work-tables/task/MaterialsTab";
import { Tabs } from 'antd';
import ImageViewerModal from "../../../modal/ImageViewerModal";
import type { NotifyProps } from "../../../../@types/notify.type";
import { CenterBox } from "../commons/TitlePanel";
const { TextArea } = Input;

const htmlToPlainText = (html: string): string => {
  if (!html) return "";
  let text = html;
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<p[^>]*>/gi, "");
  text = text.replace(/<div[^>]*>/gi, "");
  text = text.replace(/<\/?[^>]+(>|$)/g, "");
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"');
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
};

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
  onCancel?: () => void;
  isDirect?: boolean;
}

const TaskBoard = ({ userId, fullName, open, onCancel, isDirect = false }: TaskBoardProps) => {
  const [activeKey, setActiveKey] = useState('task');
    const [iconPreviewOpen, setIconPreviewOpen] = useState(false);
    const { mutate, data, isPending, isError, error } = useTaskByUserMutation();
    const {isMobile,notifyAdmin,generateDatetimeId} = useUser();
    const {taskDetail,setTaskDetail} = useTaskContext();
    const staticBase = useApiStatic();
    const primaryIcon = getPrimaryTaskIcon(taskDetail?.icon);

    const buildStaticUrl = (path?: string | null) => {
      if (!path) return "";
      if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
        return path;
      }
      if (path.startsWith("/")) {
        return path;
      }
      let finalPath = path;
      if (finalPath.startsWith("thumb_") && !finalPath.startsWith("thumbs/")) {
        finalPath = `thumbs/${finalPath}`;
      }
      return `${staticBase}/${finalPath}`;
    };

    const getOriginalImagePath = (path?: string | null) => {
      if (!path) return "";
      if (path.startsWith("thumbs/thumb_")) return path.replace("thumbs/thumb_", "");
      if (path.startsWith("thumb_")) return path.replace("thumb_", "");
      return path;
    };

    const [isFinishing, setIsFinishing] = useState(false);

    const handleCompleteTask = async (task: Task) => {
      if (!task?.id) return;
      setIsFinishing(true);
      try {
        const currentUserId = userId || JSON.parse(localStorage.getItem('Admake-User-Access') || '{}')?.user_id;
        const res = await fetch(`${useApiHost()}/task/${task.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'REWARD',
            user_id: currentUserId,
          }),
        });

        if (!res.ok) {
          throw new Error('Cập nhật trạng thái thất bại');
        }

        setTaskDetail(prev => prev ? { ...prev, status: 'REWARD' } : prev);
        task.status = 'REWARD';

        const notify: NotifyProps = {
          id: generateDatetimeId(),
          user_id: currentUserId,
          type: 'task',
          description: task.workspace_id || taskDetail?.workspace_id,
          text: `<${task.workspace || taskDetail?.workspace}/${task.title || taskDetail?.title}> hoàn thành. Đã chuyển sang Hoàn thiện!`,
          target: `/work-tables/${task.workspace_id || taskDetail?.workspace_id}`,
        };
        notifyAdmin(notify);

        notification.success({
          message: 'Hoàn thiện nhiệm vụ!',
          description: 'Đã chuyển sang cột Hoàn thiện và gửi thông báo tới ban quản trị.',
        });

        if (userId) {
          mutate(userId);
        }
      } catch (err: any) {
        notification.error({
          message: 'Lỗi chuyển trạng thái',
          description: err.message || 'Không thể cập nhật trạng thái lúc này',
        });
      } finally {
        setIsFinishing(false);
      }
    }; 

    useEffect(() => {
        if (userId) {
          mutate(userId); // userId đã chắc chắn là string, không undefined
        }
    }, [userId]);

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

    useEffect(() => {
      setIconPreviewOpen(false);
    }, [taskDetail?.id]);

    const btnStyle = {color:"#fff", padding:10, 
      paddingLeft:30, paddingRight:30, 
      backgroundColor:'#00B5B4',
      whiteSpace:'nowrap', borderRadius:10};

    const boardContent = (
      <CenterBox>
        
    <div style={{ marginTop: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {!isDirect && (
        <button
          type="button"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#0891b2',
            backgroundColor: '#ecfeff',
            border: '1px solid #a5f3fc',
            borderRadius: '16px',
            padding: '4px 12px',
            cursor: 'pointer',
          }}
          onClick={() => {
            window.location.href = taskDetail?.workspace_id
              ? `/work-tables/${taskDetail.workspace_id}`
              : "/work-tables";
          }}
        >
          Xem đầy đủ Bảng công việc (Nhiều cột) ➔
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => setCurrentPage(prev => (prev === 1 ? totalPages : prev - 1))}
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </button>
        <span>Trang {currentPage} / {totalPages}</span>
        <button
          onClick={() => setCurrentPage(prev => (prev === totalPages ? 1 : prev + 1))}
        >
          <ArrowForwardIosIcon fontSize="small" />
        </button>
      </div>
    </div>
  
      <Stack spacing = {5} py={2} alignItems="flex-start" justifyContent="flex-start"
        style={{boxSizing:'border-box'}}>
        
        {paginatedData.length > 0 ? paginatedData.map(el =>
      <Stack key={el.id} spacing={1} style={{
        background: '#ddd',
        padding: 10,
        borderRadius: 20,
        width: isMobile ? 340 : ''
      }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {/* Badge trạng thái */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '5px 12px',
            borderRadius: '8px',
            backgroundColor: el?.status === 'REWARD' ? '#dcfce7' : '#e0f2fe',
            color: el?.status === 'REWARD' ? '#166534' : '#0369a1',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            {getTitleByStatus(el?.status ?? '') || el?.status}
          </div>

          {/* Nút Hoàn thiện (chuyển sang cột REWARD) */}
          {el?.status !== 'REWARD' ? (
            <Button
              variant="contained"
              disabled={isFinishing}
              onClick={() => handleCompleteTask(el)}
              sx={{
                borderRadius: '8px',
                backgroundColor: '#10b981',
                '&:hover': { backgroundColor: '#059669' },
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'none',
                px: 2,
                py: 0.6,
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
              }}
            >
              <CheckCircleOutlined style={{ marginRight: 6, fontSize: '14px' }} />
              Hoàn thiện
            </Button>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 12px',
              borderRadius: '8px',
              backgroundColor: '#10b981',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
            }}>
              ✓ Đã hoàn thiện
            </div>
          )}

          {el.workspace && (
            <Stack direction="column" sx={{ ml: 1 }}>
              <Typography style={{
                marginTop: 4,
                fontStyle: 'italic',
                color: '#00B5B4',
                fontSize: 10,
                fontWeight: 500
              }}>
                {el?.workspace}
              </Typography>

              <Typography style={{
                marginTop: 2,
                color: '#1e293b',
                fontSize: 12,
                fontWeight: 700
              }}>
                {el?.title || taskDetail?.title}
              </Typography>
            </Stack>
          )}
        </Stack>
        <TextArea
          readOnly
          value={htmlToPlainText(el?.description ?? "")}
          rows={3}
          showCount
          maxLength={1000}
          placeholder="Mô tả chi tiết về công việc cần thực hiện..."
          className="!rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !shadow-sm !resize-none !text-xs sm:!text-sm h-40"
        />

        {primaryIcon &&
          <button
            type="button"
            onClick={() => setIconPreviewOpen(true)}
            style={{ border: "none", padding: 0, background: "transparent", cursor: "zoom-in" }}
          >
            <Avatar
              src={buildStaticUrl(primaryIcon)}
              alt="Task icon"
              sx={{ width: 100, height: 70, borderRadius: 0 }}
            />
          </button>}
            
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
              key: 'materials',
              label: 'Vật liệu',
              children: (
                <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <MaterialsTab userId={userId} />
                </div>
              ),
            },
            {
              key: 'comments',
              label: 'Bình luận',
              children: <JobAsset title="Bình luận cho mọi người" type="comment" targetUserId={userId} senderName={fullName} instantSave={true} />,
            },
          ]}
        />
        {/* <JobAsset key="task-assets" title='Tài liệu' type="task"/> */}
      </Stack>
    ) : (
      <Typography style={{ fontStyle: 'italic', textAlign: 'center' }}>Chưa có nhiệm vụ</Typography>
    )}

      </Stack>
      <ImageViewerModal
        open={iconPreviewOpen}
        onCancel={() => setIconPreviewOpen(false)}
        imageUrl={primaryIcon ? buildStaticUrl(getOriginalImagePath(primaryIcon)) : null}
        title="Xem biểu tượng công việc"
      />
      </CenterBox>
    );

    if (isDirect) {
      return (
        <div style={{ width: "100%", maxWidth: 460, margin: "0 auto", padding: "0 8px 32px" }}>
          {boardContent}
        </div>
      );
    }

    return (
      <Modal open={open} onCancel={onCancel} footer={null}>
        {boardContent}
      </Modal>
    );
}

export default TaskBoard;
