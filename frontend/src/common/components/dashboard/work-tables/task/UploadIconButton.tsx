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
import { useTaskContext } from '../../../../common/hooks/useTask';
import { useUser } from '../../../../common/hooks/useUser';
import { TOKEN_LABEL } from '../../../../common/config';
import { notification, Modal } from 'antd';

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
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

  const { setTaskDetail } = useTaskContext();
  const { setTmpTaskCreatedAssets } = useUser();

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
      
      // If task is new, frontend manually pushes old icons to draft assets
      if (!taskDetail?.id && iconUrls.length > 0) {
         for (const oldIcon of iconUrls) {
           const newAsset = {
             message_id: new Date().getTime().toString() + Math.random().toString().slice(2, 6),
             type: 'task',
             file_url: oldIcon,
             thumb_url: oldIcon
           };
           setTmpTaskCreatedAssets(prev => [...prev, newAsset as any]);
         }
      }

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // If task exists, backend pushed old icons and returned the updated task
        if (taskDetail?.id && data.task) {
          setTaskDetail(data.task);
        }

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
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    e.target.value = '';
    
    // Upload files sequentially so backend/frontend can push previous ones to assets
    for (const file of files) {
      await uploadImageFile(file);
    }
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
    <>
    <Stack sx={{ direction: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, border: '1px solid #999', borderRadius: 2, width: 200 }}>
      {preview ? (
        <Tooltip title="Click để xem ảnh gốc">
          <Avatar
            src={preview}
            alt="Task icon"
            onClick={() => setLightboxOpen(true)}
            sx={{
              width: 100,
              height: 70,
              borderRadius: 0,
              cursor: 'pointer',
              transition: 'opacity 0.2s, box-shadow 0.2s',
              '&:hover': {
                opacity: 0.85,
                boxShadow: '0 2px 12px rgba(0,180,182,0.3)',
              },
            }}
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
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </Stack>

    {/* ── Lightbox preview modal ─────────────────────────────────────── */}
    <Modal
      open={lightboxOpen}
      onCancel={() => setLightboxOpen(false)}
      footer={null}
      centered
      closable={false}
      width="auto"
      styles={{
        body: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 0,
          background: 'transparent',
        },
        content: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
        mask: {
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)',
        },
      }}
    >
      {preview && (
        <img
          src={preview.replace('thumbs/thumb_', '')}
          alt="Xem ảnh gốc"
          onClick={() => setLightboxOpen(false)}
          style={{
            maxWidth: '90vw',
            maxHeight: '85vh',
            objectFit: 'contain',
            borderRadius: 8,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        />
      )}
    </Modal>
    </>
  );
});

UploadIconButton.displayName = 'UploadIconButton';

export default UploadIconButton;
