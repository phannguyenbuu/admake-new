import { socket } from './socket';
import { Box, Fab, IconButton, InputAdornment, Stack, TextField, Tooltip } from '@mui/material';
import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { styled, useTheme } from "@mui/material/styles";
import { LinkSimple, PaperPlaneTilt, Smiley, Camera, File, Image, Sticker } from 'phosphor-react';
import { useUser } from "../../UserContext.jsx";
import FileUpload from './FileUpload.js';
import { useWindowDimensions } from '../../hooks/useResponsive';

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

const getTypeName = (file_url) => {
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


function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


const ChatInput = forwardRef(({ inputValue, setInputValue, setOpenPicker, 
    groupId, handleSendMessage}, ref) => {

  const [openAction, setOpenAction] = useState(false);
  const {userId, username, userRole, userIcon } = useUser();
  
  
  
  const handleUploadDocument = async () => {
    setOpenAction(prev => !prev);
  try {
    const input = document.createElement("input");
    input.type = "file";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      
      // Upload file lên server /upload
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(`${process.env.REACT_APP_API_URL}/upload`, {
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
  } catch (error) {
    console.error(error);
    alert("Upload document failed: " + error.message);
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
              handleSendMessage(inputValue);
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

const Footer = forwardRef(({ userId, username, groupId, setMessages }, ref) => {
  // const [showFileUpload, setShowFileUpload] = useState(false);
  const [openPicker, setOpenPicker] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const {width, height} = useWindowDimensions();

  useEffect(() => {
    socket.connect();
    console.log("WebSocket URL:", socket.io.engine.transport.url);
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

  const sendMessage = (message, file_url = '') => {
    if (socket.connected) {
      const timestamp = Date.now();
      const tempId = `temp-${timestamp}`;
      const date = new Date(timestamp);
      const formattedDate = date.toLocaleString();

      const data = {
        type: getTypeName(file_url),
        incoming: false,
        group_id: groupId,
        user_id: userId,
        username: username,
        text: message,
        file_url,
        link: '',
        message_id: tempId,
        time: formattedDate,
        status: 'sending'
      };
      setMessages(prev => [...prev, data]);
      socket.emit('admake/chat/message', data);
    } else {
      console.warn('Socket.IO not connected.');
    }

    setInputValue('');
  };

  // const handleSendMessage = (txt) => {
  //   if (!txt.trim()) return;
  //   sendMessage(txt, file_url = '');
  //   setInputValue('');
  // };

  return (
    <Box>
      {/* {showFileUpload && <FileUpload onUploadComplete={handleUploadComplete} />} */}
      <Box p={2} sx={{
        position: 'fixed',
        top: height - 100,
        width: width + 40,
        left: 0,
        scale: {xs:0.8, sm:1},
        backgroundColor: '#F8FAFF',
        boxShadow: '0px 0px 2px rgba(0,0,0,0.25)'
      }}>
        <Stack direction='row' alignItems='center' spacing={3}>
          <Stack sx={{ width: '100%' }}>
            <ChatInput
              // onEnterKey={() => sendMessage(inputValue)}
              ref={ref}
              inputValue={inputValue}
              setInputValue={setInputValue}
              setOpenPicker={setOpenPicker}
              groupId={groupId}
              handleSendMessage={sendMessage}
            />
          </Stack>
          <Box sx={{ height: 48, width: 48, backgroundColor: '#4da5fe', borderRadius: 1.5 }} 
            onClick={() => sendMessage(inputValue)}>
            <Stack sx={{ height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <IconButton><PaperPlaneTilt color='#fff' /></IconButton>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
});

export default Footer;
