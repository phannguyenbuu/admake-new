import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Stack,
  Button,
  Select,
  MenuItem,
  InputLabel,
  Typography
} from "@mui/material";

import { useApiHost } from "../../../../common/hooks/useApiHost";
import type { User } from "../../../../@types/user.type";

interface CameraSelectorProps {
  onDeviceChange?: (deviceId: string) => void;
}

const CameraSelector: React.FC<CameraSelectorProps> = ({ onDeviceChange }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [isFrontCamera, setIsFrontCamera] = useState(true); // currently unused

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
          if (onDeviceChange) onDeviceChange(videoDevices[0].deviceId);
        }
      } catch (err: any) {
        setError("Không thể lấy danh sách camera: " + err.message);
      }
    };

    getDevices();
  }, [onDeviceChange]);

  useEffect(() => {
    const startStream = async () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (!selectedDeviceId) return;
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedDeviceId } },
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
        setError("");
      } catch (err: any) {
        setError("Lỗi truy cập camera: " + err.message);
      }
    };

    startStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedDeviceId, stream]);

  const handleChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const deviceId = e.target.value as string;
    setSelectedDeviceId(deviceId);
    if (onDeviceChange) onDeviceChange(deviceId);
  };

  return (
    <div>
      <h3>Chọn Camera:</h3>
      <select value={selectedDeviceId ?? ""} onChange={handleChange}>
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || device.deviceId}
          </option>
        ))}
      </select>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", maxWidth: 600, marginTop: 20 }}
        />
      </div>
    </div>
  );
};




async function postWorkpointCheck(user_id: string, imgUrl: string) {
  const url = `${useApiHost()}/workpoint/check/${user_id}/${imgUrl}/`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        // Nếu không gửi body thì Content-Type có thể không cần
        "Content-Type": "application/json",
      },
      // Nếu bạn có muốn gửi một body JSON kèm theo thì có thể thêm:
      // body: JSON.stringify({ someData: 'value' }),
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




interface CameraDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  dialogTitle: string;
  userEl: User | null;
}

const CameraDialog: React.FC<CameraDialogProps> = ({
  open,
  setOpen,
  dialogTitle,
  userEl,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!open) {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      setStep(1);
      setCaptured(false);
      setImageURL(null);
      setImageData(null);
      setPosition({ latitude: null, longitude: null });
      setError(null);
      setSendSuccessMsg("");
      return;
    }
    const getCameraStream = async () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        console.log("Danh sách camera:", videoDevices);

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: receiver },
        });

        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
        setError(null);
      } catch (err: any) {
        setError("Lỗi truy cập camera: " + err.message);
      }
    };

    getCameraStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [open, receiver]);

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
      (err) => setError("Lỗi lấy vị trí: " + err.message),
      { enableHighAccuracy: true }
    );
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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

  const handleBack = () => {
    setStep(1);
    setCaptured(false);
    setImageURL(null);
    setImageData(null);
    setSendSuccessMsg("");
  };

  const handleSend = async () => {
    // if (!imageData) {
    //   setError("Vui lòng chụp hình trước khi gửi");
    //   return;
    // }
    // if (!position.latitude || !position.longitude) {
    //   setError("Vui lòng lấy vị trí GPS trước khi gửi");
    //   return;
    // }

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
    const lat = position.latitude ? position.latitude.toFixed(6) : "null";
    const long = position.longitude ? position.longitude.toFixed(6) : "null";
    const filename = `workpoint_${userEl?.id}_${dateTimeStr}_${lat}_${long}.jpg`;

    const formData = new FormData();
    formData.append("latitude", position.latitude?.toString() ?? "");
    formData.append("longitude", position.longitude?.toString() ?? "");
    formData.append("time", dateTimeStr);

    if(imageData)
    {
      formData.append("file", imageData, filename);

      fetch(`${useApiHost()}/api/message/upload`, {
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
        postWorkpointCheck(userEl?.id ?? '', filename);

        setSendSuccessMsg(`Đã gửi thành công! Link: ${filename}`);
        setTimeout(() => {
          setOpen(false);
          setStep(1);
          setCaptured(false);
          setImageURL(null);
          setImageData(null);
          setPosition({ latitude: null, longitude: null });
          setError(null);
          setSendSuccessMsg("");
        }, 2000);
      })
      .catch((err) => {
        setError("Lỗi upload ảnh: " + err.message);
      });

    }else{
      postWorkpointCheck(userEl?.id ?? '', filename);
      console.log('Form Data',filename, formData);
    }
  };

  return (
    <Stack>
      
      <Stack>
        <Stack>
          <InputLabel id="receiver-label">Camera</InputLabel>
          <Select
            labelId="receiver-label"
            value={receiver}
            label="Camera"
            onChange={(e) => setReceiver(e.target.value)}
          >
            <MenuItem value="user">Trước</MenuItem>
            <MenuItem value="environment">Sau</MenuItem>
          </Select>
        </Stack>

        {step === 1 && (
          <>
            <video
              ref={videoRef}
              width="100%"
              height="auto"
              autoPlay
              playsInline
              style={{ borderRadius: 8, backgroundColor: "#000" }}
            />
            <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={capturePhoto}>
              Chụp hình kèm GPS
            </Button>
          </>
        )}

        {step === 2 && (
          <>
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
          </>
        )}

        <CameraSelector />
      </Stack>

      <Stack>
        <Button onClick={() => setOpen(false)}>
          Hủy
        </Button>
        {step === 2 && <Button onClick={handleBack}>Chụp lại</Button>}
        {step === 2 && (
          <Button onClick={handleSend} variant="contained">
            Gửi
          </Button>
        )}
      </Stack>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {sendSuccessMsg && (
        <Typography
          sx={{ mt: 2, mx: 2, fontSize: 10, color: "green", wordBreak: "break-word" }}
        >
          {sendSuccessMsg}
        </Typography>
      )}
    </Stack>
  );
};

export default CameraDialog;
