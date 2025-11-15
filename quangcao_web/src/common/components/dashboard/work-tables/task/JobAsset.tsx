import React, { useState, useEffect } from "react";
import { Typography, Stack, IconButton, Box, TextField } from "@mui/material";

import DeleteIcon from '@mui/icons-material/Delete';

import AddIcon from "@mui/icons-material/Add";
import { ProjectOutlined } from "@ant-design/icons"; // Nếu bạn muốn giữ
import type { Task } from "../../../../@types/work-space.type";
import { useApiHost, useApiStatic } from "../../../../common/hooks/useApiHost";
import { notification } from "antd";
import DescriptionIcon from "@mui/icons-material/Description"; // icon tài liệu
import { CircularProgress } from '@mui/material';
import { useUser } from "../../../../common/hooks/useUser";
import { useTaskContext } from "../../../../common/hooks/useTask";
import CloseIcon from '@mui/icons-material/Close';
import type { MessageTypeProps } from "../../../../@types/chat.type";
import SendIcon from '@mui/icons-material/Send';

const isImageFile = (filename: string) => {
  // console.log('f',filename);
  if (!filename) return false;
  const ext = filename.split('#')[0].split('.').pop()?.toLowerCase();
  return ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "gif" || ext === "bmp" || ext === "webp";
};

interface JobAssetProps {
  title?: string;
  type?: string; // là ứng tiền hay hình ảnh tham khảo công trình
  // taskDetail: Task | null;
  onDelete?: (id: string) => void; 
  readOnly?: boolean;
}

const JobAsset: React.FC<JobAssetProps> = ({ title, type, onDelete, readOnly = false }) => {
  // const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const {taskDetail} = useTaskContext();
  const {userId, username, isMobile} = useUser();
  const [messageAssets, setMessageAssets] = useState<MessageTypeProps[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<MessageTypeProps[]>([]);
  const [thumbLoading, setThumbLoading] = useState(false);
  
  const formatDate = (date: Date): string => {
    const pad = (n: number) => (n < 10 ? "0" + n : n);
    return (
      date.getFullYear().toString() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      "_" +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    );
  };

  useEffect(()=>{
    if(!taskDetail || !taskDetail.assets) return;

    const imgList = taskDetail.assets.filter(el => el.type === type && el.file_url && el.file_url != '');
    const msgList = taskDetail.assets.filter(el => el.type === type && el.text && el.text != '');
    // setAssets(taskDetail?.assets);
    console.log('JobAsset taskdetail:', imgList.length, msgList.length);
    console.log(msgList);
    setFilteredAssets(imgList);
    setMessageAssets(msgList);
  },[taskDetail]);

  const handleSend = async (file: File) => {
    setThumbLoading(true);
    const now = new Date();
    const dateTimeStr = formatDate(now);

    const formData = new FormData();
    formData.append("time", dateTimeStr);
    formData.append("type", type || '');
    formData.append("file", file);
    formData.append("user_id", userId || '');
    formData.append("type", type || '');
    formData.append("task_id", taskDetail?.id.toString() ?? '');

    // console.log('Upload', type, Object.fromEntries(formData.entries()));

    try {
      const response = await fetch(`${useApiHost()}/task/${taskDetail?.id}/upload`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const result = await response.json();
      notification.success({ message: "Đã upload thành công!", description: result });
      // console.log('success is image?',result.filename,isImageFile(result.filename));
      setFilteredAssets(prev => prev ? [...prev, result.message] : [result.message]);
      // setFilteredAssets(assets.filter(el => el && el.includes('#' + role)));
    } catch (err: any) {
      notification.error({ message: "Lỗi upload ảnh:", description: err.message });
    } finally {
      setThumbLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!taskDetail || !taskDetail?.id) return;

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // setSelectedFile(file);
      handleSend(file);
    }
  };


  function getFilenameFromUrl(url: string) {
    return url.substring(url.lastIndexOf('/') + 1);
  }

  
  const handleDelete = (message_id: string) => {
    fetch(`${useApiHost()}/message/${message_id}`, {
      method: 'DELETE',
    })
    .then(response => {
      if (!response.ok) 
        notification.error({message:'Failed to delete message', description:message_id});
      else
      {
        notification.success({message:'Message deleted successfully', description:message_id});
        setFilteredAssets(prev => prev.filter(asset => asset.message_id !== message_id));
      }
    })
    .catch(error => {
      console.error('Error deleting message:', error);
    });
  };

  const handleMessageSend = async (text: string) => {
    setThumbLoading(true);
    const now = new Date();
    const dateTimeStr = formatDate(now);

    const formData = new FormData();
    formData.append("time", dateTimeStr);
    formData.append("type", type || '');
    formData.append("user_id", userId || '');
    formData.append("username", username || '');
    formData.append("type", type || '');
    formData.append("text", text || '');
    formData.append("task_id", taskDetail?.id.toString() ?? '');

    // console.log('Upload', type, Object.fromEntries(formData.entries()));

    try {
      const response = await fetch(`${useApiHost()}/task/${taskDetail?.id}/message`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const result = await response.json();
      notification.success({ message: "Đã gửi comment thành công!", description: result });
      // console.log('success is image?',result.filename,isImageFile(result.filename));
      setMessageAssets(prev => prev ? [...prev, result.message] : [result.message]);
      // setFilteredAssets(assets.filter(el => el && el.includes('#' + role)));
    } catch (err: any) {
      notification.error({ message: "Lỗi gửi comment:", description: err.message });
    } finally {
      setThumbLoading(false);
    }
  };

  
  const handleMessageDelete = (message_id: string) => {
    fetch(`${useApiHost()}/message/${message_id}`, {
      method: 'DELETE',
    })
    .then(response => {
      if (!response.ok) 
        notification.error({message:'Failed to delete message', description:message_id});
      else
      {
        notification.success({message:'Message deleted successfully', description:message_id});
        setMessageAssets(prev => prev.filter(asset => asset.message_id !== message_id));
      }
    })
    .catch(error => {
      console.error('Error deleting message:', error);
    });
  };

  return (
    <Stack style={{maxWidth: isMobile? 300: '100%'}}>
      <Stack direction="row" sx= {{width:'100%'}}>
        <label htmlFor={`upload-image-file-${type}`}>
          <IconButton color="primary" component="span"
            aria-label="upload picture" size="small"
            sx={{ border: "1px dashed #3f51b5", width: 40, height: 40,}} >
            <AddIcon />
          </IconButton>
        </label>

        {!readOnly && <ChatInput onSend={handleMessageSend} title={title ?? ''}/>}
      </Stack>

      {messageAssets.map((el, index) => 
        <Stack direction="row" key={index} spacing={1} alignItems="center">
          {readOnly &&
          <IconButton
            size="small"
            aria-label="delete"
            color="error"
            onClick={() => handleMessageDelete(el.message_id)}
            sx={{
              color: '#777',
              top: -10,
              '&:hover': {
                color: 'red',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>}
          
          <Typography style={{ fontSize: 12, fontWeight: 700 }}>
            {el.username}:
          </Typography>
          <Typography style={{ fontSize: 10, fontWeight: 500 }}>
            {el.text}
          </Typography>
        </Stack>
      )}



      <Stack direction="row" spacing={1}>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ flexWrap: 'wrap', overflowY: 'auto', height: 150, width: '100%', minHeight: 200 }} // Thêm thuộc tính flexWrap để xuống dòng
        >


        {filteredAssets.map((el, index) => {
            const url = el.file_url ? getFilenameFromUrl(el.file_url) :  null;

            return (
              <Stack key={index} direction="column" alignItems="center" spacing={1} sx={{ width: 'calc(33.33% - 8px)' }}>
                {url ? (
                  thumbLoading && index === filteredAssets.length - 1 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100 }}>
                      <CircularProgress size={24} />
                    </div>
                  ) : (
                    <a href={`${useApiStatic()}/${url}`} target="_blank" rel="noreferrer">
                      <img
                        src={`${useApiStatic()}/${url}`}
                        alt={`asset-${index}`}
                        style={{ maxWidth: 100, maxHeight: 100, borderRadius: 4 }}
                      />
                    </a>
                  )
                ) : (
                  <DescriptionIcon fontSize="large" />
                )}

                <Stack direction="row" gap={0}>
                   {readOnly &&
                  <IconButton
                    size="small"
                    aria-label="delete"
                    color="error"
                    onClick={() => handleDelete(el.message_id)}
                    sx={{
                      color: '#777',
                      top: -10,
                      '&:hover': {
                        color: 'red',
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                      },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>}
                  <Typography fontSize={12} sx={{ maxWidth: 100, whiteSpace: 'nowrap' }}>
                    {url && url.length > 9 ? `${url.substring(0, 9)}...` : url}
                  </Typography>
                </Stack>
              </Stack>
            );
          })}

        </Stack>

        <input
          key={`file-change-${type}`}
          accept="image/*"
          style={{ display: "none" }}
          id={`upload-image-file-${type}`}
          type="file"
          onChange={handleFileChange}
        />
        
      </Stack>
    </Stack>
  );
};

export default JobAsset;


const ChatInput: React.FC<{ title: string; onSend: (message: string) 
  => void }> = ({ title, onSend }) => {

  const [message, setMessage] = useState('');
  const {userId, username, isMobile} = useUser();

  const handleSend = () => {
    if (message.trim() === '') return;
    onSend(message);
    setMessage('');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Box display="flex" alignItems="center" padding={1} borderTop="1px solid #ccc">
      <TextField
        placeholder={title}
        multiline
        maxRows={4}
        fullWidth
        variant="standard"
        value={message}
        onChange={e => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        sx={{ marginRight: 1, minWidth: isMobile ? 200: 300 }}
      />
      <IconButton color="primary" onClick={handleSend} aria-label="send message">
        <SendIcon />
      </IconButton>
    </Box>
  );
};

