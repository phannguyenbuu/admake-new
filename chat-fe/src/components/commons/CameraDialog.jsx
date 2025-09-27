import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Stack,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { ArrowClockwise } from "phosphor-react";
import { useUser } from "../../UserContext";





const CameraSelector = () => {
  const videoRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState("");
  const [isFrontCamera, setIsFrontCamera] = useState(true);




  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        setError("Không thể lấy danh sách camera: " + err.message);
      }
    };

    getDevices();
  }, []);

  useEffect(() => {
    const startStream = async () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (!selectedDeviceId) return;
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedDeviceId } }
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
        setError("");
      } catch (err) {
        setError("Lỗi truy cập camera: " + err.message);
      }
    };

    startStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedDeviceId]);
  

  return (
    <div>
      <h3>Chọn Camera:</h3>
      <select
        value={selectedDeviceId || ""}
        onChange={(e) => setSelectedDeviceId(e.target.value)}
      >
        {devices.map(device => (
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





const CameraDialog = ({ open, setOpen, dialogTitle }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const {userId} = useUser();

  const [error, setError] = useState(null);
  const [position, setPosition] = useState({ latitude: null, longitude: null });
  const [stream, setStream] = useState(null);
  const [receiver, setReceiver] = useState('environment');
  const [imageData, setImageData] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [sendSuccessMsg, setSendSuccessMsg] = useState('');
  const [step, setStep] = useState(1); // 1: Chụp, 2: Xem
  const [captured, setCaptured] = useState(false);

  const getVideoDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  }

  const checkCameraAccess = async () => {
    const videoDevices = await getVideoDevices();

    for (const device of videoDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: device.deviceId } }
        });
        console.log(`Có quyền truy cập camera: ${device.label}`);
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.log(`Không thể truy cập camera ${device.label}:`, err.message);
      }
    }
  };

checkCameraAccess();


  useEffect(() => {
    if (!open) {
      
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      setStep(1);
      setCaptured(false);
      setImageURL(null);
      setImageData(null);
      setPosition({ latitude: null, longitude: null });
      setError(null);
      setSendSuccessMsg('');
      return;
    }

    const getCameraStream = async () => {
      
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }

      // checkCameraAccess();
      
      // navigator.permissions.query({ name: 'camera' })
      // .then(permissionStatus => {
      //   console.log('Trạng thái quyền camera:', permissionStatus.state); // granted, denied, prompt

      //   permissionStatus.onchange = () => {
      //     console.log('Quyền camera thay đổi:', permissionStatus.state);
      //   };
      // });


      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('Danh sách camera:', videoDevices);

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: receiver }
        });

        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
        setError(null);
      } catch (err) {
        setError("Lỗi truy cập camera: " + err.message);
      }
    };

    getCameraStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [open, receiver]);


  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ định vị GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setStatusMsg(`Vị trí: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
        setError(null);
      },
      err => setError("Lỗi lấy vị trí: " + err.message),
      { enableHighAccuracy: true }
    );
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      setImageData(blob);
      setImageURL(URL.createObjectURL(blob));
    }, 'image/jpeg', 0.95);
    setCaptured(true);
    getLocation();
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setCaptured(false);
    setImageURL(null);
    setImageData(null);
    setSendSuccessMsg('');
  };

  const handleSend = async () => {
    if (!imageData) {
      setError("Vui lòng chụp hình trước khi gửi");
      return;
    }
    if (!position.latitude || !position.longitude) {
      setError("Vui lòng lấy vị trí GPS trước khi gửi");
      return;
    }
    const formatDate = date => {
      const pad = n => (n < 10 ? '0' + n : n);
      return date.getFullYear().toString() 
        + pad(date.getMonth() + 1) 
        + pad(date.getDate()) 
        + "_" 
        + pad(date.getHours()) 
        + pad(date.getMinutes()) 
        + pad(date.getSeconds());
    };
    const now = new Date();
    const dateTimeStr = formatDate(now);
    const lat = position.latitude ? position.latitude.toFixed(6) : "null";
    const long = position.longitude ? position.longitude.toFixed(6) : "null";
    const filename = `att_${dateTimeStr}_${lat}_${long}_${userId}.jpg`;
    const formData = new FormData();
    formData.append("file", imageData, filename);
    formData.append("latitude", position.latitude);
    formData.append("longitude", position.longitude);
    formData.append("receiver", receiver);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      setSendSuccessMsg(`Đã gửi thành công! Link: ${filename}`);
      setTimeout(() => {
        setOpen(false);
        setStep(1);
        setCaptured(false);
        setImageURL(null);
        setImageData(null);
        setPosition({ latitude: null, longitude: null });
        setError(null);
        setSendSuccessMsg('');
      }, 2000);
    } catch (err) {
      setError("Lỗi upload ảnh: " + err.message);
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
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
        </FormControl>

        {step === 1 && (
          <>
            <video
              ref={videoRef}
              width="100%"
              height="auto"
              autoPlay
              playsInline
              style={{ borderRadius: 8, backgroundColor: '#000' }}
            />
            <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={capturePhoto}>
              Chụp hình kèm GPS
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              {imageURL && <img src={imageURL} alt="Ảnh đã chụp" style={{ maxWidth: '100%', borderRadius: 8 }} />}
              {position.latitude && position.longitude && (
                <Typography sx={{ mt: 1 }}>
                  {statusMsg}
                </Typography>
              )}
            </Box>
            {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
          </>
        )}
        <CameraSelector/>

      </DialogContent>
      <DialogActions>
        <Button mr={20} onClick={() => setOpen(false)}>Hủy</Button>
        {step === 2 && (
          <Button onClick={handleBack}>Chụp lại</Button>
        )}
        {step === 2 && (
          <Button onClick={handleSend} variant="contained">Gửi</Button>
        )}
      </DialogActions>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {sendSuccessMsg && (
        <Typography sx={{ mt: 2, mx: 2, fontSize: 10, color: 'green', wordBreak: 'break-word' }}>
          {sendSuccessMsg}
        </Typography>
      )}
    </Dialog>
  );
};

export default CameraDialog;
