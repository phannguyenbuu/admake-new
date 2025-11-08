import React, { useState, useEffect, useMemo, useContext } from "react";
import { Modal, Typography, Button } from "antd";
import type { Task, UserSearchProps } from "../../../@types/work-space.type";
// import { useCheckPermission } from "../../../common/hooks/checkPermission.hook";
import { useInfo } from "../../../common/hooks/info.hook";
import { useCustomerQuery, useCustomerDetail } from "../../../common/hooks/customer.hook";
import { useGetTaskById } from "../../../common/hooks/work-space.hook";
import JobInfoCard from "./task/JobInfoCard";
import JobAgentInfo from "./task/JobAgentInfo";
import JobDescription from "./task/JobDescription";
import JobTimeAndProcess from "./task/JobTimeAndProcess ";

import { useApiHost } from "../../../common/hooks/useApiHost";
// import CheckInOut from "./CheckInOut";
// import CommentSection from "./CommentSection";
import dayjs from "dayjs";
import { duration } from "@mui/material";
import { Form } from "antd";
import type { StatusType } from "./task/JobInfoCard";
import type { FormTaskDetailProps } from "../../../@types/work-space.type";
import {Stack, Box} from "@mui/material";
import type { UserList, User } from "../../../@types/user.type";
// import type { Customer, CustomerList } from "../../../@types/customer.type";
import type { Id } from "@hello-pangea/dnd";
import { UpdateButtonContext } from "../../../common/hooks/useUpdateButtonTask";
// import JobAsset from "./task/JobAsset";
import TaskHeader from "./task/FormTaskHeader";
const { Title, Text } = Typography;

import { useTaskContext } from "../../../common/hooks/useTask";
import { useUser } from "../../../common/hooks/useUser";


const cellStyle = {maxWidth:400, minWidth:400};


// // TaskComments.tsx
// function TaskComments({ taskId, disabled }: { taskId?: string; disabled: boolean }) {
//   return <CommentSection taskId={taskId || ""} disabled={disabled} />;
// }

interface FormTaskProps {
  open: boolean;
  onCancel: () => void;
  taskId?: string;
  // workspaceId: string;
  onSuccess: () => void;
  initialValues: Task | null;
  users: UserSearchProps[];
  // customers: UserSearchProps[];
  // updateTaskStatus: (taskId: string, newStatus: string) => Promise<void>;
  // showUpdateButtonMode: number;
  // setShowUpdateButton: (value: number) => void;
}

export default function FormTask({ 
  open, onCancel, taskId, onSuccess,
  users, 
 }: FormTaskProps) {
  const {workspaceId} = useUser();


  const context = useContext(UpdateButtonContext);
  if (!context) throw new Error("UpdateButtonContext not found");
  const { setShowUpdateButton } = context;

  const { data:sourceTaskDetail, isLoading, isError, error } = useGetTaskById(taskId || "");
  const [salaryType, setSalaryType] = useState<string>('');
  
  // const [currentStatus, setCurrentStatus] = useState<StatusType>("OPEN");
  const [form] = Form.useForm();

  const [customerSearch, setCustomerSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [customerSelected, setCustomerSelected] = useState<UserSearchProps | null>(null);
  const [userSelected, setUserSelected] = useState<UserSearchProps | null>(null);

  const [userList, setUserList] = useState<UserItemProps[]>([]);
  // const [customerObj, setCustomerObj] = useState<UserItemProps | null>(null);

  const {taskDetail, setTaskDetail} = useTaskContext();

  useEffect(()=>{
    if(!sourceTaskDetail || !sourceTaskDetail?.assign_ids)
      return;

    setTaskDetail(sourceTaskDetail);

    // setCurrentStatus(taskDetail?.status ?? '');
    // setCustomerObj(taskDetail?.customer_id);
    setUserList(sourceTaskDetail?.assign_ids);

    // console.log('taskDetail', taskDetail.id);

    if(sourceTaskDetail?.status === "DONE" && sourceTaskDetail?.check_reward)
      setShowUpdateButton(1);
    else if(sourceTaskDetail?.status === "REWARD")
      setShowUpdateButton(2);
    else
      setShowUpdateButton(0);

  },[sourceTaskDetail]);

  const onUserDelete = (idToDelete: string | null) => {
    const newList = userList.filter(user => user.id !== idToDelete);
    setUserList(newList);
  };

  useEffect(() => {
    if (!userSelected)
      return;

    const user = userSelected;
    const newUsers = [...userList];

    
    const exists = userList.some(user => user.id === user.name);
    !exists && user && newUsers.push({id:user?.user_id, name:user?.fullName ?? null});
      
    setUserList(newUsers);
  }, [userSelected]);

  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      const values = await form.validateFields();

      const preparedValues = {
        ...values,
        start_time: values.start_time ? values.start_time.format('YYYY-MM-DD') : null,
        end_time: values.end_time ? values.end_time.format('YYYY-MM-DD') : null,
      };
      
      

      // Gọi API PUT gửi dữ liệu cập nhật
      if(taskId)
      {
        const jsonString = JSON.stringify(preparedValues);
        console.log("Update_JSON_values", jsonString);

        const response = await fetch(`${useApiHost()}/task/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: jsonString,
        });
      

        if (!response.ok) 
          throw new Error("Cập nhật công việc thất bại");
        else
        {
          const data = await response.json();
          console.log("Cập nhật công việc thành công!", taskId, data);
        }
    } else {
        preparedValues["status"] = "OPEN";
        const jsonString = JSON.stringify(preparedValues);
        console.log("New_JSON_values", jsonString);

        const response = await fetch(`${useApiHost()}/task/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: jsonString,
        });
      
        if (!response.ok) 
          throw new Error("Tạo công việc thất bại");
        else
          console.log("Tạo công việc thành công!");
    }
      
      // Xử lý thành công, có thể gọi onSuccess hoặc đóng modal
      if(onSuccess)
        onSuccess();
    } catch (error) {
      console.error("Update error:", error);
      // Hiện thông báo lỗi nếu cần
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      // customer_id: customerObj?.id || null,
      assign_ids: userList ? userList.map(user => user.id) : [],
    });
  }, [userList, form]);

  useEffect(() => {
    setUserSearch("");
    setUserSelected(null);
    setCustomerSearch("");
    setCustomerSelected(null);

    if(!taskId)
    {
      // setCustomerObj(null);
      setUserList([]);
    }

    form.setFieldValue("workspace_id", workspaceId);
  },[taskId, workspaceId]);

  return (
    <Modal open={open} onCancel={onCancel} footer={null} centered width={900}>
        <TaskHeader onUpdate={handleUpdate} onSuccess={onSuccess}/>
      
        <Form form={form} style={cellStyle}>
          <Stack spacing={1}>
            
            
            {/* Thông tin khách hàng */}
            <Form.Item name="workspace_id" initialValue={workspaceId} hidden>
            </Form.Item>

            {/* <Form.Item name="customer_id" initialValue={customerObj?.id} hidden> */}
            {/* </Form.Item> */}

            {/* Lưu assign_ids ẩn */}
            <Form.Item name="assign_ids" initialValue={userList?.map(user => user.id)} hidden>
            </Form.Item>
            
            <Stack direction="row" spacing = {2}>
              {/* <Stack>
                <JobAgentInfo form={form} mode="customer" 
                  users={customers}
                  setSearchValue={setCustomerSearch} 
                  searchValue={customerSearch} 
                  setSelectedCustomer={setCustomerSelected} 
                  selectedCustomer={customerSelected}/>

                 {customerObj && <UserItem user={customerObj} onDelete={()=> setCustomerObj(null)}/>}
              </Stack> */}
              <JobInfoCard taskDetail={taskDetail ?? null} currentStatus={taskDetail?.status ?? ''} form={form} />

              <Stack style={cellStyle}>
                <JobAgentInfo 
                  form={form} 
                  mode="user"
                  users={users}
                  searchValue={userSearch} 
                  setSearchValue={setUserSearch}
                  selectedCustomer={userSelected} 
                  setSelectedCustomer={setUserSelected} 
                />
                 
                 {userList && userList.map((el)=> 
                    <UserItem user={el} onDelete={onUserDelete}/>)}
              </Stack>
            </Stack>

            <Stack direction="row" spacing = {5}>
              <JobDescription taskDetail={taskDetail ?? null} form={form} salaryType={salaryType}/>
              {/* Thời gian và quy trình */}
              <JobTimeAndProcess form={form} 
                taskDetail={taskDetail} 
                salaryType={salaryType}
                setSalaryType={setSalaryType}/>
            </Stack>

            {/* Vật liệu */}
            {/* <MaterialInfo taskDetail={taskDetail ?? null}/> */}

            
          </Stack>
          {/* Nhân sự */}
      </Form>
    </Modal>
  );
}

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
        ×
      </button>
    </Stack>
  );
};