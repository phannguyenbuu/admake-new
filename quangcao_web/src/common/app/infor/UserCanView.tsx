import React, { useState, useEffect } from 'react';
import { useUser } from '../../common/hooks/useUser';
import { useApiHost } from '../../common/hooks/useApiHost';
import { Button, Form, Input, notification, Checkbox, Typography } from "antd";
import { Stack } from '@mui/material';
import { Select } from 'antd';
const { Option } = Select;
import type { User } from '../../@types/user.type';

export interface UserCanViewFormProps {
  id?: string;
  user_id?: string;
  password?: string;
  view_workpoint?: boolean;
  view_user?: boolean;
  view_supplier?: boolean;
  view_customer?: boolean;
  view_workspace?: boolean;
  view_material?: boolean;
  view_price?: boolean;
  view_accountant?: boolean;
  view_statistic?: boolean;

  [key: string]: any;
  userName? : string;
  users?: User[];        // Thay 'any[]' bằng kiểu mảng người dùng nếu biết rõ kiểu
}

const labels: { [key: string]: string } = {
  view_workpoint: "Chấm công",
  view_user: "Nhân sự",
  view_supplier: "Thầu phụ",
  view_customer: "Khách hàng",
  view_workspace: "Công việc",
  view_material: "Vật liệu",
  view_price: "Báo giá",
  view_accountant: "Kế toán",
  view_statistic: "Phân tích",
}


const UserCanViewForm: React.FC<UserCanViewFormProps> = (props) => {
  const {isMobile} = useUser();

  const [filteredUsers, setFilteredUsers] = useState<User[]>();
    
  useEffect(()=>{
    setFilteredUsers(props.users);
  },[props]);
    

  const [selectedUser, setSelectedUser] = useState<string>(props?.user_id ?? '');
  const handleUserChange = (value: string) => {
    notification.success({message:`Id ${value}`});
    setSelectedUser(value);
  };

  type FormDataType = Omit<UserCanViewFormProps, 'el' | 'users'>;

  const [formData, setFormData] = useState<FormDataType>({
    id: props.id,
    user_id: props.user_id,
    password: props.password,
    view_workpoint: props.view_workpoint ?? false,
    view_user: props.view_user ?? false,
    view_supplier: props.view_supplier ?? false,
    view_customer: props.view_customer ?? false,
    view_workspace: props.view_workspace ?? false,
    view_material: props.view_material ?? false,
    view_price: props.view_price ?? false,
    view_accountant: props.view_accountant ?? false,
    view_statistic: props.view_statistic ?? false,
  });


  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, checked } = e.target;
  //   setFormData(prev => ({ ...prev, [name]: checked }));
  // };

  // Gửi cập nhật lên server
  const handleSubmit = async (values: FormData) => {
    // e.preventDefault();

    if(!selectedUser)
    {
      notification.warning({message:'Vui lòng chọn nhân sự'});
      return;
    }

    const jsonData = {
      ...formData,
      //@ts-ignore
      username: values.username,
      //@ts-ignore
      password: values.password,
    };

    console.log("submit can view", jsonData);
    
    try {
      const response = await fetch(`${useApiHost()}/user/${selectedUser}/can-view`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });
      if (!response.ok) throw new Error('Update failed');
      notification.success({message:'Cập nhật quyền xem thành công'});
    } catch (error) {
      notification.error({message:'Lỗi khi cập nhật quyền xem'});
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${useApiHost()}/user/${props.user_id}/can-view`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Delete failed');
      notification.success({message:'Xóa quyền xem thành công'});
    } catch (error) {
      notification.error({message:'Lỗi khi xóa quyền xem'});
    }
  };

  const checkboxOptions = Object.keys(formData)
  .filter(key => key !== 'id' && key !== 'user_id' && key !== 'password')
  .map(key => ({
    label: labels[key],
    value: key,
  }));

  return (
    <Form onFinish={handleSubmit} 
        initialValues={props}
        style={{border:'1px solid #333', borderRadius: 5, padding: 20}}>
      <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        
        <Select
          style={{ width: 200 }}
          placeholder="Chọn giá trị"
          value={selectedUser}
          onChange={handleUserChange}
        >
          {filteredUsers?.map(user => (
            <Option key={user.id} value={user.id}>
              {user.fullName}
            </Option>
          ))}
        </Select>

        
        <Form.Item
          label="User"
          name="username"
        >
          <Input readOnly />
        </Form.Item>

        <Form.Item
          label="Mật khẩu"
          name="password"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu!' },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
              message:
                'Mật khẩu phải có ít nhất 8 kí tự, bao gồm chữ hoa, chữ thường, số và kí tự đặc biệt.',
            },
          ]}
        >
          <Input.Password placeholder="Nhập mật khẩu cho user này" />
        </Form.Item>

        </Stack>

        <Stack spacing={2}>
          
            <Checkbox.Group
              options={checkboxOptions}
              value={Object.keys(formData).filter(key => (formData as any)[key] === true)}
              onChange={checkedValues => {
                const newFormData = { ...formData };
                // Đặt true nếu key được checked, false nếu không
                Object.keys(formData).forEach(key => {
                  if (key !== 'id' && key !== 'user_id' && key !== 'password') {
                    newFormData[key] = checkedValues.includes(key);
                  }
                });
                setFormData(newFormData);
              }}

              style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}
            />
          

          <Stack direction="row" spacing={2}>
            <Button variant='outlined' htmlType="submit">
              Cập nhật
            </Button>

            <Button variant='outlined' onClick={handleDelete}>
              Xóa
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Form>
  );
};

export default UserCanViewForm;
