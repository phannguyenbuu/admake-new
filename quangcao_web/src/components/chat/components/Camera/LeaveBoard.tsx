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


import "antd/dist/reset.css"; // hoặc `antd/dist/antd.css` tùy version
const fetchTaskByUser = async (userId: string): Promise<Task[]> => {
  const response = await fetch(`${useApiHost()}/task/by_user/${userId}`);
  if (!response.ok) {
    throw new Error(`Error fetching tasks for user ${userId}`);
  }
  return response.json();
};

const useTaskByUserMutation = () => {
  return useMutation<Task[], Error, string>({
    mutationFn: fetchTaskByUser,
  });
};

interface LeaveBoardProps {
  // mode: { adminMode: boolean; userMode: boolean };
  
  userId: string | undefined;
  open: boolean;
  onCancel: () => void;
}


const { TabPane } = Tabs;

interface LeaveBoardProps {
  userId: string;
  open: boolean;
  onCancel: () => void;
}

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
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label="Chọn ngày nghỉ"
        value={value}
        onChange={onChange}
        renderInput={(params) => <TextField {...params} />}
        disablePast
      />
      <Stack direction="row" spacing={2} mt={1}>
        <Checkbox
          checked={checkedMorning}
          onChange={(e) => onCheckMorning(e.target.checked)}
        />
        <span>Sáng</span>
        <Checkbox
          checked={checkedAfternoon}
          onChange={(e) => onCheckAfternoon(e.target.checked)}
        />
        <span>Chiều</span>
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack direction="row" spacing={2}>
        <DatePicker
          label="Ngày bắt đầu"
          value={startValue}
          onChange={onStartChange}
          renderInput={(params) => <TextField {...params} />}
          disablePast
          maxDate={endValue ?? undefined}
        />
        <DatePicker
          label="Ngày kết thúc"
          value={endValue}
          onChange={onEndChange}
          renderInput={(params) => <TextField {...params} />}
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

export const LeaveBoard = ({ userId, open, onCancel }: LeaveBoardProps) => {
  const [tab, setTab] = useState<"oneDay" | "multiDays">("oneDay");

  // State ngày cho nghỉ 1 ngày
  const [oneDayDate, setOneDayDate] = useState<Dayjs | null>(null);
  const [morningChecked, setMorningChecked] = useState(true);
  const [afternoonChecked, setAfternoonChecked] = useState(true);

  // State ngày cho nghỉ nhiều ngày
  const [multiStartDate, setMultiStartDate] = useState<Dayjs | null>(null);
  const [multiEndDate, setMultiEndDate] = useState<Dayjs | null>(null);

  const handleAddLeaveClick = () => {
    if (tab === "oneDay") {
      console.log("Xin nghỉ 1 ngày:", {
        date: oneDayDate?.format("DD/MM/YYYY"),
        morning: morningChecked,
        afternoon: afternoonChecked,
      });
    } else {
      const days =
        multiStartDate && multiEndDate
          ? multiEndDate.startOf("day").diff(multiStartDate.startOf("day"), "day") + 1
          : 0;
      console.log("Xin nghỉ nhiều ngày:", {
        startDate: multiStartDate?.format("DD/MM/YYYY"),
        endDate: multiEndDate?.format("DD/MM/YYYY"),
        daysOff: days > 0 ? days : 0,
      });
    }
    onCancel();
  };

  return (
    <Modal open={open} onClose={onCancel} style={{ padding: 20 }}>
      <div style={{ width: 500, margin: "auto", backgroundColor: "#fff", padding: 24 }}>
        <Tabs
          value={tab}
          onChange={(e, val) => setTab(val)}
          aria-label="Chọn loại nghỉ phép"
          centered
        >
          <Tab label="Xin nghỉ 1 ngày" value="oneDay" />
          <Tab label="Xin nghỉ nhiều ngày" value="multiDays" />
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

        <Button
          fullWidth
          style={{ marginTop: 20, borderRadius: 10, backgroundColor: "#00B4B6", color: "#fff" }}
          onClick={handleAddLeaveClick}
          disabled={
            (tab === "oneDay" && !oneDayDate) ||
            (tab === "multiDays" && (!multiStartDate || !multiEndDate))
          }
        >
          Thêm ngày nghỉ phép
        </Button>
      </div>
    </Modal>
  );
};

export default LeaveBoard;

interface DatePickerProps {
  timeValue?: Dayjs | null;
  disabledDateFunc?: (date: Dayjs) => boolean;
  onChange?: (date: Dayjs | null) => void;
  title?: string;
}

function LeaveDatePicker({

  title = "Chọn ngày phép",
}: DatePickerProps) {
  const [value, setValue] = React.useState(null);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label="Chọn ngày"
        value={value}
        //@ts-ignore
        onChange={(newValue) => setValue(newValue)}
        //@ts-ignore
        renderInput={(params) => <TextField {...params} />}
      />
    </LocalizationProvider>
  );
}
