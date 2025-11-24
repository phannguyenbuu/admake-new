import React, { useState, useEffect } from "react";
import { Typography, Stack, IconButton, Box, TextField, Switch } from "@mui/material";
import { Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useApiHost, useApiStatic } from "../../../../common/hooks/useApiHost";
import { notification } from "antd";
import DescriptionIcon from "@mui/icons-material/Description"; // icon tài liệu
import { CircularProgress } from '@mui/material';
import { useUser } from "../../../../common/hooks/useUser";
import { useTaskContext } from "../../../../common/hooks/useTask";
import CloseIcon from '@mui/icons-material/Close';
// import type { MessageTypeProps } from "../../../../@types/chat.type";
import SendIcon from '@mui/icons-material/Send';
import FileUploadWithPreview from "../../../FileUploadWithPreview";
import { Modal } from "antd";
import {Button,Checkbox,FormControlLabel,} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import BankTransferModal from "./BankTransformModal";
import dayjs, { Dayjs } from "dayjs";
import 'dayjs/locale/vi';

import DeleteConfirm from "../../../DeleteConfirm";
import { InputNumber } from 'antd';
import bankList from "./banklist.json";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result); // Chuỗi base64 dạng data URL
      } else {
        reject(new Error('Cannot convert blob to base64 string'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}


export function createThumbnail(
  file: File,
  maxWidth: number,
  maxHeight: number,
  callback: (blob: string | null) => void
): void {
  const reader = new FileReader();

  reader.onload = (event: ProgressEvent<FileReader>) => {
    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Tính kích thước thumbnail giữ tỉ lệ
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        callback(null);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Trả về ảnh thumbnail dưới dạng blob
      canvas.toBlob((blob) => {
        if (blob) {
          blobToBase64(blob).then(base64 => {
            callback(base64);
          }).catch(() => callback(null));
        } else {
          callback(null);
        }
      }, 'image/jpeg', 0.8);
    };

    if (event.target?.result) {
      img.src = event.target.result as string;
    } else {
      callback(null);
    }
  };

  reader.readAsDataURL(file);
}


interface ChatInputProps {
  children?: React.ReactNode;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  onSend: (message: string) => void;
  isCash?: boolean;
  isChoose? : boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ children, onSend, message, setMessage, isCash, isChoose }) => {
  const [formOpen, setFormOpen] = useState(false);
  // const [message, setMessage] = useState('');
  const {userId, username, isMobile} = useUser();

  const handleMessageSend = () => {
    console.log("S",message);

    if(isCash)
      setFormOpen(true);
    else {
      if (message.trim() === '') return;
      onSend(message);
      setMessage('');
    }
  };

  const handleDialogClose = (value: string | null) => {
    console.log('Send', value);
    onSend(value ?? '');
    setMessage('');
  }

  return (
    <>
      <Box display="flex" alignItems="center" padding={1} borderTop="1px solid #ccc">
        {children}
        <IconButton key="send" color="primary" 
          onClick={handleMessageSend} 
          aria-label="send message"
          style={{top:-10}}
          >
          <SendIcon />
        </IconButton>
      </Box>
      <BankTransferModal 
        open={formOpen} 
        setOpen={setFormOpen} 
        onClose={handleDialogClose}
        rewardContent={isChoose? ["Thưởng", "Phạt"]:[]}/>
    </>
  );
};


interface ImagePasteUploadProps {
  onAssetSend: (file: File) => Promise<void>;
  onMessageSend: (message: string) => Promise<void>;
  // setMessageAssets: React.Dispatch<React.SetStateAction<MessageTypeProps>>;
  isCash?: boolean;
  title?: string;
}


const ImagePasteUpload: React.FC<ImagePasteUploadProps> = ({ 
  onMessageSend, isCash,
  onAssetSend, title }) => {
    const [message, setMessage] = useState<string>('');
    const {isMobile} = useUser();

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      // const target = event.target as HTMLTextAreaElement;
      
      onMessageSend(message);
      setMessage('');
    }
  };
  
  
  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    
    const items = event.clipboardData?.items;
    
    if (!items) return;

    let isImagePasted = false;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          console.log("Img:", item.type, file);
          onAssetSend(file); // Gửi file ảnh lên backend hoặc xử lý tiếp
          isImagePasted = true;
        }
      }
    }

    if (isImagePasted) {
      event.preventDefault(); // Ngăn chặn paste nội dung mặc định khi ảnh được dán
    } else {
      // Paste nội dung text bình thường, ví dụ lấy nội dung text dán và setMessage
      const text = event.clipboardData?.getData('text');
      if (text) onMessageSend(text);
    }
  };


  return (
    <Stack direction="row">
      <TextField
        placeholder={title}
        multiline
        maxRows={4}
        fullWidth
        variant="standard"
        value={message}
        onChange={e => setMessage(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={handleKeyPress}
        sx={{ marginRight: 1, minWidth: isMobile ? 200 : 300 }}
      />

      <ChatInput onSend={onMessageSend} 
                    message={message} 
                    setMessage={setMessage}
                    isCash={isCash}
                    isChoose={false}>
      </ChatInput>
    </Stack>
  );
}


export default ImagePasteUpload;