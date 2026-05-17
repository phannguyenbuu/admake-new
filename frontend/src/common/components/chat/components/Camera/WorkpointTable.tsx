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
import { useWorkpointSetting } from "../../../../common/hooks/useWorkpointSetting";
import { Modal } from "antd";

const NowToString = () => {
  const now = new Date();
  const formatted = now.toLocaleString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return (formatted);
}

export const CurrentDateTime = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <CenterBox>
      <Typography variant="body1">
        {NowToString()}
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
  { key: 'evening', label: 'Tối (Tăng ca)', isOvertime: true },
];

function currentDay() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Xác định màu của ô check-in/check-out:
 *  - Vàng  (#FFA000): buổi tối (evening) hoặc Chủ nhật (khi không cấu hình làm CN)
 *  - Xanh  (#00B4B6): check-in bình thường
 *  - Đỏ    (#E53935): check-out bình thường
 */
function getCheckColor(
  isIn: boolean,
  isOvertime: boolean,   // buổi tối
  isSunday: boolean,     // ngày Chủ nhật
  workInSunday: boolean  // cấu hình có làm CN không
): string {
  const isOvertimeRow = isOvertime || (isSunday && !workInSunday);
  if (isOvertimeRow) return "#FFA000"; // vàng — tăng ca
  return isIn ? "#00B4B6" : "#E53935"; // xanh check-in / đỏ check-out
}

function WorkpointGrid({ workpoint, fetchWorkpoint }: Props) {
  const tabStyle = { maxHeight: 15, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', maxWidth: 60 };
  const [isRemoveChecklist, setIsRemoveChecklist] = useState<boolean>(false);
  const { userId, userLeadId } = useUser();
  const { workpointSetting } = useWorkpointSetting();
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  // Xác định ngày của workpoint (để kiểm tra Chủ nhật)
  const workpointDate = workpoint?.createdAt ? new Date(workpoint.createdAt) : new Date();
  const isSunday = workpointDate.getDay() === 0; // 0 = Chủ nhật
  const workInSunday = !!(workpointSetting?.work_in_sunday);

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
            border: '1px solid orange', color: 'orange',
            mt: 0.5, height: 30, maxWidth: 300, mb: 1
          }} onClick={handleRemoveChecklist}>
          <img src="/remove-bookmark-svgrepo-com.svg" alt="ADMAKE" style={{ width: 20 }} />
          Xóa điểm danh gần nhất
        </Button>}

      <TableContainer component={Paper} sx={{ maxWidth: 800, minHeight: 250, gap: 5, background: 'none' }}>
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
            {workpoint && workpoint.checklist && periods.map(({ key, label, isOvertime }) => {
              type Period = "morning" | "noon" | "evening";
              let periodData = null;

              if (key === "morning" || key === "noon" || key === "evening") {
                const _key: Period = key;
                periodData = workpoint?.checklist?.[_key];
              }

              // Màu tăng ca: buổi tối, hoặc Chủ nhật khi không làm CN
              const isOvertimeRow = !!(isOvertime) || (isSunday && !workInSunday);
              const colorIn = getCheckColor(true, !!(isOvertime), isSunday, workInSunday);
              const colorOut = getCheckColor(false, !!(isOvertime), isSunday, workInSunday);

              return (
                <TableRow key={key} sx={{ height: 60 }}>
                  <TableCell sx={{
                    ...tabStyle,
                    // Label buổi tối / CN cũng hiện màu vàng
                    color: isOvertimeRow ? "#FFA000" : "inherit",
                  }}>
                    {label}
                    {isOvertimeRow && isSunday && !workInSunday && key !== "evening" && (
                      <Typography variant="caption" sx={{ display: 'block', fontSize: 9, color: '#FFA000' }}>
                        Chủ nhật
                      </Typography>
                    )}
                  </TableCell>

                  {/* Cột Vào */}
                  <TableCell sx={tabStyle}>
                    {periodData?.in?.time ?
                      <Box sx={{ background: colorIn, p: 1, borderRadius: 2 }}>
                        {new Date(periodData.in.time).toLocaleTimeString()}
                      </Box>
                      : '---'}
                  </TableCell>

                  {/* Cột Ra */}
                  <TableCell sx={tabStyle}>
                    {periodData?.out?.time ?
                      <Box sx={{ background: colorOut, p: 1, borderRadius: 2 }}>
                        {new Date(periodData.out.time).toLocaleTimeString()}
                      </Box>
                      : '---'}
                  </TableCell>

                  {/* Cột Số giờ */}
                  <TableCell sx={tabStyle}>
                    {periodData?.in?.time ? (
                      <Box sx={{ color: isOvertimeRow ? '#FFA000' : 'inherit', fontWeight: isOvertimeRow ? 700 : 400 }}>
                        {periodData?.out?.time && periodData?.workhour !== undefined
                          ? `${periodData.workhour.toFixed(2)}h`
                          : periodData?.in?.time && !periodData?.out?.time
                            // Check-in nhưng chưa check-out: hiện dấu ⏳ nhưng không nhân hệ số (chỉ trừ khi tăng ca)
                            ? <span style={{ color: isOvertimeRow ? '#FFA000' : '#888', fontSize: 11 }}>
                              {isOvertimeRow ? '⏳ TC' : '⏳'}
                            </span>
                            : '---'}
                      </Box>
                    ) : '---'}
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
        onOk={confirmRemoveChecklist}
        onCancel={() => setShowConfirm(false)}
      >
      </Modal>

    </>

  );
}

export default WorkpointGrid;