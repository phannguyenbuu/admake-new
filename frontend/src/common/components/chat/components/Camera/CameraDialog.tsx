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

import { useApiHost, useApiStatic } from "../../../../common/hooks/useApiHost";
import type { User } from "../../../../@types/user.type";
import { CenterBox } from "../commons/TitlePanel";
import { LogoAdmake } from "../Conversation/Header";
import type { Workpoint } from "../../../../@types/workpoint";
import WorkpointGrid from "./WorkpointTable";
import { CurrentDateTime } from "./WorkpointTable";
import TaskBoard from "./TaskBoard";
import LeaveBoard from "./LeaveBoard";
import { notification } from "antd";
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkpointInfor } from "../../../../common/hooks/useWorpointInfor";
import SalaryBoard from "../../../../app/dashboard/workpoints/SalaryBoard";
import { useUser } from "../../../../common/hooks/useUser";
import AdvanceSalaryModal from "./AdvanceSalaryModal";

interface CameraDialogProps {
  userEl: User | null;
}

function drawTextOnCanvas(
  canvas: HTMLCanvasElement,
  textLines: string[] | null
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  
  const sc = canvas.height / 1080;
  const h =  canvas.height;
  
  ctx.fillStyle = "red";
  ctx.font = `${sc * 150}px Oswald`;

  const a = sc * 50;
  const b = h - sc * 200;
  
  ctx.fillText(textLines?.[1] || '', a, b);

  ctx.font = `${sc * 50}px Poppins`;
  ctx.fillStyle = "white";
  ctx.fillText(textLines?.[0] || '', a, b + sc * 80);
  
  ctx.font = `${sc * 20}px Arial`;
  ctx.fillStyle = "#333";
  ctx.fillText(textLines?.[2] || '', a + sc * 400, b + sc * 80);
  ctx.fillText(textLines?.[3] || '', a + sc * 600, b + sc * 80);
}

const CameraDialog: React.FC<CameraDialogProps> = ({userEl}) => {
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
    
  const [position, setPosition] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [receiver, setReceiver] = useState<string>("environment");
  const [imageData, setImageData] = useState<Blob | null>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string>("");
  const [step, setStep] = useState<number>(1); // 1: Chụp, 2: Xem
  const [captured, setCaptured] = useState<boolean>(false);
  const [workpoint, setWorkpoint] = useState<Workpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSupplier = userEl?.role?.name === "Thầu phụ";
  const [openWork, setOpenWork] = useState(false);
  const [openHoliday, setOpenHoliday] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const {workpointEl, fetchWorkpointEl } = useWorkpointInfor();
  const [modalVisible, setModalVisible] = useState(false);
  const [openAdvanceModal, setOpenAdvanceModal] = useState(false);
  const {userLeadId, setUserLeadId, setUserId} = useUser();
  const apiHost = useApiHost();

  useEffect(() => {
    if (!userEl?.id) return;
    const checkUserNotify = async () => {
      try {
        const res = await fetch(`${apiHost}/notify/user/${userEl.id}`);
        if (res.ok) {
          const data = await res.json();
          const notifs = data.data || [];
          const approved = notifs.find((n: any) => n.type === "advance-approved" && !n.isDelete);
          if (approved) {
            notification.success({
              message: "🎉 Đề xuất tạm ứng đã được duyệt!",
              description: approved.text || approved.description,
              duration: 10,
            });
            await fetch(`${apiHost}/notify/${approved.id}`, { method: "DELETE" });
          }
        }
      } catch (e) {
        console.error("Check user notify error:", e);
      }
    };
    checkUserNotify();
  }, [userEl?.id, apiHost]);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(userEl?.avatar || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (userEl?.avatar) {
      setAvatarUrl(userEl.avatar);
    }
  }, [userEl]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userEl?.id) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploadingAvatar(true);
    try {
      const res = await fetch(`${useApiHost()}/workpoint/avatar/${userEl.id}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.avatar) {
        setAvatarUrl(data.avatar);
        notification.success({ message: "Đã cập nhật ảnh đại diện!" });
      } else {
        notification.error({ message: data.error || "Tải ảnh thất bại" });
      }
    } catch (err: any) {
      notification.error({ message: "Lỗi tải ảnh: " + err.message });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleClearAvatar = async () => {
    if (!userEl?.id) return;
    setUploadingAvatar(true);
    try {
      const res = await fetch(`${useApiHost()}/workpoint/avatar/${userEl.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setAvatarUrl(null);
        notification.success({ message: "Đã xóa ảnh đại diện!" });
      } else {
        notification.error({ message: data.error || "Xóa ảnh thất bại" });
      }
    } catch (err: any) {
      notification.error({ message: "Lỗi xóa ảnh: " + err.message });
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  useEffect(() => {
    console.log("UserEL", userEl);
    if (!userEl) return;

    if (userEl?.id) {
      if(userLeadId === 0)
        setUserLeadId(userEl.lead_id);
      fetchWorkpointEl(userEl.id);
      setUserId(userEl?.id);
    }
  }, [userEl]);

  // useEffect(()=>{
  //   console.log("ITM", workpointEl);
  // },[workpointEl]);
  
  const handleCloseModal = () => {
    setModalVisible(false);
    // setSelectedRecord(null);
  };
  
  const location = useLocation();

  useEffect(() => {
    const href = window.location.href; // chuỗi href cần kiểm tra

    if (href.includes("?zarsrc")) {
      const baseHref = href.split("?zarsrc")[0];
      
      if (location.pathname + location.search !== new URL(baseHref).pathname + new URL(baseHref).search) {
        window.location.href = baseHref;
      }
    } 

  },[]);

  function fetchWorkpoint() {
    fetch(`${useApiHost()}/workpoint/today/${userEl?.id}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data: Workpoint) => {
      setWorkpoint(data);
      console.log(data);
      setError(null);
    })
    .catch((err: Error) => {
      setError(err.message);
      setWorkpoint(null);
    })
    .finally(() => {
      setLoading(false);
    });
  }

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
        setHasCamera(videoInputDevices.length > 0);
      })
      .catch(() => setHasCamera(false));
  
    const user = JSON.parse(localStorage.getItem('Admake-User-Access') || '{}');
    console.log(user.user_id, user.username);
  
    fetchWorkpoint();
    
  },[]);

  useEffect(() => {
    if (isSupplier) return;
    const setupCamera = async () => {
      try {
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
        }
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: receiver }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError("Lỗi truy cập camera: " + (err as Error).message);
      }
    };
    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [receiver, step]);


  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ định vị GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setStatusMsg(
          `Vị trí: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`
        );
        setError(null);
      },
      (err) => setError("Lỗi lấy vị trí:" + err.message),
      { enableHighAccuracy: true }
    );
  };

  const textLines: () => string[] = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return [
      dateStr,
      timeStr,
      position.latitude?.toString() ?? '-',
      position.longitude?.toString() ?? '-'
    ];
  }


  const capturePhoto = () => {
    // Nếu có camera, chụp ảnh từ video
    // console.log("Có camera, chụp ảnh từ video");
    const video = videoRef.current;
    const canvas = canvasRef.current;
      
    if (!hasCamera || !canvas || !video) {
      console.log("Không có camera, tạo canvas đen 480x640");

      const canvas = canvasRef.current!;
      const width = 480;
      const height = 640;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Vẽ nền đen
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);

      // Vẽ chữ hoặc nội dung nếu có
      drawTextOnCanvas(canvas, textLines());

      // Tạo blob ảnh JPEG độ nén 95%
      canvas.toBlob(
        (blob) => {
          setImageData(blob);
          if (blob) {
            console.log("Tạo url từ blob để hiển thị hoặc gửi đi!");
            setImageURL(URL.createObjectURL(blob));
          }
        },
        "image/jpeg",
        0.95
      );

      setCaptured(true);
      getLocation();
      setStep(2);

      // console.log("A-2");
      return;
    }

    

    if (!canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    drawTextOnCanvas(canvas, textLines());
    canvas.toBlob(
      (blob) => {
        setImageData(blob);
        if (blob) {
          setImageURL(URL.createObjectURL(blob));
        }
      },
      "image/jpeg",
      0.95
    );

    setCaptured(true);
    getLocation();
    setStep(2);
  };



async function postWorkpointCheck(imgUrl: string, lat:string, long:string) {
  const url = `${useApiHost()}/workpoint/check/${userEl?.id}/`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        // Nếu không gửi body thì Content-Type có thể không cần
        "Content-Type": "application/json",

      },

     body: JSON.stringify({
      img: imgUrl,
      lat: lat,
      long: long
    })

    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Response data:", data);
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

  const handleBack = () => {
    setStep(1);
    setCaptured(false);
    // setImageURL(null);
    // setImageData(null);
    // setSendSuccessMsg("");
  };

  const handleSend = async () => {
    console.log('handleSend', imageData);
    
    if(!imageData) return;

    let lat = '0';
    let long = '0';
      
    const formatDate = (date: Date): string => {
      const pad = (n: number) => (n < 10 ? "0" + n : n);
      return (
        date.getFullYear().toString() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        "_" +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds())
      );
    };
    
    const now = new Date();
    const dateTimeStr = formatDate(now);
    lat = position.latitude ? position.latitude.toFixed(6) : "-";
    long = position.longitude ? position.longitude.toFixed(6) : "-";
    const filename = `workpoint_${userEl?.id}_${dateTimeStr}_${lat}_${long}.jpg`;

    const formData = new FormData();
    formData.append("latitude", position.latitude?.toString() ?? "");
    formData.append("longitude", position.longitude?.toString() ?? "");
    formData.append("time", dateTimeStr);
    
    formData.append("file", imageData, filename);

    fetch(`${useApiHost()}/message/upload`, {
      method: "POST",
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(result => {
      console.log(result.data.file_url, result.data.link);

      const new_filename = result.data.file_url;
      postWorkpointCheck(new_filename, lat, long);

      
      setTimeout(() => {
        notification.success({message:`Đã gửi thành công!`});
        setStep(1);
        setOpenWork(true);
        fetchWorkpoint();
      }, 1000);
    })
    .catch((err) => {
      notification.error({message:"Lỗi upload ảnh: " + err.message});
    });

    setImageData(null);
    
  }

  const handleWorkBoardCancel = () => {
    setOpenWork(false);
    setStep(1);
  }

  const handleHolidayBoardCancel = () => {
    setOpenHoliday(false);
    setStep(1);
  }

  const handleTaskClick = () => {
    setOpenWork(true);
  }

  const handleHolidayClick = () => {
    setOpenHoliday(true);
  }

  const getFirstNameInitial = (fullName?: string) => {
    if (!fullName) return "U";
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[parts.length - 1];
    return firstName.charAt(0).toUpperCase();
  };

  const getNextAction = (): { label: string; isOvertime: boolean } => {
    const chk = workpoint?.checklist || {};
    const mIn = !!chk.morning?.in;
    const mOut = !!chk.morning?.out;
    const nIn = !!chk.noon?.in;
    const nOut = !!chk.noon?.out;
    const eIn = !!chk.evening?.in;
    const eOut = !!chk.evening?.out;

    const now = new Date();
    const hour = now.getHours();

    if (eIn && !eOut) return { label: "Điểm danh: Ra ca Tối (Tăng ca)", isOvertime: true };
    if (nIn && !nOut) return { label: "Điểm danh: Ra ca Chiều", isOvertime: false };
    if (mIn && !mOut && hour < 12) return { label: "Điểm danh: Ra ca Sáng", isOvertime: false };

    if (nIn && nOut) {
      if (!eIn) return { label: "Điểm danh: Vào ca Tối (Tăng ca)", isOvertime: true };
      if (!eOut) return { label: "Điểm danh: Ra ca Tối (Tăng ca)", isOvertime: true };
      return { label: "Đã hoàn thành các ca hôm nay ✓", isOvertime: false };
    }

    if (hour >= 17) {
      if (!eIn) return { label: "Điểm danh: Vào ca Tối (Tăng ca)", isOvertime: true };
      if (!eOut) return { label: "Điểm danh: Ra ca Tối (Tăng ca)", isOvertime: true };
      return { label: "Đã hoàn thành các ca hôm nay ✓", isOvertime: false };
    }

    if (hour >= 12) {
      if (!nIn) return { label: "Điểm danh: Vào ca Chiều", isOvertime: false };
      if (!nOut) return { label: "Điểm danh: Ra ca Chiều", isOvertime: false };
      return { label: "Điểm danh: Vào ca Tối (Tăng ca)", isOvertime: true };
    }

    if (!mIn) return { label: "Điểm danh: Vào ca Sáng", isOvertime: false };
    if (!mOut) return { label: "Điểm danh: Ra ca Sáng", isOvertime: false };
    return { label: "Điểm danh: Vào ca Chiều", isOvertime: false };
  };

  return (
    <Stack
      p={1}
      spacing={1}
      style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
        height: isSupplier ? "auto" : "100vh",
        overflowY: "auto",
      }}
    >
      {/* Avatar Background Image (width 50vw, opacity 50%, centered behind attendance table) */}
      {avatarUrl && (
        <div
          style={{
            position: "absolute",
            top: "320px",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "50vw",
            height: "50vw",
            maxWidth: "450px",
            maxHeight: "450px",
            borderRadius: "50%",
            overflow: "hidden",
            opacity: 0.5,
            pointerEvents: "none",
            zIndex: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={
              avatarUrl.startsWith("http")
                ? avatarUrl
                : avatarUrl.startsWith("/static/")
                ? `${useApiStatic()}${avatarUrl.substring(7)}`
                : `${useApiStatic()}/${avatarUrl.replace(/^\/+/, "")}`
            }
            alt="Avatar Background"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      <Stack direction="row" alignItems="center" spacing={1} style={{width:'90vw', marginLeft:10, marginTop: 5}}>
        <LogoAdmake/>
        
        {/* Nút Chọn & Xóa Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 15 }}>
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            style={{ display: "none" }}
          />
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "#0284c7",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 16,
              border: "2px solid #38bdf8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
              flexShrink: 0,
            }}
            title="Bấm để chọn / đổi ảnh đại diện"
          >
            {uploadingAvatar ? "..." : getFirstNameInitial(userEl?.fullName)}
          </button>

          {avatarUrl && (
            <button
              onClick={handleClearAvatar}
              disabled={uploadingAvatar}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: "#f43f5e",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 11,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                flexShrink: 0,
              }}
              title="Xóa ảnh đại diện"
            >
              ✕
            </button>
          )}
        </div>

        <Box style={{ fontWeight: 600, fontSize: 15, color: "#1e293b", marginLeft: 10 }}>
          {userEl?.fullName}
        </Box>
      </Stack>

      
      
      {isSupplier ? (
        <TaskBoard isDirect userId={userEl?.id} fullName={userEl?.fullName} />
      ) : (
        <>
          {step === 1 && (
            <CenterBox>
              <CurrentDateTime />

              {(() => {
                const nextAction = getNextAction();
                return (
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: nextAction.isOvertime ? "#f59e0b" : "orange",
                      borderRadius: 20,
                      mt: 1,
                      minHeight: 50,
                      px: 3,
                      maxWidth: 360,
                      mb: 1,
                      fontSize: 14,
                      fontWeight: 600,
                      textTransform: "none",
                      boxShadow: nextAction.isOvertime ? "0 2px 8px rgba(245,158,11,0.4)" : "0 2px 8px rgba(255,165,0,0.3)",
                    }}
                    onClick={capturePhoto}
                  >
                    <img src="/alarm-svgrepo-com.svg" alt="ADMAKE" style={{ width: 36, marginRight: 8 }} />
                    {nextAction.label}
                  </Button>
                );
              })()}

              <WorkpointGrid workpoint={workpoint} fetchWorkpoint={fetchWorkpoint} />

              <Stack direction="row" spacing={1} p={1}>
                <Button
                  variant="contained"
                  sx={{
                    borderRadius: 40,
                    backgroundColor: "#00B4B6",
                    fontSize: 10,
                    whiteSpace: "nowrap",
                    mt: 1,
                    height: 50,
                    maxWidth: 300,
                    mb: 1,
                  }}
                  onClick={handleHolidayClick}
                >
                  <img src="/holiday-island-tourism-svgrepo-com.svg" alt="ADMAKE" style={{ width: 32 }} />
                  Nghỉ phép
                </Button>

                <Button
                  variant="contained"
                  sx={{
                    borderRadius: 40,
                    backgroundColor: "#00B4B6",
                    fontSize: 10,
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    mt: 1,
                    height: 50,
                    maxWidth: 300,
                    mb: 1,
                  }}
                  onClick={handleTaskClick}
                >
                  <img src="/task-done-svgrepo-com.svg" alt="ADMAKE" style={{ width: 32 }} />
                  Nhiệm vụ
                </Button>

                <Button
                  variant="contained"
                  sx={{
                    borderRadius: 40,
                    backgroundColor: "#0891b2",
                    fontSize: 10,
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    mt: 1,
                    height: 50,
                    maxWidth: 300,
                    mb: 1,
                  }}
                  onClick={() => {
                    setOpenAdvanceModal(true);
                  }}
                >
                  <img src="/pay-svgrepo-com.svg" alt="Đề xuất ứng tiền" style={{ width: 30 }} />
                  Đề xuất ứng tiền
                </Button>

                <Button
                  sx={{
                    borderRadius: 40,
                    color: "#fff",
                    fontSize: 10,
                    backgroundColor: "#00B4B6",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    mt: 1,
                    height: 50,
                    maxWidth: 300,
                    mb: 1,
                  }}
                  onClick={() => setModalVisible(true)}
                >
                  <img src="/pay-svgrepo-com.svg" alt="ADMAKE" style={{ width: 32 }} />
                  Bảng lương
                </Button>
              </Stack>

              <video
                ref={videoRef}
                width="100%"
                height="auto"
                autoPlay
                playsInline
                style={{ borderRadius: 8, backgroundColor: "#000", width: "100%", maxWidth: 400 }}
              />
            </CenterBox>
          )}

          {step === 2 && (
            <>
              <CenterBox>
                <Box sx={{ textAlign: "center", mt: 1 }}>
                  {imageURL && (
                    <img
                      src={imageURL}
                      alt="Ảnh đã chụp"
                      style={{ maxWidth: "100%", borderRadius: 8, height: "60vh" }}
                    />
                  )}
                  {position.latitude && position.longitude && (
                    <Typography sx={{ mt: 1 }}>{statusMsg}</Typography>
                  )}
                </Box>
                {error && (
                  <Typography color="error" sx={{ mt: 1 }}>
                    {error}
                  </Typography>
                )}
              </CenterBox>

              <Stack
                spacing={2}
                direction="row"
                sx={{
                  position: "fixed",
                  bottom: 50,
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                <Button onClick={handleSend} variant="contained" sx={{ backgroundColor: "#00B4B6" }}>
                  Gửi
                </Button>
                <Button onClick={handleBack}>Chụp lại</Button>
              </Stack>
            </>
          )}

          <canvas ref={canvasRef} style={{ display: "none" }} />

          <TaskBoard
            open={openWork}
            userId={userEl?.id}
            fullName={userEl?.fullName}
            onCancel={handleWorkBoardCancel}
          />

          <LeaveBoard open={openHoliday} userId={userEl?.id} onCancel={handleHolidayBoardCancel} />

          <SalaryBoard
            selectedRecord={workpointEl}
            modalVisible={modalVisible}
            handleOk={handleCloseModal}
          />

          <AdvanceSalaryModal
            open={openAdvanceModal}
            onCancel={() => setOpenAdvanceModal(false)}
            userEl={userEl}
          />
        </>
      )}
    </Stack>
  );
};

export default CameraDialog;


