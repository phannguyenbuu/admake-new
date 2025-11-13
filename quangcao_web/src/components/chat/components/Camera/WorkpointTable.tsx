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
import { CenterBox } from "../commons/TitlePanel";
import { LogoAdmake } from "../Conversation/Header";
import type { Workpoint } from "../../../../@types/workpoint";
import { useUser } from "../../../../common/hooks/useUser";
import { Modal } from "antd";

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
  fetchWorkpoint: () => void;
}

const periods = [
  { key: 'morning', label: 'Sáng' },
  { key: 'noon', label: 'Chiều' },
  { key: 'evening', label: 'Tối' },
];

function currentDay() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // tháng từ 0-11, nên +1
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function WorkpointGrid({ workpoint, fetchWorkpoint }: Props) {
  const tabStyle = { maxHeight: 15, fontSize:14, fontWeight: 700, whiteSpace:'nowrap', maxWidth: 60};
  const [isRemoveChecklist, setIsRemoveChecklist] = useState<boolean>(false);
  const {userId,userLeadId} = useUser();

  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const handleRemoveChecklist = () => {
    setShowConfirm(true);
  };

  const confirmRemoveChecklist = async () => {
    setShowConfirm(false);
    setIsRemoveChecklist(true);

    try {
      const url = `${useApiHost()}/workpoint/remove/${workpoint?.user_id}/?day=${currentDay()}`;
      const response = await fetch(url, { method: 'PUT' });
      if (!response.ok) throw new Error(`Network error: ${response.status}`);
      const result = await response.json();
      fetchWorkpoint();
      return result;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };

  return (
     <>
     {workpoint && !isRemoveChecklist &&
                   <Button 
                     sx={{
                         borderRadius: 10,
                         border:'1px solid orange', color:'orange',
                         mt: 0.5, height: 30,maxWidth:300, mb:1 }} onClick={handleRemoveChecklist}>
                          <img src="/remove-bookmark-svgrepo-com.svg" alt="ADMAKE" style={{width:20}}/>
                     Xóa điểm danh gần nhất
                   </Button>}

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
                  <Box sx={{background:'#00B4B6',p:1,borderRadius:2}}>
                  {new Date(periodData.in.time).toLocaleTimeString()}
                  </Box>
                  : '---'}
                </TableCell>
                <TableCell sx={tabStyle}>
                  {periodData?.out?.time ? 
                  <Box sx={{background:'#00B4B6',p:1,borderRadius:2}}>
                  {new Date(periodData.out.time).toLocaleTimeString()}
                  </Box>
                  : '---'}
                </TableCell>
                <TableCell sx={tabStyle}>
                  {periodData?.out?.time && periodData?.workhour !== undefined ? 
                    periodData.workhour.toFixed(2) 
                    : '---'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>

    <Modal
      title="Bạn có chắc muốn xóa điểm danh ?"
      open={showConfirm}
      onOk = {confirmRemoveChecklist}
      onCancel={() => setShowConfirm(false)}
      >
      </Modal>
    
    </>

  );
}

export default WorkpointGrid;