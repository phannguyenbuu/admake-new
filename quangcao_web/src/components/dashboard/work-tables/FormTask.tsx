import React, { useState, useEffect, useMemo } from "react";
import { Modal, Typography, Button } from "antd";
import type { Task } from "../../../@types/work-space.type";
import type { Customer } from "../../../@types/customer.type";
import { useCheckPermission } from "../../../common/hooks/checkPermission.hook";
import { useInfo } from "../../../common/hooks/info.hook";
import { useCustomerQuery, useCustomerDetail } from "../../../common/hooks/customer.hook";
import { useGetTaskById } from "../../../common/hooks/work-space.hook";
import JobInfoCard from "./task/JobInfoCard";
import JobCustomerInfo from "./task/JobCustomerInfo";
import JobDescription from "./task/JobDescription";
import JobTimeAndProcess from "./task/JobTimeAndProcess ";
import MaterialInfo from "./task/MaterialInfo";
import CheckInOut from "./CheckInOut";
import CommentSection from "./CommentSection";
import dayjs from "dayjs";
import { duration } from "@mui/material";
import { Form } from "antd";
import type { StatusType } from "./task/JobInfoCard";
import type { FormTaskDetailProps } from "../../../@types/work-space.type";
import {Stack, Box} from "@mui/material";

const { Title, Text } = Typography;

interface FormTaskProps {
  open: boolean;
  onCancel: () => void;
  taskId?: string;
  workspaceId: string;
  onSuccess?: () => void;
  initialValues: Task | null;
}

// TaskHeader.tsx
function TaskHeader({ taskDetail }: { taskDetail: Task | null }) {
  // const adminMode = useCheckPermission();
  // const { data: info } = useInfo();

  // const mode = useMemo(() => ({
  //   adminMode,
  //   userMode: taskDetail?.assignIds.includes(info?.id || "") || false,
  // }), [adminMode, info, taskDetail]);

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="icon-container">
        {/* Icon component here */}
      </div>
      <div>
        <Title level={5}>{taskDetail ? "Chỉnh sửa công việc" : "Tạo công việc mới"}</Title>
        <Text>
          {taskDetail?.customerId || "Quản lý công việc và nhân sự"}
        </Text>
      </div>
    </div>
  );
}

// TaskDetails.tsx
function TaskDetails({ taskDetail, workspaceId }: FormTaskDetailProps) {
  const [material, setMaterial] = useState<{ selectedMaterials: any[], materialQuantities: { [key: string]: number } }>({
    selectedMaterials: [],
    materialQuantities: {},
  });
  const [users, setUsers] = useState<{ selectedUsers: string[] }>({ selectedUsers: [] });

  const [customer, setCustomer] = useState<{
    searchValue: string;
    selectedId: string | null;
    selectedCustomer: Customer | null;
    isTyping: boolean;
  }>({ searchValue: "", selectedId: null, selectedCustomer: null, isTyping: false });

  const [currentStatus, setCurrentStatus] = useState<StatusType>("OPEN");
  const { data: customers } = useCustomerQuery({ limit: 50, search: customer.searchValue });
  const { data: customerDetail } = useCustomerDetail(customer.selectedId || "");
  const [form] = Form.useForm();
  // Các useEffect, handlers, filteredCustomers, duration tính toán tại đây...
  useEffect(()=>{
    setCurrentStatus(taskDetail?.status ?? '');
  },[taskDetail]);

  return (
    <Form form={form} style={{maxHeight:'80vh', overflowY:'auto'}}>
      <Stack spacing={1}>
        <JobInfoCard taskDetail={taskDetail} currentStatus={currentStatus} form={form} />
        
        {/* Thông tin khách hàng */}
        

        <Stack direction="row" spacing = {2}>
          <JobCustomerInfo form={form} mode="customer"/>  
          <JobCustomerInfo form={form} mode="user"/>
        </Stack>

        <Stack direction="row" spacing = {2}>
          <JobDescription taskDetail={taskDetail}/>
          {/* Thời gian và quy trình */}
          <JobTimeAndProcess form={form} taskDetail={taskDetail}/>
        </Stack>

        {/* Vật liệu */}
        <MaterialInfo taskDetail={taskDetail}/>
      </Stack>
      {/* Nhân sự */}
      
    </Form>
  );
}

// TaskAttendance.tsx
function TaskAttendance({ taskId, userMode }: { taskId?: string; userMode: boolean }) {
  if (!userMode) return null;
  return <CheckInOut taskId={taskId || ""} />;
}

// TaskComments.tsx
function TaskComments({ taskId, disabled }: { taskId?: string; disabled: boolean }) {
  return <CommentSection taskId={taskId || ""} disabled={disabled} />;
}

// TaskFooter.tsx
interface TaskFooterProps {
  mode: { adminMode: boolean; userMode: boolean };
  currentStatus: string;
  isPending: boolean;
  onSubmit: () => void;
  onClose: () => void;
  isEditMode: boolean;
}

function TaskFooter({ mode, currentStatus, isPending, onSubmit, onClose, isEditMode }: TaskFooterProps) {
  return (
    <div className="footer-actions">
      {mode.adminMode && currentStatus !== "DONE" && currentStatus !== "REWARD" && (
        <Button type="primary" loading={isPending} onClick={onSubmit}>
          {isEditMode ? "✅ Cập nhật công việc" : "🚀 Tạo công việc"}
        </Button>
      )}
      {mode.adminMode && currentStatus === "DONE" && (
        <Button type="primary" loading={isPending} /* onClick nghiệm thu */>
          🏆 Nghiệm Thu
        </Button>
      )}
      <Button onClick={onClose} disabled={isPending}>
        ❌ Đóng
      </Button>
    </div>
  );
}


export default function FormTask({ open, onCancel, taskId, workspaceId }: FormTaskProps) {
  // logic component

  
  const { data:taskDetail, isLoading, isError, error } = useGetTaskById(taskId || "");
  // // const [mode, setMode] = useState<{ adminMode: boolean; userMode: boolean }>({ adminMode: false, userMode: false });
  // // const [currentStatus, setCurrentStatus] = useState<string>("OPEN");
  // // const [isPending, setIsPending] = useState<boolean>(false);
  // // const isEditMode = !!props.taskId;

  // // Có thể đặt các useEffect cập nhật mode, currentStatus

  // // Xử lý các hàm handleFinish, handleCancel...

  // if (isLoading) return <div>Đang tải...</div>;
  // if (isError) return <div>Lỗi: {error?.message}</div>;
  // if (!taskDetail) return <div>Không có dữ liệu</div>;

  // useEffect(() => {
  //   console.log('XTaskId',props.taskId,props.open, taskDetail);
  // },[taskDetail]);

  return (
    <Modal open={open} onCancel={onCancel} footer={null} centered width={900}>
      <TaskHeader taskDetail={taskDetail} />
      <TaskDetails taskDetail={taskDetail} workspaceId={workspaceId} />
      {/* <TaskAttendance taskId={props.taskId} userMode={mode.userMode} />
      <TaskComments taskId={props.taskId} disabled={!mode.userMode} />
      <TaskFooter
        mode={mode}
        currentStatus={currentStatus}
        isPending={isPending}
        onSubmit={() => {}}
        onClose={props.onCancel}
        isEditMode={isEditMode}
      /> */}
    </Modal>
  );
}
