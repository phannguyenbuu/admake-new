import React, { useEffect, useState } from "react";
import { Form, AutoComplete, Typography } from "antd";
// import type { Customer } from "../../../../@types/customer.type";
import { useApiHost } from "../../../../common/hooks/useApiHost";
// import type { User } from "../../../../@types/user.type";
import type { UserSearchProps } from "../../../../@types/work-space.type";

const { Text } = Typography;

interface JobAgentInfoProps {
  mode: "customer"|"user"|string;
  
  users: UserSearchProps[] ,
  form: any; // Form instance AntD
  searchValue: string;
  setSearchValue: React.Dispatch<React.SetStateAction<string>>;
  selectedCustomer: UserSearchProps | null;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<UserSearchProps | null>>;
}

// function isCustomer(obj: UserSearchProps): obj is Customer {
//   return (obj as Customer).workAddress !== undefined;
// }

const JobAgentInfo: React.FC<JobAgentInfoProps> = ({ 
  form,
  users,
  mode,
  searchValue,
  setSearchValue,
  selectedCustomer,
  setSelectedCustomer, }) => {
  // const [customers, setCustomers] = useState<Customer[]>([]);
  const [options, setOptions] = useState<{ value: string; label: React.ReactNode }[]>([]);
  const rolename = mode === "customer" ? "khách hàng" : "nhân viên";

  // Cập nhật options tìm kiếm khi người dùng nhập
  const handleSearch = (value: string) => {
    // console.log('Customers', customers.length, value);
    setSearchValue(value);
    if (!value) {
      setOptions(
        users.map((c) => ({
          value: c.fullName || "",
          label: (
            <div>
              <div>{c.fullName}</div>
              <small>
                {c.phone || ""}
                {"workAddress" in c && c.workAddress ? `• ${c.workAddress}` : ""}
                {"role" in c && c.role ? `• ${c.role}` : ""}
              </small>
            </div>
          ),
        }))
      );
      return;
    }
    // console.log('ed1', customers);
    // const filtered = users.filter((c) => c.fullName && c.fullName.toLowerCase().includes(value.toLowerCase()));
    // console.log('filtered', filtered);

    const normalizedSearch = removeVietnameseTones(value);

    const filtered = users.filter(c => {
      if (!c.fullName) return false;
      return removeVietnameseTones(c.fullName).includes(normalizedSearch);
    });

    setOptions(
      filtered.map((c) => ({
        value: c.fullName || "",  // nếu fullName undefined thì dùng chuỗi rỗng
        label: (
          <div>
            <div>{c.fullName}</div>
            <small>
              {c.phone || ""}{" "}
              {"workAddress" in c && c.workAddress ? `• ${c.workAddress}` : ""}
              {"role" in c && c.role ? `• ${c.role}` : ""}
            </small>
          </div>
        ),
      }))
    );

  };

  // Khi chọn khách hàng
  const handleSelect = (value: string) => {
    const user = users.find((c) => c.fullName === value) || null;
    setSelectedCustomer(user);
    // Cập nhật form field nếu form có quản lý
    form.setFieldsValue({ [mode]: value });
  };

  function removeVietnameseTones(str:string) {
    if (!str) return "";
    str = String(str).toLowerCase();
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    str = str.replace(/đ/g, 'd');
    return str;
  }


  return (
    <>
      <Form.Item
        label={`Tìm ${rolename}`}
        name={mode}
        className="mb-3"
      >
        <AutoComplete
          style={{ minWidth: 200, maxWidth:300 }}
          options={options}
          // filterOption={(inputValue, option) => {
          //   const label = (option as { label?: string; value?: string }).label || (option as { value?: string }).value || '';
          //   return removeVietnameseTones(label).includes(removeVietnameseTones(inputValue));
          // }}
          value={searchValue}
          onSearch={handleSearch}
          onSelect={handleSelect}
          placeholder={`Nhập tên hoặc số điện thoại ${rolename}`}
          allowClear
          // filterOption={(inputValue, option) => {
          //   const label = option?.label || option?.value || '';
          //   const normalizedLabel = removeVietnameseTones(label || '').toLowerCase();
          //   const normalizedInput = removeVietnameseTones(inputValue || '').toLowerCase();
          //   return normalizedLabel.includes(normalizedInput);
          // }}

        />
      </Form.Item>

      {selectedCustomer && (
        <div>
          <Text strong>Tên {rolename}:</Text> {selectedCustomer.fullName || "-"} <br />
          <Text strong>Số điện thoại:</Text>{" "}
          {selectedCustomer.phone ? (
            <a href={`tel:${selectedCustomer.phone.replace(/\s/g, "")}`}>{selectedCustomer.phone}</a>
          ) : (
            "-"
          )}{" "}
          <br />
          {selectedCustomer.workAddress && (
            <>
              <Text strong>Địa chỉ làm việc:</Text> {selectedCustomer.workAddress}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default JobAgentInfo;
