import React, { useState, useEffect } from 'react';
import { useUser } from '../../common/hooks/useUser';
import { useApiHost } from '../../common/hooks/useApiHost';
import { notification } from 'antd';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export interface UserCanViewFormProps {
  id: string;
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
}

const UserCanViewForm: React.FC<UserCanViewFormProps> = (props) => {
  const [formData, setFormData] = useState<UserCanViewFormProps>({
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Gửi cập nhật lên server
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${useApiHost()}/user/${props.user_id}/can-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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

  return (
    <form onSubmit={handleSubmit}>
      {Object.keys(formData).map(key => (
        <label key={key} style={{ display: 'block', marginBottom: 8 }}>
          <input
            type="checkbox"
            name={key}
            checked={(formData as any)[key]}
            onChange={handleChange}
          />
          {key.replace('view_', '').replace('_', ' ')}
        </label>
      ))}

      <button type="submit">Cập nhật</button>
      
      <IconButton aria-label="close" size="small" onClick={handleDelete}>
        <CloseIcon fontSize="small" style={{ color: '#00B5B4' }} />
      </IconButton>
    </form>
  );
};

export default UserCanViewForm;
