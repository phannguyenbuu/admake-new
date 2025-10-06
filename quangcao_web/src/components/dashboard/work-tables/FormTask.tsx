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
import type { Id } from "@hello-pangea/dnd";

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
  onUpdate: () => void;
}

// TaskHeader.tsx
function TaskHeader({ taskDetail, isLoading, onUpdate  }: TaskHeaderProps) {
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
          <Button type="primary" loading={isLoading} onClick={onUpdate}>
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
<<<<<<< HEAD
  const [customerSelected, setCustomerSelected] = useState<Customer | User | null>(null);
  const [userSelected, setUserSelected] = useState<Customer | User | null>(null);

  const [userList, setUserList] = useState<UserItemProps[]>([]);
  const [customerObj, setCustomerObj] = useState<UserItemProps | null>(null);

  useEffect(()=>{
    if(!taskDetail || !taskDetail?.assign_ids)
      return;
    setCurrentStatus(taskDetail?.status ?? '');
    setCustomerObj(taskDetail?.customer_id);
    setUserList(taskDetail?.assign_ids);
  },[taskDetail]);
=======
  const [customerSelected, setCustomerSelected] = useState<Customer | null>(null);
  const [userSelected, setUserSelected] = useState<User | null>(null);

  const [userList, setUserList] = useState<string[]>([]);
  const [customerObj, setCustomerObj] = useState<string | null>(null);

  useEffect(()=>{
    if(!taskDetail || !taskDetail?.assign_ids)
      return;
    setCurrentStatus(taskDetail?.status ?? '');
    setCustomerObj(taskDetail?.customer_id);
    setUserList(taskDetail?.assign_ids);
  },[taskDetail]);
  //   useEffect(() => {
  //     // console.log('!!!API', API_HOST);
  
  //     fetch(`${useApiHost()}/user/?limit=1000`)
  //       .then((res) => res.json())
  //       .then((data: UserList) => 
  //         {
  //           console.log('UserData', data.data);
  //           setUserList(data.data);
  //         })
  //       .catch((error) => console.error("Failed to load group data", error));


  //     fetch(`${useApiHost()}/customer/?limit=1000`)
  //       .then((res) => res.json())
  //       .then((data: CustomerList) => 
  //         {
  //           console.log('CustomerData', data.data);
  //           setCustomerList(data.data);
  //         })
  //       .catch((error) => console.error("Failed to load group data", error));
  //   }, []);

// Tương tự với options nếu cần

  // Các useEffect, handlers, filteredCustomers, duration tính toán tại đây...

  const onUserDelete = (txtToDelete: string) => {
    const newList = userList.filter(txt => txt !== txtToDelete);
    setUserList(newList);
  };

  useEffect(()=>{
    setCustomerObj(customerSelected?.fullName ?? null);
  },[customerSelected]);

  useEffect(() => {
    if (!userSelected)
      return;

    const user_name = userSelected?.fullName;
    const newUsers = [...userList];

    
    const exists = userList.some(user => user === user_name);
    !exists && user_name && newUsers.push(user_name);
      
    setUserList(newUsers);
  }, [userSelected]);
>>>>>>> origin/main

  const onUserDelete = (idToDelete: string | null) => {
    const newList = userList.filter(user => user.id !== idToDelete);
    setUserList(newList);
  };

  useEffect(()=>{
    setCustomerObj({id: customerSelected?.id ?? null, name:customerSelected?.fullName ?? null});
  },[customerSelected]);

  useEffect(() => {
    if (!userSelected)
      return;

    const user = userSelected;
    const newUsers = [...userList];

    
    const exists = userList.some(user => user.id === user.name);
    !exists && user && newUsers.push({id:user?.id, name:user?.fullName ?? null});
      
    setUserList(newUsers);
  }, [userSelected]);

  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      // Lấy dữ liệu hiện tại từ form
      const values = await form.validateFields();

      console.log("new_task_values", values);

      // Gọi API PUT gửi dữ liệu cập nhật
      const response = await fetch(`${useApiHost()}/task/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Cập nhật thất bại");

      // Xử lý thành công, có thể gọi onSuccess hoặc đóng modal
      onCancel();
    } catch (error) {
      console.error("Update error:", error);
      // Hiện thông báo lỗi nếu cần
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal open={open} onCancel={onCancel} footer={null} centered width={900}>
      <Stack direction="row" spacing = {2}>
        <TaskHeader taskDetail={taskDetail} isLoading={isLoading} onUpdate={handleUpdate}/>
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
<<<<<<< HEAD
                 {customerObj && <UserItem user={customerObj} onDelete={()=> setCustomerObj(null)}/>}
=======
                 {customerObj && <UserItem txt={customerObj} onDelete={()=> setCustomerObj(null)}/>}
>>>>>>> origin/main
              </Stack>

              <Stack>
                <JobCustomerInfo 
                  form={form} 
                  mode="user"
                  searchValue={userSearch} setSearchValue={setUserSearch}
                  selectedCustomer={userSelected} setSelectedCustomer={setUserSelected} 
                />
                 
<<<<<<< HEAD
                 {userList && userList.map((el)=> 
                    <UserItem user={el} onDelete={onUserDelete}/>)}
=======
                 {userList && userList.map((el:string)=> 
                    <UserItem txt={el} onDelete={onUserDelete}/>)}
>>>>>>> origin/main
              </Stack>
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

<<<<<<< HEAD
interface UserItemProps {
  name: string | null;
  id: string | null;
}

interface UserItemSubProps {
  user: UserItemProps;
  onDelete: (id: string | null) => void;
}

const UserItem: React.FC<UserItemSubProps> = ({user,onDelete}) => {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography>{user.name}</Typography>
      <button
        onClick={() => onDelete && onDelete(user.id)}
        style={{ color: 'red', cursor: "pointer", background: "transparent", border: "none", fontSize: "16px" }}
        aria-label={`Xóa ${user.name}`}
        type="button"
      >
        ❌
=======


interface UserItemProps {
  txt: string;
  onDelete: (txt: string) => void;
}

const UserItem: React.FC<UserItemProps> = ({ txt, onDelete }) => {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography>{txt}</Typography>
      <button
        onClick={() => onDelete(txt)}
        style={{ cursor: "pointer", background: "transparent", border: "none", fontSize: "16px" }}
        aria-label={`Xóa ${txt}`}
        type="button"
      >
        &times;
>>>>>>> origin/main
      </button>
    </Stack>
  );
};