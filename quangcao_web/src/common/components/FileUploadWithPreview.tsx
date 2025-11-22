import React, { useState, useEffect } from "react";
import Resizer from "react-image-file-resizer";
import CircularProgress from "@mui/material/CircularProgress";
import DescriptionIcon from '@mui/icons-material/Description';
import { useTaskContext } from "../common/hooks/useTask";
import type { MessageTypeProps } from "../@types/chat.type";
import { useApiStatic } from "../common/hooks/useApiHost";

interface FileUploadWithPreviewProps {
  message: MessageTypeProps;
  handleSend: (file: File) => void;
}

const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

const FileUploadWithPreview: React.FC<FileUploadWithPreviewProps> = ({ message, handleSend }) => {
  const { taskDetail } = useTaskContext();

  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isImage, setIsImage] = useState(false);

  // Khi message thay đổi (ví dụ backend trả về kết quả), cập nhật thumbnail mới
  useEffect(() => {
    if (message.thumb_url) {
      setThumbnail(message.thumb_url);
      setIsImage(true);
      setLoading(false);
    } else if (message.file_url) {
      // Kiểm tra file_url có phải ảnh không dựa trên đuôi hoặc mime type (tuỳ trường hợp)
      const ext = message.file_url.split('.').pop()?.toLowerCase() || '';
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
        setThumbnail(message.file_url);
        setIsImage(true);
      } else {
        setThumbnail(null);
        setIsImage(false);
      }
      setLoading(false);
    } else {
      setThumbnail(null);
      setIsImage(false);
      setLoading(false);
    }
  }, [message]);

  return (
    
      <div style={{ position: 'relative', width: 100, height: 70 }}>
        <a href={`${useApiStatic()}/${message.file_url}`} target="_blank" rel="noreferrer">
          {loading && thumbnail && (
            <>
              <img src={`${useApiStatic()}/${message.thumb_url}`} alt="thumbnail" style={{ width: 100, height: 70, objectFit: 'cover', opacity: 0.5 }} />
              <CircularProgress size={24} style={{ position: 'absolute', top: 'calc(50% - 12px)', left: 'calc(50% - 12px)' }} />
            </>
          )}
          {!loading && isImage && thumbnail && (
            <img src={`${useApiStatic()}/${message.thumb_url}`} alt="thumbnail" style={{ width: 100, height: 70, objectFit: 'cover' }} />
          )}
          {!isImage && !thumbnail && (
            <DescriptionIcon fontSize="large" style={{ width: 100, height: 70 }} />
          )}
        
      </a>
    </div>
    
  );
};

export default FileUploadWithPreview;
