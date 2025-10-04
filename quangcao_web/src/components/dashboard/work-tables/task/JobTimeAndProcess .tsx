import React, {useEffect, useState} from "react";
import {Stack, Box} from "@mui/material";
import { Form, DatePicker, Select, InputNumber, Typography } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import type { Mode } from "../../../../@types/work-space.type";
import type { Task } from "../../../../@types/work-space.type";

const { Text } = Typography;

interface TimeType {
  start_time: Dayjs | null;
  end_time: Dayjs | null;
}

interface JobTimeAndProcessProps {
  form: any;
  taskDetail: Task | null;
}

const JobTimeAndProcess: React.FC<JobTimeAndProcessProps> = ({taskDetail, form}) => {
  
  const [endTime, setEndTime] = useState<Dayjs | null>(taskDetail?.end_time ? dayjs(taskDetail.end_time) : null);

  const [totalDays, setTotalDays] = useState<number | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [currentDatePicker, setCurrentDatePicker] = useState<{
      type: "start_time" | "end_time";
      value: dayjs.Dayjs | null;
    }>({ type: "start_time", value: null });
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
    
  useEffect(() => {
    if (taskDetail?.start_time && taskDetail?.end_time) {
      const start =  dayjs(taskDetail?.start_time);
      const end =  dayjs(taskDetail?.end_time);

      const total = end.diff(start, "day") + 1; // cộng 1 để bao gồm ngày cuối
      setTotalDays(total > 0 ? total : 0);

      const now = dayjs();
      const remaining = end.diff(now, "day") + 1;
      setRemainingDays(remaining > 0 ? remaining : 0);
    } else {
      setTotalDays(null);
      setRemainingDays(null);
    }
  }, [taskDetail?.start_time, taskDetail?.end_time]);

  return (
    <Stack spacing={0.2} sx={{maxWidth:400, overflowX:'hidden'}}>
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-orange-100 to-orange-200 flex items-center justify-center">
          <CalendarOutlined className="!text-orange-600 !text-xs sm:!text-sm" />
        </div>
        <Text strong className="!text-gray-800 !text-sm sm:!text-base">
          Thời gian & quy trình
        </Text>
      </div>

      
        <DateFormPicker form={form} title="Bắt đầu"
          timeValue={taskDetail?.start_time ? dayjs(taskDetail?.start_time) : null}
          disabledDateFunc={(current: Dayjs) => current && current < dayjs().startOf("day")}/>

        <DateFormPicker form={form} title="Kết thúc"
          timeValue={taskDetail?.end_time ? dayjs(taskDetail?.end_time) : null}
          disabledDateFunc={(current: Dayjs) =>
            !taskDetail?.end_time || (current && current < dayjs(taskDetail?.end_time).startOf('day'))}/>

        <Stack direction="row">
        
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
            <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
            <span className="text-gray-800 font-medium text-xs sm:text-sm">Tổng</span>
          </div>
          <div className="bg-cyan-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-bold text-center shadow-md h-9 sm:h-10 flex items-center justify-center">
            {totalDays !== null ? `⏱️ ${totalDays} ngày` : "-"}
          </div>
        
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
            <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
            <span className="text-gray-800 font-medium text-xs sm:text-sm">Còn lại</span>
          </div>
          <div className="bg-cyan-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-bold text-center shadow-md h-9 sm:h-10 flex items-center justify-center">
            {remainingDays !== null ? `${remainingDays} ngày` : "-"}
          </div>

          </Stack>
        
          <Form.Item
            name="type"
            label={
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                <span className="text-gray-800 font-medium text-xs sm:text-sm">Trả lương</span>
                <span className="text-red-500">*</span>
              </div>
            }
            rules={[{ required: true, message: "Chọn hình thức làm việc" }]}
            className="!mb-0"
            style={{minWidth:300}}
          >
            <Select
              placeholder="Chọn hình thức"
              className="!h-9 sm:!h-10 !rounded-lg focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !text-xs sm:!text-sm !shadow-sm"
              size="middle"
              // disabled={!mode.adminMode}
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
            style={{minWidth:300}}
          >
            <InputNumber
              size="large"
              controls={false}
              placeholder="Nhập mức lương"
              className="!w-full !rounded-lg !border !transition-all !duration-200 !text-xs sm:!text-sm !shadow-sm"
              min={0}
              step={1000}
              // disabled={!mode.adminMode}
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
        
      </Stack>
  );
};

export default JobTimeAndProcess;

function DateFormPicker({title,timeValue,disabledDateFunc, form}:
  {title:string, timeValue: Dayjs | null, disabledDateFunc:any, form: any}) {
  // type TaskDateKeys = "start_time" | "end_time";
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  
  return (
    <Form.Item
      name="key"
      label={
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
          <span className="text-gray-800 font-medium text-xs sm:text-sm">
            {title}
          </span>
          <span className="text-red-500">*</span>
        </div>
      }
      rules={[{ required: true, message: "Chọn ngày" }]}
      className="!mb-0"
    >
      <div className="flex gap-2">
        <DatePicker
          className="!flex-1 !h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !shadow-sm"
          format="DD/MM/YYYY"
          placeholder="Chọn ngày"
          onChange={(date) => {
            // handlers.startTimeChange(date);
            form.setFieldsValue({ key: date });
          }}
          disabledDate={disabledDateFunc}
          value={timeValue}
          size="middle"
          onOpenChange={(open) => {
            // setCurrentDatePicker({ type: key, value: dayjs(taskDetail?[key]) });
            setShowDatePickerModal(true);
            return false;
          }}
        />
      </div>
    </Form.Item>
  )
}