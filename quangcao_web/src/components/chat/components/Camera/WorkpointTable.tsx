import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Stack,
  Button,
  Select,
  MenuItem,
  InputLabel,
  Grid,
  Typography,
  Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper
} from "@mui/material";

import { useApiHost } from "../../../../common/hooks/useApiHost";
import type { User } from "../../../../@types/user.type";
import { CenterBox } from "../commons/TitlePanel";
import { LogoAdmake } from "../Conversation/Header";
import type { Workpoint } from "../../../../@types/workpoint";

const NowToString = () => {
  const now = new Date();
  const formatted = now.toLocaleString('vi-VN', {
    weekday: 'long', // Thứ dài (Thứ Hai, Thứ Ba...)
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return(formatted);
}

export const CurrentDateTime = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000); // cập nhật mỗi giây để giờ hiện tại luôn mới

    return () => clearInterval(timer); // dọn dẹp khi component unmount
  }, []);

  return (
    <CenterBox>
      <Typography variant="body1">
        {NowToString()} {/* Hiển thị theo định dạng ngày giờ locale */}
      </Typography>
    </CenterBox>
  );
};



interface Props {
  workpoint: Workpoint | null;
}

const periods = [
  { key: 'morning', label: 'Sáng' },
  { key: 'noon', label: 'Chiều' },
  { key: 'evening', label: 'Tối' },
];

function WorkpointGrid({ workpoint }: Props) {
  const tabStyle = { maxHeight: 15, fontSize:12, fontWeight: 300, whiteSpace:'nowrap', maxWidth: 60};
  return (
     
    <TableContainer component={Paper} sx={{ maxWidth: 800, minHeight: 250, gap: 5, background:'none' }}>
      <Table>
        <TableHead>
          <TableRow sx={tabStyle}>
            <TableCell sx={tabStyle}>Buổi</TableCell>
            <TableCell sx={tabStyle}>Vào</TableCell>
            <TableCell sx={tabStyle}>Ra</TableCell>
            <TableCell sx={tabStyle}>Số giờ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {workpoint && workpoint.checklist && periods.map(({ key, label }) => {
            type Period = "morning" | "noon" | "evening";
            let periodData = null;

            if (key === "morning" || key === "noon" || key === "evening") {
                const _key: Period = key; // TypeScript OK vì đã kiểm tra
                periodData = workpoint?.checklist?.[_key];
            }

            // const periodData = workpoint?.checklist?.[key];
            return (
              <TableRow key={key} sx={{ height: 60 }}>
                <TableCell sx={tabStyle}>{label}</TableCell>
                <TableCell sx={tabStyle}>
                  {periodData?.in?.time ? 
                  <Box sx={{background:'#00B4B6',p:1,borderRadius:2,width: 72}}>
                  {new Date(periodData.in.time).toLocaleTimeString()}
                  </Box>
                  : '---'}
                </TableCell>
                <TableCell sx={tabStyle}>
                  {periodData?.out?.time ? 
                  <Box sx={{background:'#00B4B6',p:1,borderRadius:2,width: 72}}>
                  {new Date(periodData.out.time).toLocaleTimeString()}
                  </Box>
                  : '---'}
                </TableCell>
                <TableCell sx={tabStyle}>
                  {periodData?.workhour !== undefined ? periodData.workhour.toFixed(2) : '---'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
      

  );
}

export default WorkpointGrid;