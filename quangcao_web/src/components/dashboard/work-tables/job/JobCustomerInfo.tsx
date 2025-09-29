import React from "react";
import { Form, AutoComplete, Button, Typography, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd/es/form";
import type { Mode } from "../../../../@types/work-space.type";
import type { Customer } from "../../../../@types/customer.type";

const { Text } = Typography;


// interface CustomerType {
//   id: string | number;
//   fullName: string;
//   phone?: string;
//   workAddress?: string;
//   workInfo?: string;
// }

interface CustomerState {
  searchValue: string;
  selectedId: string | number | null;
  selectedCustomer: Customer | null;
  isTyping: boolean;
}

// interface HandlersType

// interface ModeType {
//   adminMode: boolean;
// }

interface JobCustomerInfoProps {
  mode: Mode;
  isEditMode: boolean;
  customer: CustomerState;
  handlers:  {
        customerSearch: (value: string) => void;
        customerSelect: (value: string, option?: any) => void;
    };
  filteredCustomers: Customer[];
  loadingCustomers: boolean;
  setShowCustomerModal: (show: boolean) => void;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerState>>;
  form: FormInstance<any>;
}

const JobCustomerInfo: React.FC<JobCustomerInfoProps> = ({
  mode,
  isEditMode,
  customer,
  handlers,
  filteredCustomers,
  loadingCustomers,
  setShowCustomerModal,
  setCustomer,
}) => {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
            <UserOutlined className="!text-blue-600 !text-xs sm:!text-sm" />
          </div>
          <Text strong className="!text-gray-800 !text-sm sm:!text-base">
            Thông tin khách hàng
          </Text>
        </div>
        {mode.adminMode && !isEditMode && (
          <Button type="link" size="small"
            className="!text-cyan-600 hover:!text-cyan-700 !text-xs !font-medium hover:!underline"
            onClick={() => setShowCustomerModal(true)}>+ Tạo mới</Button>)}
      </div>

      {mode.adminMode && !isEditMode && (
        <Form.Item
          name="customer"
          label={
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
              <span className="text-gray-800 font-medium text-xs sm:text-sm">
                Tìm kiếm khách hàng
              </span>
            </div>
          }
          className="!mb-3"
        >
          <AutoComplete
            value={customer.searchValue}
            onChange={handlers.customerSearch}
            onSelect={handlers.customerSelect}
            placeholder="Nhập tên, số điện thoại hoặc địa chỉ..."
            className="!h-9 sm:!h-10 !rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !text-xs sm:!text-sm !shadow-sm"
            options={filteredCustomers.map((c) => ({
              key: c.id,
              value: c.fullName,
              label: (
                <div className="flex flex-col py-1">
                  <div className="font-medium text-sm">{c.fullName}</div>
                  <div className="text-xs text-gray-500">
                    📞 {c.phone} {c.workAddress ? `• 📍 ${c.workAddress}` : ""}
                  </div>
                </div>
              ),
            }))}
            filterOption={false}
            showSearch
            allowClear
            notFoundContent={
              loadingCustomers ? (
                <div className="text-center py-2 text-gray-500 text-xs">
                  ⏳ Đang tìm kiếm...
                </div>
              ) : customer.searchValue ? (
                <div className="text-center py-2 text-gray-500 text-xs">
                  Không tìm thấy "{customer.searchValue}"
                </div>
              ) : (
                <div className="text-center py-2 text-gray-500 text-xs">
                  Nhập từ khóa để tìm kiếm
                </div>
              )
            }
            onClear={() =>
              setCustomer({
                searchValue: "",
                selectedId: null,
                selectedCustomer: null,
                isTyping: false,
              })
            }
          />
        </Form.Item>
      )}

      {customer.selectedCustomer && (
        <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left Column: Name + Address */}
            <div className="space-y-4">
              {/* Customer Name */}
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-xs">👤</span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-600 mb-1">Tên khách hàng</div>
                  <div className="text-sm font-semibold text-gray-800 break-words">
                    {customer.selectedCustomer.fullName || "-"}
                  </div>
                </div>
              </div>

              {/* Address */}
              {customer.selectedCustomer.workAddress && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs">📍</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-gray-600 mb-1">Địa điểm</div>
                    <div className="text-sm font-medium text-cyan-700 break-words whitespace-pre-wrap">
                      {customer.selectedCustomer.workAddress}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Phone + Work Info */}
            <div className="space-y-4">
              {/* Phone Number */}
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-xs">📞</span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-600 mb-1">Số điện thoại</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {customer.selectedCustomer.phone ? (
                      <a
                        href={`tel:${customer.selectedCustomer.phone.replace(/\s/g, "")}`}
                        className="text-cyan-700 hover:underline"
                      >
                        {customer.selectedCustomer.phone}
                      </a>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
              </div>

              {/* Work Info */}
              {customer.selectedCustomer.workInfo && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 text-xs">💼</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-gray-600 mb-1">Thông tin công việc</div>
                    <div className="text-sm font-medium text-purple-700 break-words leading-relaxed">
                      {customer.selectedCustomer.workInfo}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCustomerInfo;
