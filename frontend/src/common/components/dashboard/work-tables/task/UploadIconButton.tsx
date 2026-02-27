import React, { useState, useRef, useEffect, type ChangeEvent } from 'react';
import {
  IconButton,
  Stack,
  Avatar,
  CircularProgress,
  Tooltip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import type { Task } from '../../../../@types/work-space.type';
import { useApiHost, useApiStatic } from '../../../../common/hooks/useApiHost';
import { notification } from 'antd';

interface UploadIconButtonProps {
  taskDetail: Task | null;
  onIconChange: (iconUrl: string) => void;
  apiUrl: string;
}

const UploadIconButton: React.FC<UploadIconButtonProps> = ({
  taskDetail,
  onIconChange,
  apiUrl
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasExistingIcon, setHasExistingIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // ✅ Hiển thị icon hiện tại khi load
  useEffect(() => {
    console.log('Preview taskDetail', taskDetail);
    if(!taskDetail) return;

    if (taskDetail?.icon) {
      setPreview(`${useApiStatic()}/${taskDetail.icon}`);
      setHasExistingIcon(true);
    } else {
      setPreview(null);
      setHasExistingIcon(false);
    }
  }, [taskDetail]);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ Preview ngay lập tức
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setLoading(true);
    e.target.value = ''; // ✅ Reset input để chọn lại file cùng tên

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(apiUrl, {
        method: 'PUT',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onIconChange(data.thumb_url || data.filename || '');
        setHasExistingIcon(true);
        notification.success({
          message: '✅ Upload thành công',
          description: `Icon: ${data.filename}`
        });
      } else {
        notification.error({
          message: '❌ Upload thất bại',
          description: data.error || 'Unknown error'
        });
        // Reset preview nếu lỗi
        if (taskDetail?.icon) {
          setPreview(`${useApiStatic()}/${taskDetail.icon}`);
        } else {
          setPreview(null);
        }
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      notification.error({
        message: '❌ Lỗi kết nối',
        description: 'Vui lòng thử lại'
      });
      // Reset về icon cũ
      if (taskDetail?.icon) {
        setPreview(`${useApiStatic()}/${taskDetail.icon}`);
      } else {
        setPreview(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Stack sx={{ direction: 'column', alignItems:'center', justifyContent:'center',
         gap: 1, border: '1px solid #999', borderRadius: 2, width: 200 }}>
      {/* ✅ ICON PREVIEW */}
      {preview ? (
        <Tooltip title={hasExistingIcon ? "Thay đổi icon" : "Đã upload"}>
          <Avatar
            src={preview}
            alt="Task icon"
            sx={{ width: 100, height: 70, borderRadius: 0}}
          />
        </Tooltip>
      ) : (
        <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.300' }}>
          <CloudUploadIcon fontSize="small" />
        </Avatar>
      )}

      {/* ✅ UPLOAD BUTTON */}
      <Tooltip title={hasExistingIcon ? "Thay đổi icon" : "Upload icon"}>
        <span>
          <IconButton
            onClick={handleUploadClick}
            size="small"
            disabled={loading}
            sx={{ ml: 1 }}
          >
            {loading ? (
              <CircularProgress size={20} />
            ) : hasExistingIcon ? (
              <EditIcon color="primary" />
            ) : (
              <CloudUploadIcon />
            )}
          </IconButton>
        </span>
      </Tooltip>

      {/* ✅ HIDDEN FILE INPUT */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </Stack>
  );
};

export default UploadIconButton;
