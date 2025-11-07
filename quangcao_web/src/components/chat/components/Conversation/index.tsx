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
  userId: string;
  username: string;
  onDelete: (id: MessageTypeProps) => void;
}

const Conversation: React.FC<ConversationProps> = ({title,status,messages,setMessages, onDelete}) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  
  const {userId, userRoleId, isMobile} = useUser();
  const full = userRoleId === -2;

  let w = '85vw';

  if(full)
  {
    if(!isMobile)
      w = '50vw';
  }else{
    w = '100vw';
  }

  return (
    <Stack ref={boxRef} sx={{ width: w, height:full ? '72vh':'100vh',
        backgroundImage: "url(/backGround.png)"}}>
        <Header title={title} status={status}/>
        
        <Box className='scrollbar'
          // height={full ? '72vh':'100vh'}
          sx={{position:'relative', ml:0, overflowY:'scroll',}}>
          <Message messages = {messages} menu={true} onDelete={onDelete}/>
        </Box>
        
        <Footer setMessages={setMessages}/> 
    </Stack>
  )
}

export default Conversation


