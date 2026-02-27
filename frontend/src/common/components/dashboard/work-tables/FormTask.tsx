import React, { useState, useEffect, useMemo, useContext } from "react";
import { Modal, Typography, Button, notification } from "antd";
import type { Task, UserSearchProps } from "../../../@types/work-space.type";
import JobInfoCard from "./task/JobInfoCard";
import JobAgentInfo from "./task/JobAgentInfo";
import JobDescription from "./task/JobDescription";
import JobTimeAndProcess from "./task/JobTimeAndProcess ";
import { fixedColumns } from "./Managerment";
import type { ZipUserSearchProps } from "../../../@types/work-space.type";
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
  onSuccess: () => void;
  initialValues: Task | null;
  users: UserSearchProps[];
  currentColumn: number;
}

export default function FormTask({ open, onCancel, onSuccess, users, currentColumn}: FormTaskProps) {
  const {workspaceId} = useUser();
  const {taskDetail, setTaskDetail} = useTaskContext();

  const context = useContext(UpdateButtonContext);
  if (!context) throw new Error("UpdateButtonContext not found");
  const { setShowUpdateButton } = context;

  // const { data:sourceTaskDetail, isLoading, isError, error } = useGetTaskById(taskDetail.id || "");
  const [form] = Form.useForm();

  const [customerSearch, setCustomerSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [customerSelected, setCustomerSelected] = useState<UserSearchProps | null>(null);
  const [userSelected, setUserSelected] = useState<UserSearchProps | null>(null);
  
  const {isMobile, tmpTaskCreatedAssets, tmpTaskCreatedMessages,
    setTmpTaskCreatedAssets, setTmpTaskCreatedMessages} = useUser();

  const [userList, setUserList] = useState<ZipUserSearchProps[]>([]);
  
  
  useEffect(()=>{
    console.log("Open", taskDetail);
  }, [open]);
  
  useEffect(()=>{
    if(!taskDetail || !taskDetail?.assign_ids)
      return;

    setUserList(taskDetail.assign_ids); // cast nếu cần
    
    if(taskDetail?.status === "DONE" && taskDetail?.check_reward)
      setShowUpdateButton(1);
    else if(taskDetail?.status === "REWARD")
      setShowUpdateButton(2);
    else
      setShowUpdateButton(0);

  },[taskDetail]);

  const onUserDelete = (idToDelete: string | null) => {
    const newList = userList.filter(user => user.id !== idToDelete);
    setUserList(newList);
  };

  useEffect(() => {
    if (!userSelected) return;

    setUserList(prevUserList => {
      // Kiểm tra userSelected đã tồn tại theo user_id chưa
      const exists = prevUserList.some(user => user.id === userSelected.user_id);

      // Nếu chưa có thì thêm mới, nếu có thì giữ nguyên
      if (!exists) {
        return [
          ...prevUserList,
          {
            id: userSelected.user_id, // làm đúng key user_id theo interface
            name: userSelected.fullName ?? null, // nếu bạn muốn đặt tên chuẩn theo interface
            // role: userSelected.role ?? '',
            // phone: userSelected.phone ?? '',
            // workAddress: userSelected.workAddress ?? ''
          }
        ];
      }
      return prevUserList;
    });
  }, [userSelected]);


  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    const isCreateMethod = !taskDetail;

    try {
      setIsUpdating(true);
      const values = await form.validateFields();

      console.log("values", form.getFieldsValue());

      const preparedValues = {
        ...values,
        start_time: values.start_time ? values.start_time.format('YYYY-MM-DD') : null,
        end_time: values.end_time ? values.end_time.format('YYYY-MM-DD') : null,
      };

      // Gọi API PUT gửi dữ liệu cập nhật
      if(taskDetail)
      {
        const jsonString = JSON.stringify(preparedValues);
        console.log("Update_JSON_values", jsonString);

        const response = await fetch(`${useApiHost()}/task/${taskDetail.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: jsonString,
        });

        if (!response.ok) 
          throw new Error("Cập nhật công việc thất bại");
        else
        {
          const data = await response.json();
          notification.success({"message":"Cập nhật công việc thành công!"});
        }
    } else {
        preparedValues["status"] = fixedColumns[currentColumn].type;
        preparedValues["assets"] = [...tmpTaskCreatedAssets, ...tmpTaskCreatedMessages];

        setTmpTaskCreatedAssets([]);
        setTmpTaskCreatedMessages([]);

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
        {
          const data = await response.json();
          console.log(data);
          setTaskDetail(data);
          notification.success({"message":"Tạo công việc thành công!"});
        }
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

    if(!taskDetail?.id)
      setUserList([]);

    form.setFieldValue("workspace_id", workspaceId);
  },[taskDetail, workspaceId]);

  return (
    <Modal open={open} onCancel={onCancel} footer={null} width={900} style={{height: isMobile? '120vh':''}}>
        <TaskHeader onUpdate={handleUpdate} onSuccess={onSuccess}/>
      
        <Form form={form} style={{overflowX:'hidden', maxHeight:'90vh', overflowY:'auto'}}>
          {/* <Stack spacing={1}> */}
            <Form.Item name="workspace_id" initialValue={workspaceId} hidden>
            </Form.Item>

            <Form.Item name="assign_ids" initialValue={userList?.map(user => user.id)} hidden>
            </Form.Item>
            
            <Stack spacing = {2}  direction={isMobile ? "column": "row"}>
              <JobInfoCard taskDetail={taskDetail ?? null} currentStatus={taskDetail?.status ?? ''} form={form} />

              <Stack style={cellStyle}>
                <JobAgentInfo 
                  form={form} 
                  mode="user"
                  users={users}
                  searchValue={userSearch} 
                  setSearchValue={setUserSearch}
                  selectedAgent={userSelected} 
                  setselectedAgent={setUserSelected} 
                />

                {userList && userList.map((el)=> 
                  <UserItem user={el} onDelete={onUserDelete}/>)}
              </Stack>
            </Stack>

            <Stack direction={isMobile ? "column" : "row"} spacing = {5}>
              <JobDescription form={form}/>
              <JobTimeAndProcess form={form} />
            </Stack>

            {/* Vật liệu */}
            {/* <MaterialInfo taskDetail={taskDetail ?? null}/> */}

            
          {/* </Stack> */}
          {/* Nhân sự */}
      </Form>
    </Modal>
  );
}

interface UserItemSubProps {
  user: ZipUserSearchProps;
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