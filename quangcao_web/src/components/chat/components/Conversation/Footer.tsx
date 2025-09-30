import { socket } from './socket';
import { Box, Fab, IconButton, InputAdornment, Stack, TextField, Tooltip } from '@mui/material';
import React, { forwardRef, useRef, useState, useEffect } from 'react';
import type { Ref } from 'react';
import { styled, useTheme } from "@mui/material/styles";
import { LinkSimple, PaperPlaneTilt, Smiley, Camera, File, Image, Sticker } from 'phosphor-react';
import { useUser } from "../../UserContext.jsx";
import FileUpload from './FileUpload.js';
import { useWindowDimensions } from '../../hooks/useResponsive';
import type { MessageTypeProps } from '../../../../@types/chat.type.js';
import { generateUniqueIntId } from '../../../../@types/chat.type.js';
import { useApiHost } from '../../../../common/hooks/useApiHost.js';

const StyledInput = styled(TextField)(({ theme }) => ({
  "& .MuiInputBase-input": {
    paddingTop: '12px',
    paddingBottom: '12px',
  }  
}));

const Actions = [
  {
    color:'#4da5fe',
    icon: <Image size={24}/>,
    y:102,
    title:'Photo/Video'
  },
  {
    color:'#1b8cfe',
    icon: <Sticker size={24}/>,
    y:172,
    title:'Stickers'
  },
  {
    color:'#0172e4',
    icon: <Camera size={24}/>,
    y:242,
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
    } else if(['.jpg', '.png', '.gif', '.webp', '.mp4', '.avi','.jfif'].some(s => ext.includes(s))) {
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
  groupId: number;
  handleSendMessage: (message: string, url: string) => void;
}

const ChatInput = forwardRef<HTMLDivElement, ChatInputProps>(
  ({ inputValue, setInputValue, setOpenPicker, groupId, 
    handleSendMessage 
  }, ref: Ref<HTMLDivElement>) => {

  const [openAction, setOpenAction] = useState(false);
  // const {userId, username, userRole, userIcon } = useUser();
   
  
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
      
      // Upload file lên server /upload
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(`${useApiHost()}/upload`, {
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
      alert("Upload document failed: " + error.message);
    } else {
      console.error("Unknown error", error);
      alert("Upload document failed");
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
          <Stack sx={{width:'max-content'}}>
            <Stack sx={{position:'relative', display: openAction ? 'inline-block' : 'none'}}>
              {Actions.map((el,idx)=>(
                <Tooltip key={`ActionItem-${idx}`}  placement='right' title={el.title}>
                  <Fab sx={{position:'absolute', top: -el.y, backgroundColor: el.color}}>
                    {el.icon}
                  </Fab>
                </Tooltip>
              ))}
              <Tooltip placement='right' title='Document'>
                <Fab  onClick={() => handleUploadDocument()} sx={{position:'absolute', top: -312, backgroundColor: '#0159b2'}}>
                  <File size={24}/>
                </Fab>
              </Tooltip>
            </Stack>
            <InputAdornment position="start">
              <IconButton onClick={() => setOpenAction(prev => !prev)}>
                <LinkSimple/>
              </IconButton>
            </InputAdornment>
          </Stack>,
        endAdornment: 
          <InputAdornment position="end">
            <IconButton onClick={() => setOpenPicker(prev => !prev)}>
              <Smiley/>
            </IconButton>
          </InputAdornment>
      }}
    />
  )
});



interface FooterProps {
  setMessages: React.Dispatch<React.SetStateAction<MessageTypeProps[]>>;
  groupId: number;
}


const Footer = forwardRef<HTMLDivElement, FooterProps>(
  ({ groupId, setMessages }, ref: Ref<HTMLDivElement>) => {
  // const [showFileUpload, setShowFileUpload] = useState(false);
  const [openPicker, setOpenPicker] = useState(false);
  const [inputValue, setInputValue] = useState('');
  // const {width, height} = useWindowDimensions();

  useEffect(() => {
    socket.connect();
    console.log("WebSocket URL:", (socket.io.engine.transport as any).uri);

    socket.on('connect', () => {
      console.log('Connected to server', socket.id);
      socket.emit('join', { group_id: groupId });
    });

    socket.on('admake/chat/message', (msg) => {
      console.log('Received message:', msg);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('message_ack', data => {
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
  }, [groupId]);

  const sendMessage = (message: string, file_url = '') => {
    if (socket.connected) {
      const timestamp = Date.now();
      
      const data: MessageTypeProps = {
        id: generateUniqueIntId(),
        preview: '',
        reply: '',
        user_role: '',
        icon: '',
        type: getTypeName(file_url),
        incoming: false,
        group_id: groupId,
        user_id: '',
        username: '',
        text: message,
        file_url,
        link: '',
        message_id: `temp-${timestamp}`,
        time: new Date(timestamp),
        status: 'sending'
      };

      setMessages(prev => [...prev, data]);
      socket.emit('admake/chat/message', data);
    } else {
      console.warn('Socket.IO not connected.');
    }

    setInputValue('');
  };

  // const handleSendMessage = (txt: string) => {
  //   if (!txt.trim()) return;
  //   sendMessage(txt, file_url = '');
  //   setInputValue('');
  // };

  return (
    <>
      {/* {showFileUpload && <FileUpload onUploadComplete={handleUploadComplete} />} */}
      <Box p={1} sx={{
        position: 'fixed',
        width: {xs:320, sm: '50vw'},
        bottom: 40,
        backgroundColor: '#fff8f8ff',
        boxShadow: '0px 0px 2px rgba(0,0,0,0.25)'
      }}>
        <Stack direction='row' alignItems='center' spacing={3}>
          <Stack sx={{ width: '100%' }}>
            <ChatInput
              onEnterKey={() => sendMessage(inputValue)}
              ref={ref}
              inputValue={inputValue}
              setInputValue={setInputValue}
              setOpenPicker={setOpenPicker}
              groupId={groupId}
              handleSendMessage={sendMessage}
            />
          </Stack>
          <Box sx={{ height: 48, width: 48, backgroundColor: '#4da5fe', borderRadius: 1.5 }} 
            onClick={() => sendMessage(inputValue)}
            >
            <Stack sx={{ height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <IconButton><PaperPlaneTilt color='#fff' /></IconButton>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </>
  );
});

export default Footer;
