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

  const lastTaskIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const currentId = taskDetail?.id ?? null;
    if (lastTaskIdRef.current !== currentId) {
      lastTaskIdRef.current = currentId;
      const icons = parseTaskIconList(taskDetail?.icon);
      setIconUrls(icons);

      if (icons.length > 0) {
        setPreview(`${apiStatic}/${icons[0]}`);
      } else {
        setPreview(null);
      }
    }
  }, [apiStatic, taskDetail]);

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
      <div className="relative flex items-center justify-center w-full min-h-[128px]">
        {/* Image Preview Box - Centered */}
        <div className="relative group">
          {preview ? (
            <Tooltip title="Click để xem ảnh gốc">
              <div 
                onClick={() => setLightboxOpen(true)}
                className="w-48 h-32 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 bg-slate-100 flex items-center justify-center"
              >
                <img 
                  src={preview} 
                  alt="Task icon" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </Tooltip>
          ) : (
            <div 
              onClick={handleUploadClick}
              className="w-48 h-32 rounded-xl border border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/30 cursor-pointer flex flex-col items-center justify-center gap-1.5 transition-all duration-200 text-slate-400 hover:text-teal-600 bg-slate-50/50"
            >
              <CloudUploadIcon className="text-xl" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Tải ảnh lên</span>
            </div>
          )}
        </div>

        {/* Buttons - outside to the far right, absolute positioned, stacked vertically */}
        {hasExistingIcon && (
          <div className="absolute right-0 flex flex-col gap-2">
            <Tooltip title="Thay đổi ảnh">
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={loading}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-teal-600 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <CircularProgress size={16} className="text-teal-600 animate-spin" /> : <EditIcon className="!text-lg" />}
              </button>
            </Tooltip>

            <Tooltip title="Xóa ảnh">
              <button
                type="button"
                onClick={handleRemoveClick}
                disabled={loading}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50/50 text-rose-500 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 cursor-pointer"
              >
                <DeleteOutlineIcon className="!text-lg" />
              </button>
            </Tooltip>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

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
