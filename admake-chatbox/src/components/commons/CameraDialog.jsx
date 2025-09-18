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
import { ArrowClockwise, RotateCw } from "phosphor-react";
import { useUser } from "../../UserContext";

const CameraDialog = ({ open, setOpen, dialogTitle }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState({ latitude: null, longitude: null });
  const [stream, setStream] = useState(null);
  const [receiver, setReceiver] = useState('user');
  const [imageData, setImageData] = useState(null);
  const [imageURL, setImageURL] = useState(null); // Lưu URL ảnh để hiển thị
  const [statusMsg, setStatusMsg] = useState('');
  const [sendSuccessMsg, setSendSuccessMsg] = useState(''); // Message gửi thành công + link
  const {userId} = useUser();
  const [captured, setCaptured] = useState(false);
  const [facingMode, setFacingMode] = useState("environment"); // mặc định camera sau
  
  const [showCanvas, setshowCanvas] = useState(false);

  useEffect(() => {
    const getCameraStream = async () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode }
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error("Lỗi truy cập camera:", err);
      }
    };
    getCameraStream();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [facingMode]);

  const switchCamera = () => {
    setFacingMode(prev => (prev === "environment" ? "user" : "environment"));
  };

  const handleClose = () => {
    setOpen(false);
    setImageURL(null);
    setImageData(null);
    setPosition({ latitude: null, longitude: null });
    setStatusMsg('');
    setSendSuccessMsg('');
    setError(null);
  };

  useEffect(() => {
    if (!open) {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      return;
    }

    const constraints = {
      video: { facingMode: "environment" },
      audio: false,
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(mediaStream => {
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
        setError(null);
      })
      .catch(err => {
        setError("Không thể truy cập camera: " + err.message);
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [open]);

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

        setStatusMsg(`Vị trí: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`)
        setError(null);
      },
      (err) => {
        setError("Lỗi lấy vị trí: " + err.message);
      },
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
      const url = URL.createObjectURL(blob);
      setImageURL(url);
    }, 'image/jpeg', 0.95);

    setshowCanvas(true);
    setCaptured(true);

    // Tự động lấy vị trí khi chụp
    getLocation();
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



    const formatDate = (date) => {
      const pad = (n) => (n < 10 ? '0' + n : n);
      return date.getFullYear().toString() 
        + pad(date.getMonth() + 1) 
        + pad(date.getDate()) 
        + "_" 
        + pad(date.getHours()) 
        + pad(date.getMinutes()) 
        + pad(date.getSeconds());
    };

    // Trong capturePhoto hoặc handleSend:
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
      console.log("Upload thành công:", result);
      // Giả sử backend trả về đường link ảnh dưới result.imageUrl

      
      setSendSuccessMsg(`Đã gửi thành công! Link: ${filename}`);
      
      
      setTimeout(() => {
      setOpen(false);
      },2000);
    } catch (err) {
      setError("Lỗi upload ảnh: " + err.message);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <Stack direction="row">
        <DialogTitle>{dialogTitle}</DialogTitle>
        {captured &&
        <Button variant="contained"
            sx={{ width: 30, height: 30, mt: 1 }}
            onClick={() => {
              setImageURL(null);
              setCaptured(false);
            }}
          >
            <ArrowClockwise />
        </Button>}
      </Stack>
      <DialogContent>
        <video
          ref={videoRef}
          width="100%"
          height="auto"
          autoPlay={!captured}
          playsInline
          style={{ borderRadius: 8, backgroundColor: '#000', display: captured ? 'none' : 'block' }}
        />

        {imageURL && captured  && (
          <>
          <Box sx={{ top: 0, left: 0, marginTop: 12, textAlign: 'center' }}>
            <img
              src={imageURL}
              alt="Ảnh chụp"
              style={{ maxWidth: '100%', borderRadius: 8 }}
            />
            {position.latitude && position.longitude && (
              <Typography sx={{ mt: 1 }}>
                {statusMsg}
              </Typography>
            )}
          </Box>

          
          </>
        )}

        {!captured &&
        <Button variant="contained" fullWidth sx={{ mt: 1 }} onClick={capturePhoto}>
          Chụp hình kèm gps
        </Button>}

        <canvas ref={canvasRef} style={{ display: "none" }} />

       

        

        
{/* 
        <Button variant="outlined" fullWidth sx={{ mt: 1 }} onClick={getLocation}>
          Lấy vị trí hiện tại
        </Button> */}

        {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="receiver-label">Camera</InputLabel>
          <Select
            labelId="receiver-label"
            value={receiver}
            label="Camera"
            onChange={(e) => setReceiver(e.target.value)}
          >
            <MenuItem value="user">Trước</MenuItem>
            <MenuItem value="enviroment">Sau</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button onClick={handleSend} variant="contained">Gửi</Button>
      </DialogActions>

      {sendSuccessMsg && (
        <Typography sx={{ mt: 2, mx: 2, fontSize:10, color: 'green', wordBreak: 'break-word' }}>
          {sendSuccessMsg}
        </Typography>
      )}
    </Dialog>
  );
};

export default CameraDialog;
