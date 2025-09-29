import React from "react";
import { Form, DatePicker, Select, InputNumber, Typography } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import type { Mode } from "../../../../@types/work-space.type";

const { Text } = Typography;

interface TimeType {
  startTime: Dayjs | null;
  endTime: Dayjs | null;
}

interface HandlersType {
  startTimeChange: (date: Dayjs | null) => void;
  endTimeChange: (date: Dayjs | null) => void;
}

interface JobTimeAndProcessProps {
  mode: Mode;
  time: TimeType;
  handlers: HandlersType;
  duration: number;
  form: any; // Ant Design Form instance, type can use FormInstance if imported
  setCurrentDatePicker: React.Dispatch<
    React.SetStateAction<
    {
        type: "startTime" | "endTime";
        value: dayjs.Dayjs | null;
      }
    >
  >;
  setShowDatePickerModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const JobTimeAndQuyTrinh: React.FC<JobTimeAndProcessProps> = ({
  mode,
  time,
  handlers,
  duration,
  form,
  setCurrentDatePicker,
  setShowDatePickerModal,
}) => {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-orange-100 to-orange-200 flex items-center justify-center">
          <CalendarOutlined className="!text-orange-600 !text-xs sm:!text-sm" />
        </div>
        <Text strong className="!text-gray-800 !text-sm sm:!text-base">
          Thời gian & quy trình
        </Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <Form.Item
          name="startTime"
          label={
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
              <span className="text-gray-800 font-medium text-xs sm:text-sm">
                Ngày bắt đầu
              </span>
              <span className="text-red-500">*</span>
            </div>
          }
          rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
          className="!mb-0"
        >
          <div className="flex gap-2">
            <DatePicker
              className="!flex-1 !h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !shadow-sm"
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
              onChange={(date) => {
                handlers.startTimeChange(date);
                form.setFieldsValue({ startTime: date });
              }}
              disabledDate={(current) => current && current < dayjs().startOf("day")}
              value={time.startTime}
              disabled={!mode.adminMode}
              size="middle"
              onOpenChange={(open) => {
                if (open && window.innerWidth <= 768) {
                  setCurrentDatePicker({ type: "startTime", value: time.startTime });
                  setShowDatePickerModal(true);
                  return false;
                }
              }}
            />
          </div>
        </Form.Item>

        <Form.Item
          name="endTime"
          label={
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
              <span className="text-gray-800 font-medium text-xs sm:text-sm">
                Ngày kết thúc
              </span>
              <span className="text-red-500">*</span>
            </div>
          }
          rules={[
            { required: true, message: "Chọn ngày kết thúc" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const startTime = getFieldValue("startTime");
                if (!startTime || (value && dayjs(value).isBefore(dayjs(startTime)))) {
                  return Promise.reject(
                    new Error("Ngày kết thúc không được bé hơn ngày bắt đầu")
                  );
                }
                return Promise.resolve();
              },
            }),
          ]}
          className="!mb-0"
        >
          <div className="flex gap-2">
            <DatePicker
              className="!flex-1 !h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !shadow-sm"
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
              onChange={(date) => {
                handlers.endTimeChange(date);
                form.setFieldsValue({ endTime: date });
              }}
              disabled={!mode.adminMode || !time.startTime}
              disabledDate={(current) =>
                !time.startTime || (current && current < dayjs(time.startTime))
              }
              value={time.endTime}
              size="middle"
              onOpenChange={(open) => {
                if (open && window.innerWidth <= 768) {
                  setCurrentDatePicker({ type: "endTime", value: time.endTime });
                  setShowDatePickerModal(true);
                  return false;
                }
              }}
            />
          </div>
        </Form.Item>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
            <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
            <span className="text-gray-800 font-medium text-xs sm:text-sm">Tổng thời gian</span>
          </div>
          <div className="bg-cyan-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-bold text-center shadow-md h-9 sm:h-10 flex items-center justify-center">
            ⏱️ {duration} ngày
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <Form.Item
          name="type"
          label={
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
              <span className="text-gray-800 font-medium text-xs sm:text-sm">Hình thức làm việc</span>
              <span className="text-red-500">*</span>
            </div>
          }
          rules={[{ required: true, message: "Chọn hình thức làm việc" }]}
          className="!mb-0"
        >
          <Select
            placeholder="Chọn hình thức"
            className="!h-9 sm:!h-10 !rounded-lg focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !text-xs sm:!text-sm !shadow-sm"
            size="middle"
            disabled={!mode.adminMode}
          >
            <Select.Option value="REWARD">💼 Công khoán</Select.Option>
            <Select.Option value="MONTHLY">📅 Công tháng</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="reward"
          label={
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
              <span className="text-gray-800 font-medium text-xs sm:text-sm">Mức lương</span>
              <span className="text-red-500">*</span>
            </div>
          }
          rules={[{ required: true, message: "Nhập mức lương" }]}
          className="!mb-0"
        >
          <InputNumber
            size="large"
            controls={false}
            placeholder="Nhập mức lương"
            className="!w-full !rounded-lg !border !transition-all !duration-200 !text-xs sm:!text-sm !shadow-sm"
            min={0}
            step={1000}
            disabled={!mode.adminMode}
            formatter={(value) =>
              `${value ?? 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
            }
            parser={(value: string | undefined) => {
              if (!value) return 0;
              const numValue = value.replace(/\./g, "");
              return numValue ? Number(numValue) : 0;
            }}
          />
        </Form.Item>
      </div>
    </div>
  );
};

export default JobTimeAndQuyTrinh;
