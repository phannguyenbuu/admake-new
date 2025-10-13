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

import TextField from "@mui/material/TextField";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

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

interface HolidayBoardProps {
  // mode: { adminMode: boolean; userMode: boolean };
  
  userId: string | undefined;
  open: boolean;
  onCancel: () => void;
}

const HolidayBoard = ({ userId, open, onCancel }: HolidayBoardProps) => {
    const { mutate, data, isPending, isError, error } = useTaskByUserMutation();
    
    useEffect(() => {
        if (userId) {
            mutate(userId); // userId đã chắc chắn là string, không undefined
        }
    },[]);

    useEffect(() => {
        if(!data) return;
        console.log('Working tasks', data);
    },[data]);

    const handleAddHolidayClick = () => {
      onCancel();
    }

    return (
    <Modal open={open} onCancel={onCancel} footer={null} width={900} height={900}
      style={{marginTop:0}}>
      <Stack spacing = {2} py={2} alignItems="flex-start" justifyContent="flex-start"
          style={{marginTop:0}}>
        
        <HDatePicker />
        <Button style={{borderRadius:10, backgroundColor:"#00B4B6", color:"#fff"}} 
        onClick={handleAddHolidayClick}
          fullWidth>
          Thêm ngày nghỉ phép</Button>
      </Stack>
    </Modal>
    )
}

export default HolidayBoard;



interface DatePickerProps {
  timeValue?: Dayjs | null;
  disabledDateFunc?: (date: Dayjs) => boolean;
  onChange?: (date: Dayjs | null) => void;
  title?: string;
}

function HDatePicker({

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
