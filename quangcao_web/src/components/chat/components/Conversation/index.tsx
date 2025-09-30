import {  Box, Stack} from '@mui/material';
import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from "@mui/material/styles";
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import { useWindowDimensions } from '../../hooks/useResponsive';
import type { MessageTypeProps } from '../../../../@types/chat.type';

interface ConversationProps {
  title: string;
  status: string;
  messages: MessageTypeProps[];
  setMessages: React.Dispatch<React.SetStateAction<MessageTypeProps[]>>;
  groupId: number;
  userId: string;
  username: string;
  onDelete: (id: MessageTypeProps) => void;
}



const Conversation: React.FC<ConversationProps> 
= ({title,status,messages,setMessages, groupId, userId,username, onDelete}) => {
  const theme = useTheme();
  const boxRef = useRef<HTMLDivElement | null>(null);

  // const [boxWidth, setBoxWidth] = useState<number>(window.innerWidth/2);
  // const {width,height} = useWindowDimensions();
  // // console.log('messages', messages);
  //  useEffect(() => {
  //   function updateWidth() {
  //     if (boxRef.current) {
  //       setBoxWidth(window.innerWidth/2);
  //     }
  //   }
  //   // updateWidth();
  //   window.addEventListener('resize', updateWidth);
  //   return () => window.removeEventListener('resize', updateWidth);
  // }, []);

  return (
    <Stack ref={boxRef} sx={{width:'50vw', background:"#ddd"}}>
        <Header title={title} status={status}/>
        
        <Box className='scrollbar' width='50vw'
          height='72vh' 
          sx={{position:'relative', ml:0, 
                overflowY:'scroll',
              }}>
          <Message messages = {messages} menu={true} onDelete={onDelete}/>
        </Box>

       <Footer setMessages={setMessages} groupId={groupId}/> 
    </Stack>
  )
}


export default Conversation