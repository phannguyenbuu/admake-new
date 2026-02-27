import { Modal, notification } from "antd";
import React, { useEffect, useState } from "react";
import { useApiHost, useApiStatic } from "../../../common/hooks/useApiHost";
import { Stack, Box, Typography } from "@mui/material";
import QRCode from "../../../components/chat/components/QRCode";
import DownloadIcon from "@mui/icons-material/Download";
import { CenterBox } from "../../../components/chat/components/commons/TitlePanel";
import type { Workpoint, WorkDaysProps, PeriodData, Checklist } from "../../../@types/workpoint";
import DeleteConfirm from "../../../components/DeleteConfirm";
import dayjs from "dayjs";
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
        title={`Mã QR c?a ${record.username}`}
      >
        {selectedRecord && (
          <Box display="flex" justifyContent="center">
            <QRCode
              title="Download và g?i cho nhân s?"
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

export default function WorkDays({ record, selectedMonth }: ParamWorkDaysProps) {
  const { items, leaves, username } = record;

  const baseDate = selectedMonth
    ? dayjs(`${selectedMonth}-01`, "YYYY-MM-DD").toDate()
    : new Date();

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = new Date().getDate();

  const [totalHour, setTotalHour] = useState<{ morning: number; noon: number; evening: number } | null>(null);
  const [mainData, setMainData] = useState<Workpoint[]>([]);
  const [modalImg, setModalImg] = useState<PeriodData | null>(null);
  const [statuses, setStatuses] = useState(createEmptyStatuses(daysInMonth));
  const [modalVisible, setModalVisible] = useState(false);

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
    });

    setTotalHour(total);
    setStatuses(monthlyStatuses);
  }, [items, leaves, year, month, daysInMonth]);

  useEffect(() => {
    setStatuses(createEmptyStatuses(daysInMonth));
  }, [daysInMonth]);

  type StatusKey = "in" | "out" | "off" | "null";

  const colors: Record<StatusKey, string> = {
    in: "green",
    out: "red",
    off: "#999",
    null: "white",
  };

  const handleOk = () => {
    setModalVisible(false);
    setModalImg(null);
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
        notification.success({ message: "Xóa ngh? phép thành công!" });
        setModalVisible(false);
        setModalImg(null);
      } else {
        throw new Error("Xóa th?t b?i");
      }
    } catch (error) {
      console.error("Failed to delete leave:", error);
      notification.error({ message: "Xóa ngh? phép th?t b?i!" });
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1}>
        <Stack sx={{ background: "#999", borderRadius: 8, width: 30, pt: 2 }}>
          <Typography color="#fff" textAlign="center" fontSize={10} fontWeight={300}>
            {((totalHour?.morning || 0) + (totalHour?.noon || 0)).toFixed(2)}
          </Typography>
          <Typography color="#fff" textAlign="center" fontSize={10} fontWeight={300}>
            {(totalHour?.evening || 0).toFixed(2)}
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
                          const itemCreateDate = new Date(item.createdAt);
                          const itemDate = new Date(itemCreateDate.getTime() + 7 * 60 * 60 * 1000);

                          if (
                            itemDate.getDate() === date.getDate() &&
                            itemDate.getMonth() === date.getMonth() &&
                            itemDate.getFullYear() === date.getFullYear()
                          ) {
                            const periodData = item.checklist?.[periodKey];
                            if (periodData) {
                              imgUrl = periodData;
                              break;
                            }
                          }
                        }
                      }
                    }

                    const bgColor = status && status.startsWith("off")
                      ? "#999"
                      : colors[(status ?? "null") as StatusKey];

                    return (
                      <div
                        key={periodIndex}
                        style={{
                          display: "block",
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: bgColor,
                          border: isSunday ? "1px solid red" : "1px solid #999",
                          marginBottom: 1,
                          cursor: imgUrl ? "pointer" : "default",
                        }}
                        onClick={() => {
                          if (imgUrl) {
                            setModalImg(imgUrl);
                            setModalVisible(true);
                          }
                        }}
                      />
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
                S? gi? làm trong bu?i: {modalImg.workhour?.toFixed(2)}
              </Typography>
            )}
          </Box>

          {modalImg?.status !== "off" && (
            <Typography fontSize={10} color="#00B4B6" fontStyle="italic">
              Nh?p vào hình d? xem v? trí trên Google Maps
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
                  src={`${useApiStatic()}/${modalImg.in.img}`}
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
                      notification.error({ message: "Không có t?a d? d? m? b?n d?" });
                    }
                  }}
                />
              </Stack>
            )}

            {modalImg?.out?.img && (
              <Stack>
                <Typography textAlign="center">Check out {modalImg.out.time}</Typography>
                <img
                  src={`${useApiStatic()}/${modalImg.out.img}`}
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
                      notification.error({ message: "Không có t?a d? d? m? b?n d?" });
                    }
                  }}
                />
              </Stack>
            )}

            {modalImg?.status === "off" && (
              <Stack direction="column">
                <Typography textAlign="center" style={{ fontWeight: 700 }}>
                  XIN NGH? PHÉP
                </Typography>
                <Typography textAlign="center">
                  {modalImg.day.getDate().toString().padStart(2, "0") + "-" +
                    (modalImg.day.getMonth() + 1).toString().padStart(2, "0") + "-" +
                    modalImg.day.getFullYear()}
                </Typography>
                <Typography textAlign="center">
                  Bu?i {modalImg.period === 0 ? "sáng" : modalImg.period === 1 ? "chi?u" : "t?i"}
                </Typography>
                <Typography textAlign="center">Lý do: {modalImg.text}</Typography>

                <DeleteConfirm
                  caption="XÓA NGH? PHÉP"
                  text="B?n mu?n xóa ngh? phép này?"
                  elId={modalImg.id}
                  onDelete={() => handleLeaveDelete(modalImg.id)}
                />
              </Stack>
            )}
          </Stack>
        </CenterBox>
      </Modal>
    </>
  );
}

