import React, {useEffect, useState} from "react";
import {Stack, Box} from "@mui/material";
import { Form, DatePicker, Select, InputNumber, Typography } from "antd";
import { CalendarOutlined, ConsoleSqlOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import type { Mode, UserSearchProps } from "../../../../@types/work-space.type";
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
  const [startDate, setStartDate] = useState<Dayjs | null>(taskDetail?.start_time ? dayjs(taskDetail.start_time) : null);
  const [endDate, setEndDate] = useState<Dayjs | null>(taskDetail?.end_time ? dayjs(taskDetail.end_time) : null);

  const [endTime, setEndTime] = useState<Dayjs | null>(taskDetail?.end_time ? dayjs(taskDetail.end_time) : null);

  const [totalDays, setTotalDays] = useState<number | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [currentDatePicker, setCurrentDatePicker] = useState<{
      type: "start_time" | "end_time";
      value: dayjs.Dayjs | null;
    }>({ type: "start_time", value: null });
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const selectedType = form ? Form.useWatch("type", form) : null; // Lấy giá trị current của field "type"

  useEffect(() => {
    setStartDate(taskDetail?.start_time ? dayjs(taskDetail.start_time) : null);
    setEndDate(taskDetail?.end_time ? dayjs(taskDetail.end_time) : null);

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

  useEffect(() => {
    if (!form) return;

    if (taskDetail) {
      form.setFieldsValue({
        type: taskDetail.type,
        reward: taskDetail.reward
      });
    }else{
      form.setFieldsValue({
        type: "",
        reward: 0
      });
    }
  }, [form, taskDetail]);

  useEffect(() => {
    if (startDate && endDate) {
      const total = endDate.diff(startDate, "day") + 1;
      setTotalDays(total > 0 ? total : 0);

      const remaining = endDate.diff(dayjs(), "day") + 1;
      setRemainingDays(remaining > 0 ? remaining : 0);
    } else {
      setTotalDays(null);
      setRemainingDays(null);
    }
  }, [startDate, endDate]);



  return (
    <Stack spacing={0.2} sx={{maxWidth:400, overflowX:'hidden'}}>
      
      
      
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-orange-100 to-orange-200 flex items-center justify-center">
            <CalendarOutlined className="!text-orange-600 !text-xs sm:!text-sm" />
          </div>
          <Text strong className="!text-gray-800 !text-sm sm:!text-base">
            { form ? "Thời gian & quy trình": taskDetail?.title ?? '' }
          </Text>
        </div>

      {form ?
      <>
        <DateFormPicker form={form} mode="start_time" title="Bắt đầu"
          taskDetail={taskDetail}
          // timeValue={taskDetail?.start_time ? dayjs(taskDetail?.start_time) : null}
          timeValue={startDate}
          onChange={(date) => setStartDate(date)}
          disabledDateFunc={(current: Dayjs) => current && current < dayjs().startOf("day")}/>

        <DateFormPicker form={form} mode="end_time" title="Kết thúc"
          taskDetail={taskDetail}
          // timeValue={taskDetail?.end_time ? dayjs(taskDetail?.end_time) : null}
          timeValue={endDate}
          onChange={(date) => setEndDate(date)}
          disabledDateFunc={(current: Dayjs) =>
            (current && current < dayjs(taskDetail?.start_time).startOf('day'))}/>
      </>
      :
      <>
        {/* @ts-ignore */}
        <Typography>Từ ngày <span style={{color:"#0092b8"}}>{taskDetail?.start_time ?? ''}</span> đến <span style={{color:"#0092b8"}}>{taskDetail?.end_time ?? ''}</span></Typography>
      </>
    }

        <Stack direction="row" spacing={2}>
        
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
            {!remainingDays || remainingDays === 0 ? `Hết hạn` : `${remainingDays} ngày`}
          </div>

          </Stack>
        
        {form ? 
        <>
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
              <Select.Option value="MONTHLY">📅 Lương tháng</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="reward"
            label={
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                <span className="text-gray-800 font-medium text-xs sm:text-sm">
                  {selectedType === "REWARD" ? "Tiền công": "Thưởng thêm"}
                  </span>
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
          </>
          : <>
            <Typography style={{fontWeight:700, color:'#0092b8'}}>
              Tiền công: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(taskDetail?.reward || 0)} ({taskDetail?.type === 'MONTHLY' ?'Lương tháng':'Công khoán' })
            </Typography>
          </>}
        
      </Stack>
  );
};

export default JobTimeAndProcess;

export function DateFormPicker({
  taskDetail,
  mode,
  title,
  timeValue,
  disabledDateFunc,
  form,
  onChange
}: {
  taskDetail:Task | null,
  mode: string;
  title: string;
  timeValue: Dayjs | null;
  disabledDateFunc?: (date: Dayjs) => boolean;
  form: any;
  onChange?: (date: Dayjs | null) => void
}) {
  useEffect(() => {
    if(!form) return;

    form.setFieldsValue({ [mode]: timeValue });
  }, [timeValue]);

  const handleChange = (date: Dayjs | null) => {
    if (date) {
      // Đặt giờ = 0, phút = 0, giây = 0, mili giây = 0 để chỉ lấy ngày
      const dateOnly = date.hour(0).minute(0).second(0).millisecond(0);

      if(form)
        form.setFieldsValue({ [mode]: dateOnly });

      if (taskDetail) {
        if (mode === "end_time") {
          taskDetail.end_time = dateOnly;
        } else {
          taskDetail.start_time = dateOnly;
        }
      }

      if (onChange) onChange(dateOnly);
    } else {
      if(form)
        form.setFieldsValue({ [mode]: null });

      if (taskDetail) {
        if (mode === "end_time") {
          taskDetail.end_time = null;
        } else {
          taskDetail.start_time = null;
        }
      }
      if (onChange) onChange(null);
    }

    
  };


  const value = form ? form.getFieldValue(mode) : null;

  return (
    <Form.Item
      name={mode}
      label={
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
          <span className="text-gray-800 font-medium text-xs sm:text-sm">{title}</span>
          <span className="text-red-500">*</span>
        </div>
      }
      rules={[{ required: true, message: "Chọn ngày" }]}
      className="!mb-0"
    >
      <DatePicker
        className="!flex-1 !h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !shadow-sm"
        format="DD/MM/YYYY"
        placeholder="Chọn ngày"
        onChange={handleChange}
        value={value}
        size="middle"
        disabledDate={disabledDateFunc}
      />
    </Form.Item>
  );
}