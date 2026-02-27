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
  onDelete: (id: MessageTypeProps) => void;
}

const Conversation: React.FC<ConversationProps> = ({title,status,messages,setMessages, onDelete}) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  
  const {userRoleId, isMobile, chatBoxHeight, isFullChatUI} = useUser();
  // const [boxRect, setBoxRect] = useState({ left: 0, width: 0 });
  


  // const updateBoxRect = () => {
  //   if (boxRef.current) {
  //     const rect = boxRef.current.getBoundingClientRect();
  //     setBoxRect({ left: rect.left, width: rect.width });
  //   }
  // };


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
  

  // useEffect(() => {
  //   // Cập nhật khi component mount
  //   updateBoxRect();

  //   // Lắng nghe resize window cập nhật lại
  //   window.addEventListener('resize', updateBoxRect);

  //   // Cleanup khi component unmount
  //   return () => window.removeEventListener('resize', updateBoxRect);
  // }, []);

  let w = '85vw';

  return (
    <Stack sx={{ width: userRoleId === -2 ? ( isMobile ? '' : '50vw' ) : '100vw'}}>
        <Header title={title} status={status}/>
        
        <Box className='scrollbar'
          sx={{overflowY:'scroll', 
            minWidth: 320,
            minHeight:chatBoxHeight - 105, maxHeight:chatBoxHeight - 105,
            backgroundImage: "url(/backGround.png)"}}>
          <Message messages = {messages} menu={isFullChatUI} onDelete={onDelete}/>
        </Box>
        
        <Footer setMessages={setMessages}/>
    </Stack>
  )
}

export default Conversation


