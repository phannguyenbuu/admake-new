import React, { useEffect, useRef, useState } from "react";
import { Stack, Box } from "@mui/material";
import { Form, DatePicker, Select, InputNumber, Typography, Drawer } from "antd";
import { CalendarOutlined, ConsoleSqlOutlined } from "@ant-design/icons";
import { Table, TableBody, TableCell, TableRow, TableContainer, Paper } from '@mui/material';

import dayjs, { Dayjs } from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

import type { Mode, UserSearchProps } from "../../../../@types/work-space.type";
import type { Task } from "../../../../@types/work-space.type";
import JobAsset from "./JobAsset";
import { useUser } from "../../../../common/hooks/useUser";
import { useTaskContext } from "../../../../common/hooks/useTask";



const { Text } = Typography;

interface TimeType {
  start_time: Dayjs | null;
  end_time: Dayjs | null;
}

interface JobTimeAndProcessProps {
  form: any;
  // salaryType?: string;
  // setSalaryType?: (salaryType: string) => void;
}

const JobTimeAndProcess: React.FC<JobTimeAndProcessProps> = ({ form }) => {
  const { taskDetail, setTaskDetail } = useTaskContext();
  const [startDate, setStartDate] = useState<Dayjs | null>(taskDetail?.start_time ? dayjs(taskDetail.start_time) : null);
  const [endDate, setEndDate] = useState<Dayjs | null>(taskDetail?.end_time ? dayjs(taskDetail.end_time) : null);

  const [totalDays, setTotalDays] = useState<number | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const syncedTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    setStartDate(taskDetail?.start_time ? dayjs(taskDetail.start_time) : null);
    setEndDate(taskDetail?.end_time ? dayjs(taskDetail.end_time) : null);

    if (taskDetail?.start_time && taskDetail?.end_time) {
      const start = dayjs(taskDetail?.start_time);
      const end = dayjs(taskDetail?.end_time);

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

    const nextTaskId = taskDetail?.id ?? null;
    if (syncedTaskIdRef.current !== nextTaskId) {
      syncedTaskIdRef.current = nextTaskId;
      form.setFieldsValue({
        type: taskDetail?.type || "",
        reward: taskDetail?.reward ?? 0
      });
    }

    if (startDate && endDate) {
      const total = endDate.diff(startDate, "day") + 1;
      setTotalDays(total > 0 ? total : 0);

      const remaining = endDate.diff(dayjs(), "day") + 1;
      setRemainingDays(remaining > 0 ? remaining : 0);
    } else {
      setTotalDays(null);
      setRemainingDays(null);
    }
  }, [form, taskDetail?.id, taskDetail?.type, taskDetail?.reward, startDate, endDate]);

  const handleTypeChange = (value: string) => {
    setTaskDetail(prev => prev ? { ...prev, type: value } : prev);
  };

  const { isMobile } = useUser();

  return (
    <Stack spacing={1.5} sx={{ width: '100%', overflowX: 'hidden' }}>
      <div className="flex items-center gap-2 mb-1 sm:mb-2">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-orange-100 to-orange-200 flex items-center justify-center">
          <CalendarOutlined className="!text-orange-600 !text-xs sm:!text-sm" />
        </div>
        <Text strong className="!text-slate-800 !text-sm sm:!text-base">
          {form ? "Thời gian & quy trình" : taskDetail?.title ?? ''}
        </Text>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-full">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          {/* Row 1: Bắt đầu & Tổng */}
          <div className="flex flex-col">
            {form ? (
              <DateFormPicker
                form={form}
                mode="start_time"
                title="Bắt đầu"
                timeValue={startDate}
                onChange={(date) => setStartDate(date)}
                disabledDateFunc={(current: Dayjs) => current && current < dayjs().startOf("day")}
              />
            ) : (
              <div></div>
            )}
          </div>
          <div className="flex flex-col justify-end">
            <div className="text-slate-600 font-medium text-[13px] mb-1.5">Tổng</div>
            <div className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center h-9 sm:h-10 transition-all">
              {totalDays !== null ? `⏱️ ${totalDays} ngày` : "-"}
            </div>
          </div>

          {/* Row 2: Kết thúc & Còn lại */}
          <div className="flex flex-col">
            {form ? (
              <DateFormPicker
                form={form}
                mode="end_time"
                title="Kết thúc"
                timeValue={endDate}
                onChange={(date) => setEndDate(date)}
                disabledDateFunc={(current: Dayjs) =>
                  (current && current < dayjs(taskDetail?.start_time).startOf('day'))
                }
              />
            ) : (
              <Typography className="mb-2">Đến <span style={{ color: "#0092b8" }}>{taskDetail?.end_time ? dayjs(taskDetail.end_time).format('DD/MM/YYYY HH:mm') : ''}</span></Typography>
            )}
          </div>
          <div className="flex flex-col justify-end">
            <div className="text-slate-600 font-medium text-[13px] mb-1.5">Còn lại</div>
            <div className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center h-9 sm:h-10 transition-all ${(!remainingDays || remainingDays === 0) ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {!remainingDays || remainingDays === 0 ? "Hết hạn" : `${remainingDays} ngày`}
            </div>
          </div>

          {/* Row 3: Trả lương & Phụ cấp */}
          <div className="flex flex-col">
            {form ? (
              <Form.Item
                name="type"
                rules={[{ required: false, message: "Chọn hình thức" }]}
                className="!mb-0"
              >
                <div className="text-slate-600 font-medium text-[13px] mb-1.5">Trả lương</div>
                <Select
                  placeholder="Chọn hình thức"
                  size="middle"
                  className="w-full text-sm"
                  style={{ height: 38 }}
                  value={taskDetail?.type}
                  onChange={handleTypeChange}
                >
                  <Select.Option value="REWARD">💼 Công khoán</Select.Option>
                  <Select.Option value="MONTHLY">📅 Lương tháng</Select.Option>
                </Select>
              </Form.Item>
            ) : (
              <Typography style={{ fontWeight: 700, color: '#0092b8' }}>
                Phụ cấp
              </Typography>
            )}
          </div>

          <div className="flex flex-col">
            {form ? (
              <Form.Item
                name="reward"
                rules={[{ required: false, message: 'Nhập số tiền' }]}
                className="!mb-0"
              >
                <div className="text-slate-600 font-medium text-[13px] mb-1.5">
                  {taskDetail && taskDetail?.type === "REWARD" ? 'Tiền công' : 'Phụ cấp'}
                </div>
                <InputNumber
                  className="w-full !rounded-lg !border-slate-200 hover:!border-cyan-400 focus:!border-cyan-500 focus:!ring-1 focus:!ring-cyan-200 transition-all !shadow-sm !text-center"
                  style={{ height: 38, width: '100%', paddingTop: 3 }}
                  controls={false}
                  placeholder={'Nhập số tiền'}
                  min={0}
                  step={1000}
                  value={taskDetail?.reward}
                  formatter={(value) =>
                    `${value ?? 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                  }
                  parser={(value: string | undefined): number => {
                    if (!value) return 0;
                    const numValue = value.replace(/\./g, "");
                    return Number(numValue) || 0;
                  }}
                  onBlur={(e) => {
                    const valueStr = e.target.value;
                    const numValue = valueStr.replace(/\./g, "");
                    const parsedValue = Number(numValue) || 0;
                    setTaskDetail(prev => prev ? { ...prev, reward: parsedValue } : prev);
                  }}
                />
              </Form.Item>
            ) : (
              <Typography style={{ fontWeight: 700, color: '#0092b8' }}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(taskDetail?.reward || 0)}
              </Typography>
            )}
          </div>
        </div>
      </div>

      {taskDetail && taskDetail?.type === "REWARD" && form &&
        <JobAsset key="cash-assets" title='Ứng tiền cho thầu phụ' type="advance-cash" />
      }
    </Stack>
  );
};

export default JobTimeAndProcess;

export function DateFormPicker({
  mode,
  title,
  timeValue,
  disabledDateFunc,
  form,
  onChange
}: {
  mode: string;
  title: string;
  timeValue: Dayjs | null;
  disabledDateFunc?: (date: Dayjs) => boolean;
  form: any;
  onChange?: (date: Dayjs | null) => void
}) {
  const { taskDetail } = useTaskContext();
  const { isMobile } = useUser();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('08:00');

  useEffect(() => {
    if (!form) return;
    if (timeValue) {
      form.setFieldsValue({ [mode]: timeValue });
    } else if (!taskDetail) {
      form.setFieldsValue({ [mode]: dayjs() });
    } else {
      form.setFieldsValue({ [mode]: null });
    }
  }, [timeValue]);

  const handleChange = (date: Dayjs | null) => {
    if (date) {
      if (form) form.setFieldsValue({ [mode]: date });
      if (taskDetail) {
        if (mode === "end_time") taskDetail.end_time = date;
        else taskDetail.start_time = date;
      }
      if (onChange) onChange(date);
    } else {
      if (form) form.setFieldsValue({ [mode]: null });
      if (taskDetail) {
        if (mode === "end_time") taskDetail.end_time = null;
        else taskDetail.start_time = null;
      }
      if (onChange) onChange(null);
    }
  };

  const watchedValue = Form.useWatch(mode, form);
  const value = watchedValue ?? (taskDetail ? null : dayjs());

  // Mở drawer mobile: copy giá trị hiện tại vào temp
  const openDrawer = () => {
    const v = value ? dayjs(value) : dayjs();
    setTempDate(v.format('YYYY-MM-DD'));
    setTempTime(v.format('HH:mm'));
    setDrawerOpen(true);
  };

  // Xác nhận chọn ngày giờ trong drawer
  const confirmDrawer = () => {
    if (tempDate) {
      handleChange(dayjs(`${tempDate}T${tempTime || '08:00'}`));
    }
    setDrawerOpen(false);
  };

  return (
    <Form.Item
      name={mode}
      rules={[{ required: true, message: "Chọn ngày giờ" }]}
      className="!mb-0"
    >
      <div className="flex items-center gap-1 mb-1.5">
        <span className="text-slate-600 font-medium text-[13px]">{title}</span>
        <span className="text-rose-500">*</span>
      </div>

      {isMobile ? (
        <>
          {/* Trigger field – trông như 1 input bình thường */}
          <div
            onClick={openDrawer}
            style={{
              height: 38, border: '1px solid #cbd5e1', borderRadius: 8,
              padding: '0 12px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', cursor: 'pointer',
              background: '#fff', userSelect: 'none',
            }}
          >
            <span style={{ fontSize: 13, color: value ? '#334155' : '#9ca3af' }}>
              {value ? dayjs(value).format('DD/MM/YYYY HH:mm') : 'Chọn ngày giờ'}
            </span>
            <CalendarOutlined style={{ color: '#94a3b8', fontSize: 14 }} />
          </div>

          {/* Bottom Drawer – picker không tràn màn hình */}
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            placement="top"
            height="auto"
            title={title}
            styles={{ body: { padding: '16px 16px 8px' } }}
            extra={
              <button
                onClick={confirmDrawer}
                style={{
                  background: '#0ea5e9', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '6px 18px', fontWeight: 600,
                  fontSize: 14, cursor: 'pointer',
                }}
              >
                Xác nhận
              </button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>Ngày</div>
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  style={{
                    width: '100%', height: 44, borderRadius: 10,
                    border: '1px solid #e2e8f0', padding: '0 12px',
                    fontSize: 15, color: '#1e293b', background: '#f8fafc',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>Giờ</div>
                <input
                  type="time"
                  step={900}
                  value={tempTime}
                  onChange={(e) => setTempTime(e.target.value)}
                  style={{
                    width: '100%', height: 44, borderRadius: 10,
                    border: '1px solid #e2e8f0', padding: '0 12px',
                    fontSize: 15, color: '#1e293b', background: '#f8fafc',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ paddingBottom: 8 }} />
            </div>
          </Drawer>
        </>
      ) : (
        /* Desktop: Ant Design DatePicker */
        <DatePicker
          className="w-full !rounded-lg !border-slate-200 hover:!border-cyan-400 focus:!border-cyan-500 focus:!ring-1 focus:!ring-cyan-200 transition-all !shadow-sm"
          style={{ height: 38 }}
          value={value || dayjs().hour(8).minute(0)}
          format="DD/MM/YYYY HH:mm"
          placeholder="Chọn ngày giờ"
          inputReadOnly={true}
          popupStyle={{ zIndex: 2000 }}
          showTime={{
            format: 'HH:mm',
            use12Hours: false,
            minuteStep: 15,
            hourStep: 1,
            hideDisabledOptions: true
          }}
          onChange={handleChange}
          size="middle"
          disabledDate={disabledDateFunc}
        />
      )}
    </Form.Item>
  );
}

