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
import WorkpointGrid from "./WorkpointTable";
import { CurrentDateTime } from "./WorkpointTable";

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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('Admake-User-Access') || '{}');
    console.log(user.user_id, user.username);
  },[]);


  useEffect(() => {
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
  },[]);

  useEffect(() => {
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
    if (!videoRef.current || !canvasRef.current) {
      console.log("Khi không có camera, tạo canvas đen với kích thước cố định hoặc mặc định");

      const canvas = canvasRef.current!;
      const width = 1080;
      const height = 1920;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);

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
      return;
    }

    console.log("Nếu có camera, chụp ảnh từ video");
    const video = videoRef.current;
    const canvas = canvasRef.current;
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
    console.log('handleSend',imageData);
    
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

      setSendSuccessMsg(`Đã gửi thành công!`);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    })
    .catch((err) => {
      setError("Lỗi upload ảnh: " + err.message);
    });

    setImageData(null);
    
  }

  return (
    <Stack p={1} height='100vh' spacing={1}>
      <LogoAdmake/>
      <CenterBox sx={{border:'1px solid #ccc', borderRadius: 8}}>
        {userEl?.fullName}
      </CenterBox>
        {step === 1 && (
          <>
          <CenterBox>
            <CurrentDateTime />
            <WorkpointGrid workpoint={workpoint}/>
            <Button variant="contained" fullWidth sx={{ mt: 2, height: 50,maxWidth:300, mb:1 }} onClick={capturePhoto}>
              Chụp hình kèm GPS
            </Button>
            
            <video
              ref={videoRef}
              width="100%"
              height="auto"
              autoPlay
              playsInline
              style={{ borderRadius: 8, backgroundColor: "#000", width:'100%', maxWidth:400 }}
            />
            </CenterBox>
          </>
        )}

        {step === 2 && (
          <CenterBox>
            <Box sx={{ textAlign: "center", mt: 2 }}>
              {imageURL && (
                <img
                  src={imageURL}
                  alt="Ảnh đã chụp"
                  style={{ maxWidth: "100%", borderRadius: 8 }}
                />
              )}
              {position.latitude && position.longitude && (
                <Typography sx={{ mt: 1 }}>
                  {statusMsg}
                </Typography>
              )}
            </Box>
            {error && (
              <Typography color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
          </CenterBox>
        )}

      {/* <CameraSelector /> */}
      

      <Stack sx={{position:'fixed', top:'80vh', left: '50%',
        transform: 'translateX(-50%)',}}>
        {step === 2 && <Button onClick={handleBack}>Chụp lại</Button>}
        {step === 2 && (
          <Button onClick={handleSend} variant="contained" sx={{ bottom: 100 }}>
            Gửi
          </Button>
        )}
      </Stack>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {sendSuccessMsg && (
        <Typography
          sx={{ position:'fixed',mt: 2, mx: 2, top: 80, fontSize: 10, color: "green", wordBreak: "break-word" }}
        >
          {sendSuccessMsg}
        </Typography>
      )}
    </Stack>
  );
};

export default CameraDialog;
