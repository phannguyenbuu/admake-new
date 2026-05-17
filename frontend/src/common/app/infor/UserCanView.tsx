import React, { useState, useEffect } from 'react';
import { useUser } from '../../common/hooks/useUser';
import { useApiHost } from '../../common/hooks/useApiHost';
import { Button, Form, Input, notification, Checkbox } from "antd";
import { Stack } from '@mui/material';
import { Select } from 'antd';
const { Option } = Select;
import type { User } from '../../@types/user.type';
import type { UserCanViewFormProps } from '../../@types/user-can-view.type';

// Các quyền chung (không kế toán)
const mainLabels: Record<string, string> = {
  view_workpoint: "Chấm công",
  view_user: "Nhân sự",
  view_supplier: "Thầu phụ",
  view_customer: "Khách hàng",
  view_workspace: "Công việc",
  view_material: "Vật liệu",
  view_invoice: "Báo giá",
  view_statistic: "Phân tích",
};

// Sub-module kế toán
const accSubLabels: Record<string, string> = {
  view_acc_payroll: "Bảng lương",
  view_acc_cashflow: "Thu chi hàng ngày",
  view_acc_ar: "Công nợ phải thu",
  view_acc_ap: "Công nợ phải trả",
  view_acc_docs: "Sổ chứng từ",
  view_acc_ledger: "Sổ kế toán",
  view_acc_tax: "Thuế",
  view_acc_assets: "Tài sản cố định",
  view_acc_records: "Hồ sơ",
  view_acc_reports: "Báo cáo",
};

const mainKeys = Object.keys(mainLabels);
const accKeys = Object.keys(accSubLabels);

const UserCanViewForm: React.FC<UserCanViewFormProps> = (props) => {
  const { isMobile } = useUser();
  const [filteredUsers, setFilteredUsers] = useState<User[]>();

  useEffect(() => {
    setFilteredUsers(props.users);
  }, [props]);

  const [selectedUser, setSelectedUser] = useState<string>(props?.user_id ?? '');
  const handleUserChange = (value: string) => {
    notification.success({ message: `Id ${value}` });
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
    view_invoice: props.view_invoice ?? false,
    view_accountant: props.view_accountant ?? false,
    view_statistic: props.view_statistic ?? false,
    // kế toán sub
    view_acc_payroll: props.view_acc_payroll ?? false,
    view_acc_cashflow: props.view_acc_cashflow ?? false,
    view_acc_ar: props.view_acc_ar ?? false,
    view_acc_ap: props.view_acc_ap ?? false,
    view_acc_docs: props.view_acc_docs ?? false,
    view_acc_ledger: props.view_acc_ledger ?? false,
    view_acc_tax: props.view_acc_tax ?? false,
    view_acc_assets: props.view_acc_assets ?? false,
    view_acc_records: props.view_acc_records ?? false,
    view_acc_reports: props.view_acc_reports ?? false,
  });

  // Khi tick "Kế toán" → sync tất cả sub-module
  const handleAccountantToggle = (checked: boolean) => {
    const update: Record<string, boolean> = { view_accountant: checked };
    accKeys.forEach((k) => { update[k] = checked; });
    setFormData((prev) => ({ ...prev, ...update }));
  };

  // Khi tick sub-module → nếu bỏ hết thì bỏ cả Kế toán, nếu có 1 cái → bật Kế toán
  const handleAccSubToggle = (key: string, checked: boolean) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: checked };
      // Kiểm tra còn sub nào được tick không
      const anyAccActive = accKeys.some((k) => (k === key ? checked : !!next[k]));
      next.view_accountant = anyAccActive;
      return next;
    });
  };

  const handleSubmit = async (values: FormData) => {
    if (!selectedUser) {
      notification.warning({ message: 'Vui lòng chọn nhân sự' });
      return;
    }
    const jsonData = {
      ...formData,
      //@ts-ignore
      username: values.username,
      //@ts-ignore
      password: values.password,
    };
    try {
      const response = await fetch(`${useApiHost()}/user/${selectedUser}/can-view`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });
      if (!response.ok) throw new Error('Update failed');
      notification.success({ message: 'Cập nhật quyền xem thành công' });
    } catch (error) {
      notification.error({ message: 'Lỗi khi cập nhật quyền xem' });
    }
  };

  // Options cho phần chung (không gồm view_accountant)
  const mainOptions = mainKeys.map((key) => ({ label: mainLabels[key], value: key }));

  return (
    <Form
      onFinish={handleSubmit}
      initialValues={props}
      style={{ border: '1px solid #333', borderRadius: 5, padding: 20 }}
    >
      <Stack spacing={2}>
        {/* ── Row 1: User picker + username + password ── */}
        <Stack direction="row" spacing={2}>
          <Select
            style={{ width: 200 }}
            placeholder="Chọn giá trị"
            value={selectedUser}
            onChange={handleUserChange}
          >
            {filteredUsers?.map((user) => (
              <Option key={user.id} value={user.id}>
                {user.fullName}
              </Option>
            ))}
          </Select>

          <Form.Item label="User" name="username">
            <Input readOnly />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
                message: 'Mật khẩu phải có ít nhất 8 kí tự, bao gồm chữ hoa, chữ thường, số và kí tự đặc biệt.',
              },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu cho user này" />
          </Form.Item>
        </Stack>

        {/* ── Row 2: Quyền chính (không gồm Kế toán) ── */}
        <Checkbox.Group
          options={mainOptions}
          value={mainKeys.filter((k) => !!formData[k])}
          onChange={(checkedValues) => {
            const update: Record<string, boolean> = {};
            mainKeys.forEach((k) => { update[k] = checkedValues.includes(k); });
            setFormData((prev) => ({ ...prev, ...update }));
          }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}
        />

        {/* ── Row 3: Kế toán + sub-modules ── */}
        <div
          style={{
            border: '1px solid #d9d9d9',
            borderRadius: 8,
            padding: '12px 16px',
            background: formData.view_accountant ? '#f0fdf4' : '#fafafa',
          }}
        >
          {/* Header Kế toán */}
          <Checkbox
            checked={!!formData.view_accountant}
            onChange={(e) => handleAccountantToggle(e.target.checked)}
            style={{ fontWeight: 600, fontSize: 14 }}
          >
            Kế toán
          </Checkbox>

          {/* Sub-modules */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px',
              marginTop: 10,
              marginLeft: 24,
            }}
          >
            {accKeys.map((key) => (
              <Checkbox
                key={key}
                checked={!!formData[key]}
                onChange={(e) => handleAccSubToggle(key, e.target.checked)}
                style={{ fontSize: 13, color: '#555' }}
              >
                {accSubLabels[key]}
              </Checkbox>
            ))}
          </div>
        </div>

        {/* ── Buttons ── */}
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" htmlType="submit">
            Cập nhật
          </Button>
          <Button
            variant="outlined"
            onClick={() => { if (props.onDelete) props.onDelete(props.id ?? ''); }}
          >
            Xóa
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
};

export default UserCanViewForm;
