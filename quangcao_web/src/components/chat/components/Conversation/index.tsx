import {  Box, Stack} from '@mui/material';
import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from "@mui/material/styles";
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import { useUser } from '../../../../common/hooks/useUser';
import type { MessageTypeProps } from '../../../../@types/chat.type';
import type { WorkSpace } from '../../../../@types/work-space.type';
import { socket } from './socket';

interface ConversationProps {
  title: string;
  status: string | null;
  messages: MessageTypeProps[];
  setMessages: React.Dispatch<React.SetStateAction<MessageTypeProps[]>>;
  userId: string;
  username: string;
  onDelete: (id: MessageTypeProps) => void;
}

const Conversation: React.FC<ConversationProps> = ({title,status,messages,setMessages, onDelete}) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  
  const {userId, userRoleId, isMobile} = useUser();
  const full = userRoleId === -2;
  const [boxRect, setBoxRect] = useState({ left: 0, width: 0 });

  // const [left, setLeft] = useState(0);
  // const [width, setWidth] = useState(0);

  const updateBoxRect = () => {
    if (boxRef.current) {
      const rect = boxRef.current.getBoundingClientRect();
      setBoxRect({ left: rect.left, width: rect.width });
    }
  };


  useEffect(() => {
    console.log('Start_Socket', socket);
    if (!socket) return;

    const handleDelete = (data: { message_id: string, workspace_id: string }) => {
      setMessages(prev => prev.filter(msg => msg.message_id !== data.message_id));
    };


    socket.on('admake/chat/delete', handleDelete);

    // Cleanup khi component unmount
    return () => {
      socket.off('admake/chat/delete', handleDelete);
    };
  }, [socket,  setMessages]);
  

  useEffect(() => {
    // Cập nhật khi component mount
    updateBoxRect();

    // Lắng nghe resize window cập nhật lại
    window.addEventListener('resize', updateBoxRect);

    // Cleanup khi component unmount
    return () => window.removeEventListener('resize', updateBoxRect);
  }, []);

  let w = '85vw';

  if(full)
  {
    if(!isMobile)
      w = '50vw';
  }else{
    w = '100vw';
  }

  return (
    <Stack ref={boxRef} sx={{ width: w, height:full ? '72vh':'92vh',
        backgroundImage: "url(/backGround.png)"}}>
        <Header title={title} status={status}/>
        
        <Box className='scrollbar'
          // height={full ? '72vh':'100vh'}
          sx={{position:'relative', ml:0, overflowY:'scroll',}}>
          <Message messages = {messages} menu={full} onDelete={onDelete}/>
        </Box>
        
        <Footer setMessages={setMessages} left = {boxRect.left} width={boxRect.width}/>
    </Stack>
  )
}

export default Conversation


