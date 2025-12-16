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
import type { MessageTypeProps } from "../../../../@types/chat.type";
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

import ImagePasteUpload,{createThumbnail} from "./ImagePasteUpload";

dayjs.locale('vi'); // thiết lập locale

interface JobAssetProps {
  title?: string;
  type?: string; // là ứng tiền hay hình ảnh tham khảo công trình
  readOnly?: boolean;
}

const JobAsset: React.FC<JobAssetProps> = ({ title, type, readOnly = false }) => {
  
  const {taskDetail, setTaskDetail} = useTaskContext();
  const {userId, username, isMobile, 
        fullName, generateDatetimeId,
        tmpTaskCreatedAssets, setTmpTaskCreatedAssets,
        tmpTaskCreatedMessages, setTmpTaskCreatedMessages} = useUser();

  const [ListMessages, setListMessages] = useState<MessageTypeProps[]>([]);
  const [Assets, setAssets] = useState<MessageTypeProps[]>([]);
  const [thumbLoading, setThumbLoading] = useState(false);

  const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  
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
    if(!taskDetail || !taskDetail.assets)
    {
      setTmpTaskCreatedAssets([]);
      setTmpTaskCreatedMessages([]);
      setAssets([]);
      setListMessages([]);
      return;
    } 

    const imgList = taskDetail.assets.filter(el => el.type === type && el.file_url && el.file_url != '');
    const msgList = taskDetail.assets.filter(el => el.type === type && el.text && el.text != '');

    
    setAssets(imgList);
    setListMessages(msgList);
  },[taskDetail]);

  const handleAssetSend = async (file: File) => {
    
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
      
      if(taskDetail)
      {
        const response = await fetch(`${useApiHost()}/task/${taskDetail?.id}/upload`, {
          method: "PUT",
          body: formData,
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const result = await response.json();
        notification.success({ message: "Đã upload thành công!", description: result });
        // console.log('success is image?',result.filename,isImageFile(result.filename));
        setAssets(prev => prev ? [...prev, result.message] : [result.message]);
        setTaskDetail(prev => {
          if (!prev) return null; // handle null case explicitly
          
          return {
            ...prev,
            assets: prev.assets ? [...prev.assets, result.message] : [result.message],
            // ensure all required fields like title, description exist in prev,
            // or provide defaults here if needed to satisfy the type
          };
        });
      }else if (type === "task"){
        const response = await fetch(`${useApiHost()}/task/new/upload`, {
          method: "PUT",
          body: formData,
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const result = await response.json();
        notification.success({ message: "Đã upload local thành công!", description: result });

        setTmpTaskCreatedAssets(prev => prev ? [...prev, result.message] : [result.message]);
      //   createThumbnail(file,100,70,(blobTxt) => {
      //     if(blobTxt)
      //     {
      //       // console.log('Blob', blobTxt);
      //       var tmp: MessageTypeProps = {
      //                     message_id: generateDatetimeId(),
      //                     user_id: userId,
      //                     file_url:file.name, 
      //                     username: fullName ?? '',
      //                     thumb_url:blobTxt};

      //       setTmpTaskCreatedAssets(prev => prev ? [...prev, tmp] : [tmp]);
      //     }
      //   });
      }

    } catch (err: any) {
      notification.error({ message: "Lỗi upload ảnh:", description: err.message });
    } finally {
      setThumbLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // if(!taskDetail || !taskDetail?.id) return;

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // setSelectedFile(file);
      handleAssetSend(file);
    }
  };


  function getFilenameFromUrl(url: string) {
    return url.substring(url.lastIndexOf('/') + 1);
  }

  
  const handleDelete = (message_id: string | number| undefined) => {
    if(!taskDetail)
    {
      setTmpTaskCreatedAssets(prev => prev.filter(asset => asset.message_id !== message_id));
      return;
    }

    fetch(`${useApiHost()}/message/${message_id}`, {
      method: 'DELETE',
    })
    .then(response => {
      if (!response.ok) 
        notification.error({message:'Failed to delete message', description:message_id});
      else
      {
        notification.success({message:'Message deleted successfully', description:message_id});
        setAssets(prev => prev.filter(asset => asset.message_id !== message_id));
        setTaskDetail(prev => {
            if (prev === null) return null;
            
            return{
            ...prev,
            assets: prev.assets?.filter(item => item.message_id !== message_id)
          }
        });
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
    formData.append("text", text || '');
    formData.append("task_id", taskDetail?.id.toString() ?? '');

    // console.log('Upload', type, Object.fromEntries(formData.entries()));
    

    try {
      if(taskDetail)
      {
      const response = await fetch(`${useApiHost()}/task/${taskDetail?.id}/message`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const result = await response.json();
      notification.success({ message: "Đã gửi comment thành công!", description: result });
      // console.log('success is image?',result.filename,isImageFile(result.filename));
      setListMessages(prev => prev ? [...prev, result.message] : [result.message]);
      setTaskDetail(prev => {
        if (! prev ) return null; // handle null case explicitly
        if (prev.assets === null) prev.assets = [];

        return {...prev,
          assets: prev.assets ? [...prev.assets, result.message] : [result.message],};
      });
    }else if (type === "task"){
      // console.log("G",text);
      var tmp: MessageTypeProps = {
                    type,
                    message_id: generateDatetimeId(),
                    user_id: userId,
                    username: fullName ?? '',
                    text};
                    
      setTmpTaskCreatedMessages(prev => prev ? [...prev, tmp] : [tmp]);
    }

    } catch (err: any) {
      notification.error({ message: "Lỗi gửi comment:", description: err.message });
    } finally {
      setThumbLoading(false);
    }
  };

  
  const handleMessageDelete = (message_id: string | number| undefined) => {
    if(!taskDetail)
    {
      setTmpTaskCreatedMessages(prev => prev.filter(asset => asset.message_id !== message_id));
      return;
    }

    fetch(`${useApiHost()}/message/${message_id}`, {
      method: 'DELETE',
    })
    .then(response => {
      if (!response.ok) 
        notification.error({message:'Failed to delete message', description:message_id});
      else
      {
        setListMessages(prev => prev.filter(asset => asset.message_id !== message_id));
        setTaskDetail(prev => {
            if (prev === null) return null;
            
            return{
            ...prev,
            assets: prev?.assets?.filter(item => item.message_id !== message_id)
          }
        });
        notification.success({message:'Message deleted successfully', description:message_id});
      }

      
    })
    .catch(error => {
      console.error('Error deleting message:', error);
    });
  };

  const handleChangeFavourite = (message_id: string, checked: boolean) => {
    setListMessages(prevMessages =>
      prevMessages.map(m =>
        m.message_id === message_id
          ? { ...m, is_favourite: checked }
          : m
      )
    );

    fetch(`${useApiHost()}/message/${message_id}/favourite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }, // phải có header này
      body: JSON.stringify({ favourite: checked }) // stringify đối tượng JSON
    })
      .then(response => {
        if (!response.ok) {
          notification.error({ message: 'Failed to check message', description: checked });
        } else {
          notification.success({ message: 'Message check successfully', description: checked });
        }
      })
      .catch(error => {
        console.error('Error deleting message:', error);
      });
  };

  
  return (
    <>
    <Stack style={{maxWidth: isMobile? 300: '100%'}}>
      {!readOnly && 
      <Stack direction="row" spacing={1} sx= {{width:'100%'}}>
        <label htmlFor={`upload-image-file-${type}`}>
          <IconButton color="primary" component="span"
            aria-label="upload picture" size="small"
            sx={{ border: "1px dashed #3f51b5", width: 40, height: 40,}} >
            <AddIcon />
          </IconButton>
        </label>

         <ImagePasteUpload 
                title={title} 
                onMessageSend={handleMessageSend} 
                onAssetSend={handleAssetSend}
                isCash={type?.includes('cash')}
            />
      </Stack>}

      {[...ListMessages,...tmpTaskCreatedMessages].map((el, index) => 
      {
        console.log("List", el);
        return <Stack direction="row" key={index} spacing={1} alignItems="center">
          {title === "Thông tin từ admin" &&
            <input
              type="checkbox"
              checked={el.is_favourite}
              onChange={(e) => handleChangeFavourite(el?.message_id ?? '', e.target.checked)}/>}
          
          <Typography style={{ fontSize: 12, fontWeight: 700 }}>
            {el.username}:
          </Typography>
          <Typography style={{ fontSize: 10, fontWeight: 500 }}>
            { type?.includes("cash") ? `${el?.text?.split('/')[0]}[${el.text?.split('/')[el.text.split('/').length - 1]}]` : el.text }
          </Typography>

          {!readOnly && <DeleteConfirm elId={el?.message_id ?? ''} 
            onDelete={handleMessageDelete} text='tin nhắn'/>}
        </Stack>
      }
      )}



      <Stack direction="row" spacing={1}>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ flexWrap: 'wrap', overflowY: 'auto', height: 150, width: '100%', minHeight: 200 }} // Thêm thuộc tính flexWrap để xuống dòng
        >
         
        {[...Assets,...tmpTaskCreatedAssets].map((el, index) => {
            const url = el.file_url ? getFilenameFromUrl(el.file_url) :  null;
            
            return (
              <Stack key={index} direction="column" alignItems="center" spacing={1} sx={{ width: 'calc(33.33% - 8px)' }}>
                {url && <FileUploadWithPreview handleSend={handleAssetSend} message={el}/>}

                <Stack direction="row" gap={0}>
                  {!readOnly && <DeleteConfirm elId={el?.message_id ?? ''} 
                    onDelete={handleDelete} text='tài liệu'/>}
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
    </>
  );
};

export default JobAsset;


