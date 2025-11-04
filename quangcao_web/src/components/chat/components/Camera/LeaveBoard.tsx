import React, { useState, useEffect, useMemo } from "react";
import Modal from "antd/es/modal/Modal";
import JobTimeAndProcess from "../../../dashboard/work-tables/task/JobTimeAndProcess ";
import { Stack, Box, Button, Checkbox, Typography } from "@mui/material";
import { useMutation } from '@tanstack/react-query';
import type { Task } from "../../../../@types/work-space.type";
import { useApiHost } from "../../../../common/hooks/useApiHost";
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import CommentIcon from '@mui/icons-material/Comment';
import { getTitleByStatus } from "../../../dashboard/work-tables/Managerment";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";

import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import dayjs, { Dayjs } from "dayjs";

import type { Leave } from "../../../../@types/leave.type";


import "antd/dist/reset.css"; // hoặc `antd/dist/antd.css` tùy version
const fetchTaskByUser = async (userId: string): Promise<Task[]> => {
  const response = await fetch(`${useApiHost()}/task/by_user/${userId}`);
  if (!response.ok) {
    throw new Error(`Error fetching tasks for user ${userId}`);
  }
  return response.json();
};

// const useTaskByUserMutation = () => {
//   return useMutation<Task[], Error, string>({
//     mutationFn: fetchTaskByUser,
//   });
// };

interface LeaveBoardProps {
  // mode: { adminMode: boolean; userMode: boolean };
  
  userId?: string;
  open?: boolean;
  onCancel: () => void;
}


// const { TabPane } = Tabs;

function LeaveDatePickerOneDay({
  value,
  onChange,
  checkedMorning,
  checkedAfternoon,
  onCheckMorning,
  onCheckAfternoon,
}: {
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  checkedMorning: boolean;
  checkedAfternoon: boolean;
  onCheckMorning: (checked: boolean) => void;
  onCheckAfternoon: (checked: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleChange = (newValue: Dayjs | null) => {
    onChange(newValue);
    setOpen(false); // tự động đóng sau khi chọn ngày
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label="Ngày xin nghỉ"
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        value={value}
        onChange={handleChange}
        slots={{ textField: TextField }} // Gán TextField cho slot textField
        slotProps={{
          textField: {
            // Thêm props cho TextField nếu cần
            variant: 'outlined',
            size: 'small',
            // ...
          }
        }}
        disablePast
      />
      <Stack direction="row" spacing={2} mt={1}>
        <Checkbox checked={checkedMorning} onChange={(e) => onCheckMorning(e.target.checked)} />
        <span style={{marginTop: 10}}>Sáng</span>
        <Checkbox checked={checkedAfternoon} onChange={(e) => onCheckAfternoon(e.target.checked)} />
        <span style={{marginTop: 10}}>Chiều</span>
      </Stack>
    </LocalizationProvider>
  );
}

function LeaveDatePickerMultipleDays({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
}: {
  startValue: Dayjs | null;
  endValue: Dayjs | null;
  onStartChange: (value: Dayjs | null) => void;
  onEndChange: (value: Dayjs | null) => void;
}) {
  const daysDiff =
    startValue && endValue
      ? endValue.startOf("day").diff(startValue.startOf("day"), "day") + 1
      : 0;

  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const handleStartChange = (newValue: Dayjs | null) => {
    onStartChange(newValue);
    setOpenStart(false); // đóng popup ngày bắt đầu
  };

  const handleEndChange = (newValue: Dayjs | null) => {
    onEndChange(newValue);
    setOpenEnd(false); // đóng popup ngày kết thúc
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack direction="column" spacing={2}>
        <DatePicker
          label="Ngày bắt đầu"
          open={openStart}
          onOpen={() => setOpenStart(true)}
          onClose={() => setOpenStart(false)}
          value={startValue}
          onChange={handleStartChange}
          slots={{ textField: TextField }} // Gán TextField cho slot textField
          slotProps={{
            textField: {
              // Thêm props cho TextField nếu cần
              variant: 'outlined',
              size: 'small',
              // ...
            }
          }}
          disablePast
        />
        <DatePicker
          label="Ngày kết thúc"
          open={openEnd}
          onOpen={() => setOpenEnd(true)}
          onClose={() => setOpenEnd(false)}
          value={endValue}
          onChange={handleEndChange}
          slots={{ textField: TextField }} // Gán TextField cho slot textField
          slotProps={{
            textField: {
              // Thêm props cho TextField nếu cần
              variant: 'outlined',
              size: 'small',
              // ...
            }
          }}
          disablePast
          minDate={startValue ?? undefined}
        />
      </Stack>
      <div style={{ marginTop: 12 }}>
        Số ngày nghỉ: <strong>{daysDiff > 0 ? daysDiff : 0}</strong>
      </div>
    </LocalizationProvider>
  );
}


const postLeaveRequest = async (payload: Leave): Promise<any> => {
  const res = await fetch(`${useApiHost()}/leave/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to create leave request');
  }
  return res.json();
};

export const LeaveBoard = ({ userId, open, onCancel }: LeaveBoardProps) => {
  const [tab, setTab] = useState<"oneDay" | "multiDays">("oneDay");

  // State ngày cho nghỉ 1 ngày
  const [oneDayDate, setOneDayDate] = useState<Dayjs | null>(null);
  const [morningChecked, setMorningChecked] = useState(true);
  const [afternoonChecked, setAfternoonChecked] = useState(true);
  const [reason, setReason] = useState<string>('');
  // State ngày cho nghỉ nhiều ngày
  const [multiStartDate, setMultiStartDate] = useState<Dayjs | null>(null);
  const [multiEndDate, setMultiEndDate] = useState<Dayjs | null>(null);

  const mutation = useMutation<any, Error, Leave>({
    mutationFn: postLeaveRequest,
    onSuccess: () => {
      onCancel();
    },
    onError: (error: Error) => {
      console.error('Lỗi khi tạo yêu cầu nghỉ phép:', error.message);
    }
  });


  const handleAddLeaveClick = () => {
    if (!userId) return;

    let start_time: string | null = null;
    let end_time: string | null = null;
    
    if (tab === 'oneDay') {
      if (!oneDayDate) return;
      const formattedDate = oneDayDate.format('YYYY-MM-DD');
      start_time = formattedDate;
      end_time = formattedDate;
    } else {
      if (!multiStartDate || !multiEndDate) return;
      start_time = multiStartDate.format('YYYY-MM-DD');
      end_time = multiEndDate.format('YYYY-MM-DD');
    }

    mutation.mutate({
      user_id: userId,
      start_time: start_time!,
      end_time: end_time!,
      morning: morningChecked,
      noon: afternoonChecked,
      reason,
    });
  };

  return (
    <Modal open={open} onCancel={onCancel} style={{ padding: 20 }}
      okButtonProps={{ style: { display: 'none' } }}
      cancelButtonProps={{ style: { display: 'none' } }}
    >
      <Stack>
        <Tabs
          value={tab}
          onChange={(e, val) => setTab(val)}
          aria-label="Chọn loại nghỉ phép"
          centered
        >
          <Tab label="1 ngày" value="oneDay" />
          <Tab label="nhiều ngày" value="multiDays" />
        </Tabs>

        <div style={{ marginTop: 20 }}>
          {tab === "oneDay" && (
            <LeaveDatePickerOneDay
              value={oneDayDate}
              onChange={setOneDayDate}
              checkedMorning={morningChecked}
              checkedAfternoon={afternoonChecked}
              onCheckMorning={setMorningChecked}
              onCheckAfternoon={setAfternoonChecked}
            />
          )}
          {tab === "multiDays" && (
            <LeaveDatePickerMultipleDays
              startValue={multiStartDate}
              endValue={multiEndDate}
              onStartChange={setMultiStartDate}
              onEndChange={setMultiEndDate}
            />
          )}
        </div>

        <TextField
          label="Lý do xin nghỉ"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={3} // số dòng nhập liệu multiline
          variant="outlined"
          fullWidth
          margin="normal"
          placeholder="Nhập lý do xin nghỉ..."
      />

        <Button
          fullWidth
          style={{ marginTop: 20, borderRadius: 10, backgroundColor: "#00B4B6", color: "#fff" }}
          onClick={handleAddLeaveClick}
          disabled={
            (tab === "oneDay" && !oneDayDate) ||
            (tab === "multiDays" && (!multiStartDate || !multiEndDate))
          }
        >
          Tạo yêu cầu nghỉ phép
        </Button>
      </Stack>
    </Modal>
  );
};

export default LeaveBoard;

