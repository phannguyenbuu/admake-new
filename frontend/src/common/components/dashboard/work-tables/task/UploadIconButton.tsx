import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, type ChangeEvent } from 'react';
import {
  IconButton,
  Stack,
  Avatar,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import { parseTaskIconList, type Task } from '../../../../@types/work-space.type';
import { useApiStatic } from '../../../../common/hooks/useApiHost';
import { TOKEN_LABEL } from '../../../../common/config';
import { notification } from 'antd';

interface UploadIconButtonProps {
  taskDetail: Task | null;
  onIconsChange: (iconUrls: string[]) => void;
  apiUrl: string;
}

export interface UploadIconButtonHandle {
  uploadImageFile: (file: File) => Promise<void>;
}

function getAuthHeaders(): HeadersInit {
  const accessToken =
    localStorage.getItem(TOKEN_LABEL) || sessionStorage.getItem(TOKEN_LABEL);

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

const UploadIconButton = forwardRef<UploadIconButtonHandle, UploadIconButtonProps>(({ taskDetail, onIconsChange, apiUrl }, ref) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [iconUrls, setIconUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiStatic = useApiStatic();

  useEffect(() => {
    const icons = parseTaskIconList(taskDetail?.icon);
    setIconUrls(icons);

    if (icons.length > 0) {
      setPreview(`${apiStatic}/${icons[0]}`);
    } else {
      setPreview(null);
    }
  }, [apiStatic, taskDetail?.icon]);

  const restorePreviewFromIcons = (icons: string[]) => {
    if (icons.length > 0) {
      setPreview(`${apiStatic}/${icons[0]}`);
    } else {
      setPreview(null);
    }
  };

  const uploadImageFile = async (file: File) => {
    const previousIcons = [...iconUrls];

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const nextIcons = Array.isArray(data.icons)
          ? data.icons.filter((item: unknown): item is string => typeof item === 'string' && item.trim() !== '')
          : [];

        setIconUrls(nextIcons);
        onIconsChange(nextIcons);
        restorePreviewFromIcons(nextIcons);

        notification.success({
          message: 'Upload thành công',
          description: data.filename ? `Icon: ${data.filename}` : undefined,
        });
      } else {
        setIconUrls(previousIcons);
        restorePreviewFromIcons(previousIcons);
        notification.error({
          message: 'Upload thất bại',
          description: data.error || 'Unknown error',
        });
      }
    } catch (error) {
      console.error('Upload icon error:', error);
      setIconUrls(previousIcons);
      restorePreviewFromIcons(previousIcons);
      notification.error({
        message: 'Lỗi kết nối',
        description: 'Vui lòng thử lại',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    await uploadImageFile(file);
  };

  useImperativeHandle(ref, () => ({
    uploadImageFile,
  }), [iconUrls, apiUrl]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveClick = () => {
    setIconUrls([]);
    setPreview(null);
    onIconsChange([]);
  };

  const hasExistingIcon = iconUrls.length > 0;

  return (
    <Stack sx={{ direction: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, border: '1px solid #999', borderRadius: 2, width: 200 }}>
      {preview ? (
        <Tooltip title={hasExistingIcon ? 'Thay đổi icon' : 'Tải icon'}>
          <Avatar
            src={preview}
            alt="Task icon"
            sx={{ width: 100, height: 70, borderRadius: 0 }}
          />
        </Tooltip>
      ) : (
        <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.300' }}>
          <CloudUploadIcon fontSize="small" />
        </Avatar>
      )}

      <Stack direction="row" spacing={1} alignItems="center">
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

        {hasExistingIcon && (
          <IconButton
            onClick={handleRemoveClick}
            size="small"
            disabled={loading}
            color="error"
          >
            <DeleteOutlineIcon />
          </IconButton>
        )}
      </Stack>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </Stack>
  );
});

UploadIconButton.displayName = 'UploadIconButton';

export default UploadIconButton;
