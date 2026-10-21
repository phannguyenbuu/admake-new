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
      <Typography variant="body1" sx={{ fontSize: { xs: 13, sm: 15 }, fontWeight: 600, color: "#334155" }}>
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
      {workpoint && !isRemoveChecklist && (
        <Button
          sx={{
            borderRadius: 20,
            border: '1px solid #f97316',
            color: '#ea580c',
            mt: 0.5,
            height: 32,
            px: 2,
            maxWidth: 320,
            mb: 1,
            fontSize: 12,
            fontWeight: 600,
            textTransform: "none",
            gap: 1,
          }}
          onClick={handleRemoveChecklist}
        >
          <img src="/remove-bookmark-svgrepo-com.svg" alt="ADMAKE" style={{ width: 18 }} />
          Xóa điểm danh gần nhất
        </Button>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,
          minHeight: 180,
          background: "rgba(255, 255, 255, 0.9)",
          border: "1px solid #e2e8f0",
          borderRadius: 2.5,
          overflow: "hidden",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          boxSizing: "border-box",
        }}
      >
        <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell sx={{ width: "27%", py: 1, px: 0.8, fontSize: 13, fontWeight: 700, color: "#475569" }}>
                Buổi
              </TableCell>
              <TableCell sx={{ width: "25%", py: 1, px: 0.5, fontSize: 13, fontWeight: 700, color: "#475569", textAlign: "center" }}>
                Vào
              </TableCell>
              <TableCell sx={{ width: "25%", py: 1, px: 0.5, fontSize: 13, fontWeight: 700, color: "#475569", textAlign: "center" }}>
                Ra
              </TableCell>
              <TableCell sx={{ width: "23%", py: 1, px: 0.5, fontSize: 13, fontWeight: 700, color: "#475569", textAlign: "center" }}>
                Số giờ
              </TableCell>
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
                <TableRow key={key} sx={{ height: 48, "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell
                    sx={{
                      py: 1,
                      px: 0.8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: isOvertimeRow ? "#FFA000" : "#1e293b",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                    {isOvertimeRow && isSunday && !workInSunday && key !== "evening" && (
                      <Typography variant="caption" sx={{ display: 'block', fontSize: 9, color: '#FFA000' }}>
                        Chủ nhật
                      </Typography>
                    )}
                  </TableCell>

                  {/* Cột Vào */}
                  <TableCell sx={{ py: 1, px: 0.5, textAlign: "center" }}>
                    {periodData?.in?.time ? (
                      <Box
                        sx={{
                          background: colorIn,
                          color: "#fff",
                          py: 0.4,
                          px: 0.6,
                          borderRadius: 1.5,
                          fontSize: 11,
                          fontWeight: 700,
                          display: "inline-block",
                          minWidth: 44,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                        }}
                      >
                        {new Date(periodData.in.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Box>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </TableCell>

                  {/* Cột Ra */}
                  <TableCell sx={{ py: 1, px: 0.5, textAlign: "center" }}>
                    {periodData?.out?.time ? (
                      <Box
                        sx={{
                          background: colorOut,
                          color: "#fff",
                          py: 0.4,
                          px: 0.6,
                          borderRadius: 1.5,
                          fontSize: 11,
                          fontWeight: 700,
                          display: "inline-block",
                          minWidth: 44,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                        }}
                      >
                        {new Date(periodData.out.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Box>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </TableCell>

                  {/* Cột Số giờ */}
                  <TableCell sx={{ py: 1, px: 0.5, textAlign: "center" }}>
                    {periodData?.in?.time ? (
                      <Box sx={{ color: isOvertimeRow ? '#FFA000' : '#0f172a', fontWeight: 700, fontSize: 12 }}>
                        {periodData?.out?.time && periodData?.workhour !== undefined
                          ? `${periodData.workhour.toFixed(2)}h`
                          : periodData?.in?.time && !periodData?.out?.time
                            ? <span style={{ color: isOvertimeRow ? '#FFA000' : '#888', fontSize: 11 }}>{isOvertimeRow ? '⏳ TC' : '⏳'}</span>
                            : '—'}
                      </Box>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
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
