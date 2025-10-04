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

export default CameraSelector;