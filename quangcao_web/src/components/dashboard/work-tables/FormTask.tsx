import React, { useState, useEffect, useMemo } from "react";
import { Modal, Typography, Button } from "antd";
import type { Task, UserSearchProps } from "../../../@types/work-space.type";
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
// import CheckInOut from "./CheckInOut";
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


interface TaskHeaderProps {
  // mode: { adminMode: boolean; userMode: boolean };
  taskDetail: Task;
  isLoading: boolean;
  onSuccess: () => void;
  onUpdate: () => void;
  updateTaskStatus: (taskId: string, newStatus: string) => Promise<void>;
  showUpdateButtonMode: number;
  
}

// TaskHeader.tsx
function TaskHeader({ taskDetail, onSuccess, updateTaskStatus, 
  isLoading, onUpdate,  showUpdateButtonMode }: TaskHeaderProps) {
  
  console.log('Task:', taskDetail);

  const handleReward = async () => {
    // console.log("A_Task", taskDetail,updateTaskStatus);
    if (!taskDetail) return;
    if (!updateTaskStatus) return;

    try {
      await updateTaskStatus(taskDetail.id, "REWARD");
      console.log("Nghiệm thu thành công!", taskDetail);
    } catch (error) {
      console.error("Lỗi nghiệm thu:", error);
    }

    if(onSuccess)
      onSuccess();
  };


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
        {showUpdateButtonMode === 0 && 
          <Button type="primary" loading={isLoading} onClick={onUpdate}>
            ✅ Cập nhật
          </Button>
        }

        {showUpdateButtonMode === 1 && 
          <Button type="primary" loading={isLoading} onClick={handleReward}>
            🏆 Nghiệm Thu
          </Button>
        }
        
      </Stack>
    </Stack>
  );
}

// // TaskComments.tsx
// function TaskComments({ taskId, disabled }: { taskId?: string; disabled: boolean }) {
//   return <CommentSection taskId={taskId || ""} disabled={disabled} />;
// }

interface FormTaskProps {
  open: boolean;
  onCancel: () => void;
  taskId?: string;
  workspaceId: string;
  onSuccess: () => void;
  initialValues: Task | null;
  users: UserSearchProps[];
  customers: UserSearchProps[];
  updateTaskStatus: (taskId: string, newStatus: string) => Promise<void>;
}

export default function FormTask({ 
  updateTaskStatus, open, onCancel, taskId, onSuccess,
  workspaceId, users, customers }: FormTaskProps) {
  const [showUpdateButtonMode, setShowUpdateButtonMode] = useState<number>(0);
  const { data:taskDetail, isLoading, isError, error } = useGetTaskById(taskId || "");
  // const [material, setMaterial] = useState<{ selectedMaterials: any[], materialQuantities: { [key: string]: number } }>({
  //   selectedMaterials: [],
  //   materialQuantities: {},
  // });
  // const [users, setUsers] = useState<{ selectedUsers: string[] }>({ selectedUsers: [] });

  // const [customer, setCustomer] = useState<{
  //   searchValue: string;
  //   selectedId: string | null;
  //   selectedCustomer: Customer | null;
  //   isTyping: boolean;
  // }>({ searchValue: "", selectedId: null, selectedCustomer: null, isTyping: false });

  const [currentStatus, setCurrentStatus] = useState<StatusType>("OPEN");
  // const { data: customers } = useCustomerQuery({ limit: 50, search: customer.searchValue });
  // const { data: customerDetail } = useCustomerDetail(customer.selectedId || "");
  const [form] = Form.useForm();

  const [customerSearch, setCustomerSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [customerSelected, setCustomerSelected] = useState<UserSearchProps | null>(null);
  const [userSelected, setUserSelected] = useState<UserSearchProps | null>(null);

  const [userList, setUserList] = useState<UserItemProps[]>([]);
  const [customerObj, setCustomerObj] = useState<UserItemProps | null>(null);

  useEffect(()=>{
    if(!taskDetail || !taskDetail?.assign_ids)
      return;
    setCurrentStatus(taskDetail?.status ?? '');
    setCustomerObj(taskDetail?.customer_id);
    setUserList(taskDetail?.assign_ids);

    console.log('taskDetail', taskDetail.id);

    if(taskDetail?.status === "DONE" && taskDetail?.check_reward)
      setShowUpdateButtonMode(1);
    else if(taskDetail?.status === "REWARD")
      setShowUpdateButtonMode(2);
    else
      setShowUpdateButtonMode(0);

  },[taskDetail]);

  const onUserDelete = (idToDelete: string | null) => {
    const newList = userList.filter(user => user.id !== idToDelete);
    setUserList(newList);
  };

  useEffect(()=>{
    setCustomerObj({id: customerSelected?.user_id ?? null, name:customerSelected?.fullName ?? null});
  },[customerSelected]);

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
      // Lấy dữ liệu hiện tại từ form
      // console.log("Old_task_values", 
      //             form.getFieldValue("start_time"),
      //             form.getFieldValue("end_time"));
      const values = await form.validateFields();

      // console.log("New_task_values", values);
      

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
      customer_id: customerObj?.id || null,
      assign_ids: userList ? userList.map(user => user.id) : [],
    });
  }, [customerObj, userList, form]);

  useEffect(() => {
    setUserSearch("");
    setUserSelected(null);
    setCustomerSearch("");
    setCustomerSelected(null);

    if(!taskId)
    {
      setCustomerObj(null);
      setUserList([]);
    }

    form.setFieldValue("workspace_id", workspaceId);
  },[taskId, workspaceId]);

  return (
    <Modal open={open} onCancel={onCancel} footer={null} centered width={900}>
      <Stack direction="row" spacing = {2}>
        <TaskHeader updateTaskStatus={updateTaskStatus} 
                taskDetail={taskDetail} 
                isLoading={isLoading}
                onUpdate={handleUpdate}  
                onSuccess={onSuccess}
                
                showUpdateButtonMode={showUpdateButtonMode}
                />
      </Stack>
      
        <Form form={form} style={{maxHeight:'80vh', overflowY:'auto'}}>
          <Stack spacing={1}>
            <JobInfoCard taskDetail={taskDetail ?? null} currentStatus={currentStatus} form={form} />
            
            {/* Thông tin khách hàng */}
            <Form.Item name="workspace_id" initialValue={workspaceId} hidden>
            </Form.Item>

            <Form.Item name="customer_id" initialValue={customerObj?.id} hidden>
            </Form.Item>

            {/* Lưu assign_ids ẩn */}
            <Form.Item name="assign_ids" initialValue={userList?.map(user => user.id)} hidden>
            </Form.Item>
            
            <Stack direction="row" spacing = {2}>
              <Stack>
                <JobCustomerInfo form={form} mode="customer" 
                  users={customers}
                  setSearchValue={setCustomerSearch} 
                  searchValue={customerSearch} 
                  setSelectedCustomer={setCustomerSelected} 
                  selectedCustomer={customerSelected}/>

                 {customerObj && <UserItem user={customerObj} onDelete={()=> setCustomerObj(null)}/>}
              </Stack>

              <Stack>
                <JobCustomerInfo 
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

            <Stack direction="row" spacing = {2}>
              <JobDescription taskDetail={taskDetail ?? null} form={form}/>
              {/* Thời gian và quy trình */}
              <JobTimeAndProcess form={form} taskDetail={taskDetail ?? null}/>
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
        ❌
      </button>
    </Stack>
  );
};