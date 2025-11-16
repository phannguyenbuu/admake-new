import { socket } from './socket';
import { Box, Fab, IconButton, InputAdornment, Stack, TextField, Tooltip } from '@mui/material';
import React, { forwardRef, useRef, useState, useEffect } from 'react';
import type { Ref } from 'react';
import { styled, useTheme } from "@mui/material/styles";
import { useUser } from "../../../../common/hooks/useUser.js";
import type { MessageTypeProps } from '../../../../@types/chat.type.js';
import { generateUniqueIntId } from '../../../../@types/chat.type.js';
import { useApiHost } from '../../../../common/hooks/useApiHost.js';
import CameraIcon from '@mui/icons-material/Camera';
import SendIcon from '@mui/icons-material/Send';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LinkIcon from '@mui/icons-material/Link';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { notification } from 'antd';
import { useChatGroup } from '../../ProviderChat.js';


const StyledInput = styled(TextField)(({ theme }) => ({
  "& .MuiInputBase-input": {
    paddingTop: '12px',
    paddingBottom: '12px',
  }  
}));

const Actions = [
  {
    color:'#ddd',
    icon: <CameraIcon fontSize="large"/>,
    y:50,
    title:'Image'
  },
];

const getTypeName = (file_url:string) => {
  let type = 'msg';
  if(file_url !== '') {
    type = 'doc';
    const ext = file_url.toLowerCase();

    if(file_url.startsWith('http') || file_url.startsWith('www')) {
      type = 'link';
    } else if(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.avi','.jfif'].some(s => ext.includes(s))) {
      type = 'img';
    }
  }
  return type;
}


function formatBytes(bytes:number, decimals:number = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface ChatInputProps {
  onEnterKey: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  setOpenPicker: React.Dispatch<React.SetStateAction<boolean>>;
  handleSendMessage: (message: string, url: string) => void;
}

const ChatInput = forwardRef<HTMLDivElement, ChatInputProps>(
  ({ inputValue, setInputValue, setOpenPicker, 
    handleSendMessage 
  }, ref: Ref<HTMLDivElement>) => {

  

  const [openAction, setOpenAction] = useState(false);
  const {userId, username, userRoleId, userIcon } = useUser();
  const {workspaceEl, setWorkspaceEl} = useChatGroup();

  

  
  const handleUploadDocument = async () => {
    setOpenAction(prev => !prev);
    try {
      const input = document.createElement("input");
      input.type = "file";

      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (!target.files) return;
        const file = target.files[0];
        if (!file) return;

        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 100) {
          notification.error({message:"Kích thước file vượt quá 100MB, vui lòng chọn file nhỏ hơn."});
          return;
        }
        
              
        const formData = new FormData();
        formData.append("file", file);
        formData.append("groupId", workspaceEl?.id.toString() || '');
        formData.append("role", userRoleId.toString());
        formData.append("userId", userId?.toString() || '');

        for (const [key, value] of formData.entries()) {
          console.log(`${key}: ${value}`);
        }

        // Hoặc log tất cả các entries như mảng
        console.log('Upload');
        console.log(Array.from(formData.entries()));

        const uploadResponse = await fetch(`${useApiHost()}/message/upload`, {
          method: "POST",
          body: formData,
        });


        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`File upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
        }

        const uploadResult = await uploadResponse.json();
        // console.log('Upload', uploadResult);
        const fileUrl = `${uploadResult.filename}`; // URL file mới trên server

        handleSendMessage(`${new Date(Date.now()).toLocaleString()}-${formatBytes(file.size)}`, fileUrl);
        console.log("Document message sent successfully");
      };

      input.click();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        notification.error({message: "Upload document failed",
          description:error.message});
      } else {
        console.error("Unknown error", error);
        notification.error({message: "Upload document failed"});
      }
    }
  };


  return (
    <StyledInput
      value={inputValue} 
      onChange={(e) => setInputValue(e.target.value)}
      fullWidth placeholder='Write a message...' variant='filled'
      onKeyDown={(e) => {
          if (e.key === 'Enter') {
              e.preventDefault();
              handleSendMessage(inputValue, '');
          }
      }}
      InputProps={{
        disableUnderline: true,
        startAdornment: 
          <Stack sx={{width:'max-content', mt:-2}}>
            <Stack sx={{position:'relative', display: openAction ? 'inline-block' : 'none'}}>
              {Actions.map((el,idx)=>(
                <Tooltip key={`ActionItem-${idx}`}  placement='right' title={el.title}>
                  <Fab sx={{position:'absolute', top: -el.y, backgroundColor: el.color}}>
                    {el.icon}
                  </Fab>
                </Tooltip>
              ))}
              <Tooltip placement='right' title='Document'>
                <Fab  onClick={() => handleUploadDocument()} sx={{position:'absolute', top: -120, backgroundColor: '#0159b2'}}>
                  <InsertDriveFileIcon fontSize="large"/>
                </Fab>
              </Tooltip>
            </Stack>
            <InputAdornment position="start">
              <IconButton onClick={() => setOpenAction(prev => !prev)}>
                <LinkIcon/>
              </IconButton>
            </InputAdornment>
          </Stack>,
        endAdornment: 
          <InputAdornment position="end">
            <IconButton onClick={() => setOpenPicker(prev => !prev)}>
              <SentimentSatisfiedIcon />
            </IconButton>
          </InputAdornment>
      }}
    />
  )
});

interface FooterProps {
  setMessages: React.Dispatch<React.SetStateAction<MessageTypeProps[]>>;
  left: number;
  width: number;
}

const Footer = forwardRef<HTMLDivElement, FooterProps>(
  ({ setMessages, left, width }, ref: Ref<HTMLDivElement>) => {
  // const [showFileUpload, setShowFileUpload] = useState(false);
  const {userId, username, userRoleId, isMobile, generateDatetimeId} = useUser();
  const [openPicker, setOpenPicker] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const full = userRoleId === -2;

  const {workspaceEl} = useChatGroup();
  
  useEffect(() => {
    socket.connect();
    console.log("WebSocket URL:", (socket.io.engine.transport as any).uri);

    socket.on('connect', () => {
      console.log('Connected to server', socket.id);
      socket.emit('join', { workspace_id: workspaceEl?.id });
    });

    socket.on('admake/chat/message', (msg) => {
      console.log('Received message:', msg);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('admake/chat/message_ack', data => {
      setMessages(prev =>
        prev.map(m => 
          m.message_id === data.message_id ? { ...m, status: 'success', message_id: data.message_id } : m
        )
      );
    });

    return () => {
      socket.off('connect');
      socket.off('admake/chat/message');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, [workspaceEl?.id]);

  function get_user_name():string {
    const user = JSON.parse(localStorage.getItem('Admake-User-Access') || '{}');
    return user?.username || '';
  }

  
  // console.log(generateDatetimeId());


  const sendMessage = (message: string, file_url = '') => {
    if(!message || message === '') return;

    if (socket.connected) {
      const timestamp = Date.now();
      console.log("Username",  get_user_name());
      
      const data: MessageTypeProps = {
        // id: generateUniqueIntId(),
        workspace_id: workspaceEl?.id || '',
        react: {rate:0},
        preview: '',
        reply: '',
        role: userRoleId,
        icon: '',
        
        type: getTypeName(file_url),
        incoming: false,
        // group_id: workspaceEl?.id || '',
        user_id: userId,
        username: get_user_name(),
        text: message,
        file_url,
        link: '',
        message_id: `msg-${generateDatetimeId()}`,
        is_favourite: false,
        createdAt: new Date(timestamp),
        updatedAt: new Date(timestamp),
        deletedAt: null,
        status: 'sending'
      };

      console.log('Send message', data);

      setMessages(prev => [...prev, data]);
      socket.emit('admake/chat/message', data);
    } else {
      console.warn('Socket.IO not connected.');
    }

    setInputValue('');
  };


  const sendRewardMessage = () => {
    if (socket.connected) {
      const timestamp = Date.now();
      // console.log("Username",  get_user_name());
      
      const data: MessageTypeProps = {
        // id: generateUniqueIntId(),
        workspace_id: workspaceEl?.id,
        react: {rate:0},
        preview: '',
        reply: '',
        role: userRoleId,
        icon: '',
        type: 'timeline',
        incoming: false,
        // group_id: workspaceEl?.id,
        user_id: userId,
        username: get_user_name(),
        text: 'Quý khách hàng vui lòng đánh giá dự án này?',
        file_url: '',
        link: '',
        message_id: `tl-${generateDatetimeId()}`,
        is_favourite: false,
        createdAt: new Date(timestamp),
        updatedAt: new Date(timestamp),
        deletedAt: null,
        status: 'sending'
      };

      console.log('Send REWARD message', socket.io.opts.host, data);

      setMessages(prev => [...prev, data]);
      socket.emit('admake/chat/message', data);

      
    } else {
      console.warn('Socket.IO not connected.');
    }

    setInputValue('');
  };

  const parentRef = useRef<HTMLDivElement>(null);
  
  return (
    <>
      {/* {showFileUpload && <FileUpload onUploadComplete={handleUploadComplete} />} */}

        <Stack
          direction='row'
          alignItems='center'
          spacing={0.5}
          p={0.5}
          sx={{
            backgroundColor: "#00B4B6",
            position: 'absolute',
            bottom: full ? (isMobile ? 670 : 25) : 0,
            left: left - (full ? (isMobile ? 7 : 25) : 0),
            width: width,
            zIndex: 1300, // đảm bảo nổi trên các phần tử khác
          }}
        >
          <ChatInput
            onEnterKey={() => sendMessage(inputValue)}
            ref={ref}
            inputValue={inputValue}
            setInputValue={setInputValue}
            setOpenPicker={setOpenPicker}
            handleSendMessage={sendMessage}
          />
          
          <Box sx={{ height: 48, width: 48, backgroundColor: '#ccc', borderRadius: 1.5 }} 
            onClick={() => sendMessage(inputValue)}
            >
            <Stack sx={{ height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <IconButton><SendIcon/></IconButton>
            </Stack>
          </Box>

          {full && <Box sx={{ height: 48, width: 48, backgroundColor: '#ccc', borderRadius: 1.5 }} 
            onClick={() => sendRewardMessage()}
            >
            <Stack sx={{ height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <IconButton><ThumbUpIcon sx={{color:'orange'}}/></IconButton>
            </Stack>
          </Box>}
        </Stack>
      
    </>
  );
});

export default Footer;
