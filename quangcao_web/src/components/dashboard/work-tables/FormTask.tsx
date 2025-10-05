import React, { useState, useEffect, useMemo } from "react";
import { Modal, Typography, Button } from "antd";
import type { Task } from "../../../@types/work-space.type";
import { useCheckPermission } from "../../../common/hooks/checkPermission.hook";
import { useInfo } from "../../../common/hooks/info.hook";
import { useCustomerQuery, useCustomerDetail } from "../../../common/hooks/customer.hook";
import { useGetTaskById } from "../../../common/hooks/work-space.hook";
import JobInfoCard from "./task/JobInfoCard";
import JobCustomerInfo from "./task/JobCustomerInfo";
import JobDescription from "./task/JobDescription";
import JobTimeAndProcess from "./task/JobTimeAndProcess ";
import MaterialInfo from "./task/MaterialInfo";
import { useApiHost } from "../../../common/hooks/useApiHost";
import CheckInOut from "./CheckInOut";
import CommentSection from "./CommentSection";
import dayjs from "dayjs";
import { duration } from "@mui/material";
import { Form } from "antd";
import type { StatusType } from "./task/JobInfoCard";
import type { FormTaskDetailProps } from "../../../@types/work-space.type";
import {Stack, Box} from "@mui/material";
import type { UserList, User } from "../../../@types/user.type";
import type { Customer, CustomerList } from "../../../@types/customer.type";

const { Title, Text } = Typography;

interface FormTaskProps {
  open: boolean;
  onCancel: () => void;
  taskId?: string;
  workspaceId: string;
  onSuccess?: () => void;
  initialValues: Task | null;
}

interface TaskHeaderProps {
  // mode: { adminMode: boolean; userMode: boolean };
  taskDetail: Task;
  isLoading: boolean;
}

// TaskHeader.tsx
function TaskHeader({ taskDetail, isLoading }: TaskHeaderProps) {
  return (
    <Stack direction="row" spacing={5}>
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="icon-container">
          {/* Icon component here */}
        </div>
        <div>
          <Title level={5}>{taskDetail ? "Chỉnh sửa công việc" : "Tạo công việc mới"}</Title>
        </div>
      </div>

      <Stack direction="row" spacing={1}>
        {taskDetail?.status !== "DONE" && taskDetail?.status !== "REWARD" && (
          <Button type="primary" loading={isLoading}>
            ✅ Cập nhật
          </Button>
        )}
        {taskDetail?.status === "DONE" && (
          <Button type="primary" loading={isLoading} /* onClick nghiệm thu */>
            🏆 Nghiệm Thu
          </Button>
        )}
        <Button disabled={!isLoading}>
          ❌ Đóng
        </Button>
      </Stack>
    </Stack>
  );
}

// TaskComments.tsx
function TaskComments({ taskId, disabled }: { taskId?: string; disabled: boolean }) {
  return <CommentSection taskId={taskId || ""} disabled={disabled} />;
}

export default function FormTask({ open, onCancel, taskId, workspaceId }: FormTaskProps) {
  const { data:taskDetail, isLoading, isError, error } = useGetTaskById(taskId || "");
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

  const [customerSearch, setCustomerSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [customerSelected, setCustomerSelected] = useState<Customer | null>(null);
  const [userSelected, setUserSelected] = useState<Customer | null>(null);

  const [userList, setUserList] = useState<User[]>([]);
  const [customerList, setCustomerList] = useState<User[]>([]);

    useEffect(() => {
      // console.log('!!!API', API_HOST);
  
      fetch(`${useApiHost()}/user/?limit=1000`)
        .then((res) => res.json())
        .then((data: UserList) => 
          {
            console.log('UserData', data.data);
            setUserList(data.data);
          })
        .catch((error) => console.error("Failed to load group data", error));


      fetch(`${useApiHost()}/customer/?limit=1000`)
        .then((res) => res.json())
        .then((data: UserList) => 
          {
            console.log('UserData', data.data);
            setCustomerList(data.data);
          })
        .catch((error) => console.error("Failed to load group data", error));
    }, []);

// Tương tự với options nếu cần

  // Các useEffect, handlers, filteredCustomers, duration tính toán tại đây...
  useEffect(()=>{
    setCurrentStatus(taskDetail?.status ?? '');
    console.log('task_selected', taskDetail?.assign_ids);
  },[taskDetail]);

  return (
    <Modal open={open} onCancel={onCancel} footer={null} centered width={900}>
      <Stack direction="row" spacing = {2}>
        <TaskHeader taskDetail={taskDetail} isLoading={isLoading}/>
      </Stack>
        <Form form={form} style={{maxHeight:'80vh', overflowY:'auto'}}>
          <Stack spacing={1}>
            <JobInfoCard taskDetail={taskDetail} currentStatus={currentStatus} form={form} />
            
            {/* Thông tin khách hàng */}
            
            <Stack direction="row" spacing = {2}>
              <Stack>
                <JobCustomerInfo form={form} mode="customer" 
                  setSearchValue={setCustomerSearch} searchValue={customerSearch} 
                  setSelectedCustomer={setCustomerSelected} selectedCustomer={customerSelected}/>  
                  {taskDetail?.assign_ids && taskDetail?.assign_ids.map((el:string)=> {
                    const user = userList.find(user => user.id === el);
                    return <Typography>{user?.fullName}</Typography>
                  })}
              </Stack>
              <JobCustomerInfo form={form} mode="user"
                searchValue={userSearch} setSearchValue={setUserSearch}
                selectedCustomer={userSelected} setSelectedCustomer={setUserSelected}
              />
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
    </Modal>
  );
}
