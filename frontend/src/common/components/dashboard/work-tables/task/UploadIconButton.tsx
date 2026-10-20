import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, type ChangeEvent } from 'react';
import {
  CircularProgress,
  Tooltip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { parseTaskIconList, type Task } from '../../../../@types/work-space.type';
import { useApiHost, useApiStatic } from '../../../../common/hooks/useApiHost';
import { useTaskContext } from '../../../../common/hooks/useTask';
import { TOKEN_LABEL } from '../../../../common/config';
import { notification } from 'antd';
import ImageViewerModal from '../../../modal/ImageViewerModal';

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

const UploadIconButton = forwardRef<UploadIconButtonHandle, UploadIconButtonProps>(
  ({ taskDetail, onIconsChange, apiUrl }, ref) => {
    const [loading, setLoading] = useState(false);
    const [iconUrls, setIconUrls] = useState<string[]>([]);
    const [selectedViewerUrl, setSelectedViewerUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const apiStatic = useApiStatic();
    const apiHost = useApiHost();
    const lastTaskIdRef = useRef<string | null | undefined>(undefined);
    const { setTaskDetail } = useTaskContext();

    useEffect(() => {
      const currentId = taskDetail?.id ?? null;
      if (lastTaskIdRef.current !== currentId) {
        lastTaskIdRef.current = currentId;
        const icons = parseTaskIconList(taskDetail?.icon);
        setIconUrls(icons);
      }
    }, [taskDetail]);

    const resolveUrl = (url: string) => {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      if (url.startsWith('/api/static/') || url.startsWith('/static/')) return url;
      return `${apiStatic}/${url}`;
    };

    const uploadImageFile = async (file: File) => {
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
          let nextIcons: string[] = [];

          if (taskDetail?.id && Array.isArray(data.icons)) {
            nextIcons = data.icons.filter(
              (item: unknown): item is string => typeof item === 'string' && item.trim() !== ''
            );
            if (data.task) {
              setTaskDetail(data.task);
            }
          } else {
            const newIcon = data.thumb_url || data.filename || data.icon;
            nextIcons = newIcon ? [...iconUrls, newIcon] : iconUrls;
          }

          setIconUrls(nextIcons);
          onIconsChange(nextIcons);

          notification.success({
            message: 'Đã tải ảnh lên thành công',
            description: data.filename ? `File: ${data.filename}` : undefined,
          });
        } else {
          notification.error({
            message: 'Upload thất bại',
            description: data.error || 'Lỗi không xác định',
          });
        }
      } catch (error) {
        console.error('Upload icon error:', error);
        notification.error({
          message: 'Lỗi kết nối',
          description: 'Không thể upload ảnh, vui lòng thử lại',
        });
      } finally {
        setLoading(false);
      }
    };

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      e.target.value = '';

      for (const file of files) {
        await uploadImageFile(file);
      }
    };

    const handleDeleteIcon = async (idxToDelete: number, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        if (taskDetail?.id) {
          const res = await fetch(`${apiHost}/task/${taskDetail.id}/delete-icon?idx=${idxToDelete}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            const nextIcons = Array.isArray(data.icons) ? data.icons : [];
            setIconUrls(nextIcons);
            onIconsChange(nextIcons);
            setTaskDetail(prev =>
              prev ? { ...prev, icon: nextIcons.length > 0 ? JSON.stringify(nextIcons) : undefined } : prev
            );
            notification.success({ message: 'Đã xóa ảnh thành công' });
            return;
          }
        }

        // Fallback or for draft task
        const nextIcons = iconUrls.filter((_, idx) => idx !== idxToDelete);
        setIconUrls(nextIcons);
        onIconsChange(nextIcons);
        notification.success({ message: 'Đã xóa ảnh' });
      } catch (err) {
        console.error('Failed to delete icon:', err);
        notification.error({ message: 'Lỗi khi xóa ảnh' });
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        uploadImageFile,
      }),
      [iconUrls, apiUrl, taskDetail]
    );

    const handleUploadClick = () => {
      fileInputRef.current?.click();
    };

    return (
      <div className="w-full">
        {iconUrls.length === 0 ? (
          <div
            onClick={handleUploadClick}
            className="w-full h-32 rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/20 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all duration-200 text-slate-400 hover:text-teal-600 bg-slate-50/50"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <CircularProgress size={24} className="text-teal-600" />
                <span className="text-xs font-semibold text-teal-600">Đang tải ảnh lên...</span>
              </div>
            ) : (
              <>
                <CloudUploadIcon className="text-3xl text-slate-400 group-hover:text-teal-500" />
                <div className="text-center">
                  <span className="text-xs font-bold uppercase tracking-wider block text-slate-600">
                    Tải ảnh công việc lên
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Hỗ trợ tải nhiều ảnh cùng lúc, dán từ clipboard
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Hình ảnh công việc ({iconUrls.length} ảnh):</span>
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={loading}
                className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-semibold cursor-pointer disabled:opacity-50"
              >
                <AddPhotoAlternateIcon className="!text-base" />
                Thêm ảnh khác
              </button>
            </div>

            <div className="flex flex-wrap gap-2.5 items-center">
              {iconUrls.map((icon, idx) => {
                const fullUrl = resolveUrl(icon);
                return (
                  <div
                    key={`${icon}-${idx}`}
                    onClick={() => setSelectedViewerUrl(fullUrl)}
                    className="relative group w-24 h-24 sm:w-28 sm:h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all shrink-0"
                  >
                    <img
                      src={fullUrl}
                      alt={`Task photo ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />

                    {/* Hover overlay hint */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                      <ZoomInIcon className="!text-xl" />
                    </div>

                    {/* Delete button */}
                    <Tooltip title="Xóa ảnh này">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteIcon(idx, e)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer z-10"
                      >
                        <DeleteOutlineIcon className="!text-sm" />
                      </button>
                    </Tooltip>
                  </div>
                );
              })}

              {/* Add more button tile */}
              <div
                onClick={handleUploadClick}
                className="w-24 h-24 sm:w-28 sm:h-24 rounded-lg border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/30 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all text-slate-400 hover:text-teal-600 shrink-0"
              >
                {loading ? (
                  <CircularProgress size={20} className="text-teal-600" />
                ) : (
                  <>
                    <AddPhotoAlternateIcon className="!text-xl" />
                    <span className="text-[10px] font-semibold">Thêm ảnh</span>
                  </>
                )}
              </div>
            </div>
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

        <ImageViewerModal
          open={!!selectedViewerUrl}
          onCancel={() => setSelectedViewerUrl(null)}
          imageUrl={selectedViewerUrl ? selectedViewerUrl.replace('thumbs/thumb_', '') : null}
          title="Xem ảnh công việc"
        />
      </div>
    );
  }
);

UploadIconButton.displayName = 'UploadIconButton';

export default UploadIconButton;
