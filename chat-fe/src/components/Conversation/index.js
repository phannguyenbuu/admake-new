import {  Box, Stack} from '@mui/material';
import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from "@mui/material/styles";
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import { useWindowDimensions } from '../../hooks/useResponsive';

const Conversation = ({title,status,messages,setMessages, groupId,userId,username, onDelete}) => {
  const theme = useTheme();
  const boxRef = useRef(null);
  const [boxWidth, setBoxWidth] = useState('100%');
  const {width,height} = useWindowDimensions();
  // console.log('messages', messages);
   useEffect(() => {
    function updateWidth() {
      if (boxRef.current) {
        setBoxWidth(boxRef.current.offsetWidth);
      }
    }
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <Stack ref={boxRef} minHeight={'80vh'}>
        {/* Chat header */}
        <Header title={title} status={status}/>
        {/* Msg */}
        <Box className='scrollbar' width={width}
          height={height - 50} 
          sx={{position:'relative', flexGrow:1,ml:0, 
                overflowY:'scroll',
                        transform: {xs: 'scale(0.8)', sm: ''},
                        transformOrigin: 'top left'
            
              }}>
          <Message messages = {messages} menu={true} userId={userId} onDelete={onDelete}/>
        </Box>
        {/* Chat footer */}
       <Footer setMessages={setMessages} width={boxWidth} groupId={groupId} 
          userId={userId} username={username}/>
    </Stack>
  )
}


export default Conversation