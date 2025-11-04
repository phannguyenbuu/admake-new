import {  Box, Stack} from '@mui/material';
import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from "@mui/material/styles";
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import { useUser } from '../../../../common/hooks/useUser';
import type { MessageTypeProps } from '../../../../@types/chat.type';
import type { WorkSpace } from '../../../../@types/work-space.type';

interface ConversationProps {
  title: string;
  status: string | null;
  messages: MessageTypeProps[];
  setMessages: React.Dispatch<React.SetStateAction<MessageTypeProps[]>>;
  groupEl: WorkSpace | null;
  userId: string;
  username: string;
  onDelete: (id: MessageTypeProps) => void;
}

const Conversation: React.FC<ConversationProps> = ({title,status,messages,setMessages, groupEl, onDelete}) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  
  const {userId, userRoleId, isMobile} = useUser();
  const full = userRoleId === -2;

  useEffect(()=>{
    
  },[groupEl?.status]);

  return (
    <Stack ref={boxRef} sx={{ width: full && !isMobile ? '50vw' : '85vw', height:'72vh',
        backgroundImage: "url(/backGround.png)"}}>
        <Header title={title} status={status}/>
        
        <Box className='scrollbar'
          height='72vh'
          sx={{position:'relative', ml:0, overflowY:'scroll',}}>
          <Message messages = {messages} menu={true} onDelete={onDelete}/>
        </Box>
        
        <Footer setMessages={setMessages} groupEl={groupEl}/> 
    </Stack>
  )
}

export default Conversation


