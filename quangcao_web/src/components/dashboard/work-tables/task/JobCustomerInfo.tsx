import React, { useEffect, useState } from "react";
import { Form, AutoComplete, Typography } from "antd";
import type { Customer } from "../../../../@types/customer.type";
import { useApiHost } from "../../../../common/hooks/useApiHost";

const { Text } = Typography;

interface JobCustomerInfoProps {
  mode: "customer"|"user"|string;
  form: any; // Form instance AntD
}

const JobCustomerInfo: React.FC<JobCustomerInfoProps> = ({ form, mode }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [options, setOptions] = useState<{ value: string; label: React.ReactNode }[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const rolename = mode === "customer" ? "khách hàng" : "nhân viên";

  // Load danh sách khách hàng khi component mount
  useEffect(() => {
    fetch(`${useApiHost()}/${mode}/?limit=1000`)
      .then(response => response.json())
      .then(data => {
        // console.log(data.data);
        setCustomers(data.data || []);
      })
      .catch(error => {
        // Xử lý lỗi nếu cần
        console.error("Error fetching customers:", error);
      });
  }, []);


  // Cập nhật options tìm kiếm khi người dùng nhập
  const handleSearch = (value: string) => {
    // console.log('Customers', customers.length, value);
    setSearchValue(value);
    if (!value) {
      
      setOptions([]);
      return;
    }
    // console.log('ed1', customers);
    const filtered = customers.filter((c) => c.fullName && c.fullName.toLowerCase().includes(value.toLowerCase()));
    // console.log('filtered', filtered);
    setOptions(
      filtered.map((c) => ({
        value: c.fullName,
        label: (
          <div>
            <div>{c.fullName}</div>
            <small>{c.phone || ""} {c.workAddress ? `• ${c.workAddress}` : ""}</small>
          </div>
        ),
      }))
    );
  };

  // Khi chọn khách hàng
  const handleSelect = (value: string) => {
    const customer = customers.find((c) => c.fullName === value) || null;
    setSelectedCustomer(customer);
    // Cập nhật form field nếu form có quản lý
    form.setFieldsValue({ customer: value });
  };

  return (
    <div className="p-3 border border-gray-200 shadow-sm rounded shadow-sm">
      <Form.Item
        label={`Tìm kiếm  ${rolename}`}
        name={mode}
        className="mb-3"
      >
        <AutoComplete
          options={options}
          value={searchValue}
          onSearch={handleSearch}
          onSelect={handleSelect}
          placeholder={`Nhập tên hoặc số điện thoại ${rolename}`}
          allowClear
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
    </div>
  );
};

export default JobCustomerInfo;
