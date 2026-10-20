import { Modal, notification, Input, InputNumber, Button, Tooltip } from "antd";
import { TOKEN_LABEL } from "../../../common/config";
import React, { useEffect, useState } from "react";
import { useApiHost, useApiStatic } from "../../../common/hooks/useApiHost";
import { Stack, Box, Typography } from "@mui/material";
import QRCode from "../../../components/chat/components/QRCode";
import DownloadIcon from "@mui/icons-material/Download";
import { CenterBox } from "../../../components/chat/components/commons/TitlePanel";
import type { Workpoint, WorkDaysProps, PeriodData, Checklist } from "../../../@types/workpoint";
import DeleteConfirm from "../../../components/DeleteConfirm";
import dayjs from "dayjs";
import { useWorkpointSetting } from "../../../common/hooks/useWorkpointSetting";
import {
  buildMonthlyStatuses,
  createEmptyStatuses,
} from "./workdays.utils";

interface QRColumnProps {
  record: WorkDaysProps;
}

export const QRColumn: React.FC<QRColumnProps> = ({ record }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WorkDaysProps | null>(null);

  const handleOpenModal = () => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  return (
    <>
      <DownloadIcon sx={{ width: 40, height: 40, cursor: "pointer" }} onClick={handleOpenModal} />

      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        width={300}
        title={`Mã QR của ${record.username}`}
      >
        {selectedRecord && (
          <Box display="flex" justifyContent="center">
            <QRCode
              title="Download và gửi cho nhân sự"
              filename={`qrcode-admake-${record.user_id}.png`}
              url={`${window.location.origin}/point/${selectedRecord.user_id}/`}
            />
          </Box>
        )}
      </Modal>
    </>
  );
};

interface ParamWorkDaysProps {
  record: WorkDaysProps;
  selectedMonth?: string;
}

function resolveStaticImageUrl(staticBase: string, imagePath?: string | null): string {
  const raw = (imagePath || "").trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/api/static/") || raw.startsWith("/static/")) return raw;
  if (raw.startsWith("uploads/") || raw.startsWith("thumbs/")) return `${staticBase}/${raw}`;
  if (raw.startsWith("/")) return `${staticBase}${raw}`;
  return `${staticBase}/${raw}`;
}

export default function WorkDays({ record, selectedMonth }: ParamWorkDaysProps) {
  const { items, leaves, username } = record;
  const { workpointSetting } = useWorkpointSetting();
  const workInSunday = !!(workpointSetting?.work_in_sunday);

  const baseDate = selectedMonth
    ? dayjs(`${selectedMonth}-01`, "YYYY-MM-DD").toDate()
    : new Date();

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = new Date().getDate();

  const staticBase = useApiStatic();
  const [totalHour, setTotalHour] = useState<{ morning: number; noon: number; evening: number } | null>(null);
  const [mainData, setMainData] = useState<Workpoint[]>([]);
  const [modalImg, setModalImg] = useState<PeriodData | null>(null);
  const [statuses, setStatuses] = useState(createEmptyStatuses(daysInMonth));
  const [modalVisible, setModalVisible] = useState(false);
  const [supplementOutTime, setSupplementOutTime] = useState<string>("21:30");
  const [supplementWorkhour, setSupplementWorkhour] = useState<number>(2.5);
  const [supplementNote, setSupplementNote] = useState<string>("");
  const [isSavingSupplement, setIsSavingSupplement] = useState<boolean>(false);

  const hasUnclosedOvertime = React.useMemo(() => {
    return statuses.some((day) => day[2] === "overtime-in");
  }, [statuses]);

  useEffect(() => {
    setMainData(record.items);
  }, [record]);

  useEffect(() => {
    const { statuses: monthlyStatuses, totalHour: total } = buildMonthlyStatuses({
      items,
      leaves,
      year,
      month,
      daysInMonth,
      workInSunday,
    });

    setTotalHour(total);
    setStatuses(monthlyStatuses);
  }, [items, leaves, year, month, daysInMonth, workInSunday]);

  type StatusKey = "in" | "out" | "overtime-in" | "overtime-out" | "off" | "null";

  const colors: Record<StatusKey, string> = {
    in: "green",
    out: "red",
    "overtime-in": "#DC2626",   // ĐỎ — Cảnh báo: Tăng ca chưa check-out!
    "overtime-out": "#FFA000",  // Vàng cam — Tăng ca check-out hoàn thành
    off: "#999",
    null: "white",
  };

  const handleOk = () => {
    setModalVisible(false);
    setModalImg(null);
  };

  const handleSaveSupplementOvertime = async () => {
    if (!modalImg?.workpoint_id) {
      notification.error({ message: "Không tìm thấy mã chấm công" });
      return;
    }
    setIsSavingSupplement(true);
    try {
      const token = localStorage.getItem(TOKEN_LABEL) || sessionStorage.getItem(TOKEN_LABEL) || "";
      const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${useApiHost()}/workpoint/${modalImg.workpoint_id}/supplement-overtime`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          period: modalImg.periodKey || "evening",
          workhour: supplementWorkhour,
          out_time: supplementOutTime,
          note: supplementNote,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        notification.success({ message: "Đã bổ sung giờ tăng ca thành công!" });
        const updatedWp = data.workpoint;
        setMainData((prev) =>
          prev.map((item) => (String(item.id) === String(updatedWp.id) ? updatedWp : item))
        );
        const periodKey = (modalImg.periodKey || "evening") as keyof Checklist;
        const updatedPeriod = updatedWp.checklist?.[periodKey];
        if (updatedPeriod) {
          setModalImg((prev) => (prev ? {
            ...prev,
            ...updatedPeriod,
            workpoint_id: updatedWp.id,
            periodKey: periodKey,
          } : prev));
        }
      } else {
        notification.error({ message: "Lỗi bổ sung giờ tăng ca", description: data.error });
      }
    } catch (err) {
      console.error(err);
      notification.error({ message: "Lỗi kết nối", description: "Vui lòng thử lại" });
    } finally {
      setIsSavingSupplement(false);
    }
  };

  const handleLeaveDelete = async (leaveId: string | number | undefined) => {
    try {
      const response = await fetch(`${useApiHost()}/leave/${leaveId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        notification.success({ message: "Xóa nghỉ phép thành công!" });
        setModalVisible(false);
        setModalImg(null);
      } else {
        throw new Error("Xóa thất bại");
      }
    } catch (error) {
      console.error("Failed to delete leave:", error);
      notification.error({ message: "Xóa nghỉ phép thất bại!" });
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1}>
        <Stack sx={{ background: "#999", borderRadius: 8, width: 30, pt: 2 }}>
          <Typography color="#fff" textAlign="center" fontSize={10} fontWeight={300}>
            {((totalHour?.morning || 0) + (totalHour?.noon || 0)).toFixed(2)}
          </Typography>
          <Typography color={hasUnclosedOvertime ? "#FEE2E2" : "#fff"} textAlign="center" fontSize={10} fontWeight={hasUnclosedOvertime ? 700 : 300}>
            {(totalHour?.evening || 0).toFixed(2)}
            {hasUnclosedOvertime && (
              <Tooltip title="Có ca tăng ca chưa check-out, kế toán cần kiểm tra/bổ sung giờ">
                <span style={{ color: "#EF4444", fontSize: 10, fontWeight: "bold", marginLeft: 1 }}>!</span>
              </Tooltip>
            )}
          </Typography>
        </Stack>

        <div style={{ width: "100%", maxWidth: "100%", overflowX: "auto" }}>
          <div style={{ display: "flex", width: "max-content" }}>
            {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
              const date = new Date(year, month, dayIndex + 1);
              const isSunday = date.getDay() === 0;

              return (
                <div
                  key={dayIndex}
                  style={{
                    borderRight: date.getDate() === todayDate ? "3px solid blue" : "none",
                    textAlign: "center",
                    borderRadius: 1,
                    maxWidth: 18,
                    marginRight: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      marginBottom: 4,
                      color: isSunday ? "red" : "black",
                    }}
                  >
                    {date.getDate()}
                  </div>

                  {[0, 1, 2].map((periodIndex) => {
                    const status = statuses[dayIndex]?.[periodIndex] ?? null;
                    let imgUrl: PeriodData | null = null;

                    if (status) {
                      if (status.startsWith("off")) {
                        imgUrl = {
                          id: status.split("/").pop()?.replace("id:", ""),
                          text: status.substring(4).split("/")[0],
                          status: "off",
                          day: date,
                          period: periodIndex,
                        } as PeriodData;
                      } else if (mainData?.length) {
                        const periodKey = ["morning", "noon", "evening"][periodIndex] as keyof Checklist;

                        for (const item of mainData) {
                          if (!item.createdAt) continue;
                          const dateParts = item.createdAt.slice(0, 10).split("-");
                          if (dateParts.length !== 3) continue;
                          const itemYear = parseInt(dateParts[0], 10);
                          const itemMonth = parseInt(dateParts[1], 10) - 1;
                          const itemDay = parseInt(dateParts[2], 10);

                          if (
                            itemDay === date.getDate() &&
                            itemMonth === date.getMonth() &&
                            itemYear === date.getFullYear()
                          ) {
                            const periodData = item.checklist?.[periodKey];
                            if (periodData) {
                              imgUrl = {
                                ...periodData,
                                workpoint_id: item.id,
                                periodKey: periodKey,
                                day: date,
                                period: periodIndex,
                              };
                              break;
                            }
                          }
                        }
                      }
                    }

                    const isUnclosedOvertime = status === "overtime-in";
                    const bgColor = status && status.startsWith("off")
                      ? "#999"
                      : colors[(status ?? "null") as StatusKey];

                    const dotNode = (
                      <div
                        key={periodIndex}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: bgColor,
                          border: isUnclosedOvertime
                            ? "2px solid #B91C1C"
                            : isSunday
                            ? "1px solid red"
                            : "1px solid #999",
                          marginBottom: 1,
                          cursor: imgUrl ? "pointer" : "default",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: "bold",
                          boxShadow: isUnclosedOvertime ? "0 0 4px #EF4444" : "none",
                        }}
                        onClick={() => {
                          if (imgUrl) {
                            setModalImg(imgUrl);
                            if (imgUrl.in?.time) {
                              try {
                                const inH = dayjs(imgUrl.in.time).hour();
                                const inM = dayjs(imgUrl.in.time).minute();
                                const outH = Math.min(22, inH + 3);
                                setSupplementOutTime(`${String(outH).padStart(2, "0")}:${String(inM).padStart(2, "0")}`);
                              } catch {
                                setSupplementOutTime("21:30");
                              }
                            } else {
                              setSupplementOutTime("21:30");
                            }
                            setSupplementWorkhour(imgUrl.workhour || 2.5);
                            setSupplementNote("");
                            setModalVisible(true);
                          }
                        }}
                      >
                        {isUnclosedOvertime ? "!" : ""}
                      </div>
                    );

                    return isUnclosedOvertime ? (
                      <Tooltip key={periodIndex} title="Tăng ca chưa check-out! Click để xem & kế toán bổ sung giờ">
                        {dotNode}
                      </Tooltip>
                    ) : (
                      dotNode
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Stack>

      <Modal
        open={modalVisible}
        onOk={handleOk}
        onCancel={handleOk}
        footer={null}
        title=""
        okText="OK"
        cancelButtonProps={{ style: { display: "none" } }}
        style={{ padding: 20, minWidth: modalImg?.status !== "off" ? "90vw" : 250 }}
      >
        <CenterBox>
          <Box sx={{ borderRadius: 10, backgroundColor: "#00B4B6", px: 5, py: 1 }}>
            <Typography sx={{ textTransform: "uppercase", color: "#fff", fontWeight: 500, textAlign: "center" }}>
              {username}
            </Typography>
            {modalImg?.out?.img && (
              <Typography sx={{ color: "#fff", textAlign: "center", fontSize: 10 }}>
                Số giờ làm trong buổi: {modalImg.workhour?.toFixed(2)}
              </Typography>
            )}
          </Box>

          {modalImg?.status !== "off" && (
            <Typography fontSize={10} color="#00B4B6" fontStyle="italic">
              Nhấp vào hình để xem vị trí trên Google Maps
            </Typography>
          )}

          <Stack
            direction="row"
            spacing={2}
            style={{
              padding: 20,
              height: modalImg?.status === "off" ? 200 : "90vh",
              width: "fit-content",
            }}
          >
            {modalImg?.in?.img && (
              <Stack>
                <Typography textAlign="center">Check in {modalImg.in.time}</Typography>
                <img
                  src={resolveStaticImageUrl(staticBase, modalImg.in.img)}
                  alt="Check-in"
                  style={{ maxHeight: "80vh", minWidth: 300, borderRadius: 8, marginBottom: 8, cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      modalImg?.in?.lat &&
                      modalImg?.in?.long &&
                      modalImg.in.lat !== "-" &&
                      modalImg.in.long !== "-"
                    ) {
                      const url = `https://www.google.com/maps?q=${modalImg.in.lat},${modalImg.in.long}`;
                      window.open(url, "_blank");
                    } else {
                      notification.error({ message: "Không có tọa độ để mở bản đồ" });
                    }
                  }}
                />
              </Stack>
            )}

            {modalImg?.out?.img && (
              <Stack>
                <Typography textAlign="center">Check out {modalImg.out.time}</Typography>
                <img
                  src={resolveStaticImageUrl(staticBase, modalImg.out.img)}
                  alt="Check-out"
                  style={{ maxHeight: "80vh", minWidth: 300, borderRadius: 8, marginBottom: 8, cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      modalImg?.out?.lat &&
                      modalImg?.out?.long &&
                      modalImg.out.lat !== "-" &&
                      modalImg.out.long !== "-"
                    ) {
                      const url = `https://www.google.com/maps?q=${modalImg.out.lat},${modalImg.out.long}`;
                      window.open(url, "_blank");
                    } else {
                      notification.error({ message: "Không có tọa độ để mở bản đồ" });
                    }
                  }}
                />
              </Stack>
            )}

            {/* Form bổ sung giờ tăng ca cho kế toán */}
            {modalImg?.status !== "off" && (modalImg?.periodKey === "evening" || modalImg?.period === 2) && (
              <Stack direction="column" sx={{ maxWidth: 360, width: "100%", mt: 1 }}>
                {!modalImg?.out?.time ? (
                  <Box sx={{ p: 2, bgcolor: "#FEF2F2", border: "1px solid #F87171", borderRadius: 2 }}>
                    <Typography sx={{ color: "#B91C1C", fontWeight: "bold", fontSize: 13, mb: 0.5 }}>
                      ⚠️ CẢNH BÁO: CHƯA CÓ CHECK-OUT TĂNG CA!
                    </Typography>
                    <Typography sx={{ color: "#7F1D1D", fontSize: 11, mb: 1.5 }}>
                      Nhân viên chưa chấm công ra ca tối. Kế toán xác nhận lại và bổ sung giờ tăng ca bên dưới:
                    </Typography>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 500, minWidth: 80 }}>Giờ ra ca:</Typography>
                        <Input
                          size="small"
                          style={{ width: 100 }}
                          placeholder="21:30"
                          value={supplementOutTime}
                          onChange={(e) => setSupplementOutTime(e.target.value)}
                        />
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 500, minWidth: 80 }}>Số giờ tăng:</Typography>
                        <InputNumber
                          size="small"
                          style={{ width: 80 }}
                          min={0.5}
                          max={6}
                          step={0.5}
                          value={supplementWorkhour}
                          onChange={(v) => setSupplementWorkhour(v || 0)}
                        />
                        <Typography sx={{ fontSize: 11, color: "#666" }}>giờ</Typography>
                      </Box>
                      <Button
                        type="primary"
                        danger
                        size="small"
                        loading={isSavingSupplement}
                        onClick={handleSaveSupplementOvertime}
                      >
                        💾 Lưu bổ sung giờ tăng ca
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <Box sx={{ p: 1.5, bgcolor: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                      <Typography sx={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>
                        ✅ Tăng ca: {modalImg.workhour || 0} giờ
                      </Typography>
                      <Typography sx={{ fontSize: 10, color: "#15803D" }}>
                        Check out: {modalImg.out?.time ? dayjs(modalImg.out.time).format("HH:mm DD/MM/YYYY") : "—"}
                        {modalImg.out?.img === "" && " (Kế toán bổ sung)"}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => {
                        setSupplementWorkhour(modalImg.workhour || 2.5);
                        if (modalImg.out?.time) {
                          setSupplementOutTime(dayjs(modalImg.out.time).format("HH:mm"));
                        }
                        setModalImg({ ...modalImg, out: undefined });
                      }}
                    >
                      Sửa lại
                    </Button>
                  </Box>
                )}
              </Stack>
            )}

            {modalImg?.status === "off" && (() => {
              const leaveItem = record.leaves?.find((l) => String(l.id) === String(modalImg.id));
              const createdDateStr = leaveItem?.createdAt 
                ? dayjs(leaveItem.createdAt).format("DD-MM-YYYY HH:mm")
                : null;
              return (
                <Stack direction="column">
                  <Typography textAlign="center" style={{ fontWeight: 700 }}>
                    XIN NGHỈ PHÉP
                  </Typography>
                  <Typography textAlign="center">
                    {modalImg.day.getDate().toString().padStart(2, "0") + "-" +
                      (modalImg.day.getMonth() + 1).toString().padStart(2, "0") + "-" +
                      modalImg.day.getFullYear()}
                  </Typography>
                  <Typography textAlign="center">
                    Buổi {modalImg.period === 0 ? "sáng" : modalImg.period === 1 ? "chiều" : "tối"}
                  </Typography>
                  <Typography textAlign="center">Lý do: {modalImg.text}</Typography>
                  {createdDateStr && (
                    <Typography textAlign="center" style={{ fontSize: "0.85rem", color: "#666", marginTop: 4 }}>
                      Ngày gửi xin phép: {createdDateStr}
                    </Typography>
                  )}

                  <DeleteConfirm
                    caption="XÓA NGHỈ PHÉP"
                    text="Bạn muốn xóa nghỉ phép này?"
                    elId={modalImg.id}
                    onDelete={() => handleLeaveDelete(modalImg.id)}
                  />
                </Stack>
              );
            })()}
          </Stack>
        </CenterBox>
      </Modal>
    </>
  );
}

