import {  Box, Stack} from '@mui/material';
import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from "@mui/material/styles";
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import { useUser } from '../../../../common/hooks/useUser';
import type { GroupProps, MessageTypeProps } from '../../../../@types/chat.type';

interface ConversationProps {
  title: string;
  status: string | null;
  messages: MessageTypeProps[];
  setMessages: React.Dispatch<React.SetStateAction<MessageTypeProps[]>>;
  showFooter: boolean;
  groupEl: GroupProps | null;
  userId: string;
  username: string;
  onDelete: (id: MessageTypeProps) => void;
  onGroupDelete: () => void;
}

const Conversation: React.FC<ConversationProps> 
= ({title,status,messages,setMessages, groupEl, onDelete, showFooter, onGroupDelete}) => {
  const theme = useTheme();
  const boxRef = useRef<HTMLDivElement | null>(null);
  
  const {userId, userRoleId} = useUser();
  const full = userRoleId > 0;

  useEffect(()=>{
    
  },[groupEl?.status]);

  return (
    <Stack ref={boxRef} sx={{ width: full ? '50vw' : '100vw', backgroundImage: "url(/backGround.png)"}}>
        <Header title={title} status={status} onGroupDelete={onGroupDelete}/>
        
        <Box className='scrollbar'
          height={full ? '70vh':'80vh'}
          sx={{position:'relative', ml:0, overflowY:'scroll',}}>
          <Message messages = {messages} menu={true} onDelete={onDelete}/>
        </Box>
        
        <Footer setMessages={setMessages} groupEl={groupEl}/> 
    </Stack>
  )
}


export default Conversation


