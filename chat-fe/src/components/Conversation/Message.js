import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, {useRef, useEffect} from 'react';
import { DocMsg, LinkMsg, MediaMsg, ReplyMsg, TextMsg, TimeLine } from './MsgTypes';


const Message = ({userId, menu, messages, onDelete}) => {
  const theme = useTheme();
  const bottomRef = useRef(null);

 useEffect(() => {
  // console.log('NEWMES',messages);

  if (bottomRef.current) {
    setTimeout(() => {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end'  });
    }, 100);  // trì hoãn 100ms, điều chỉnh tuỳ ý
  }
}, [messages]);
  
  return (
    <Box p={3} ref={bottomRef}>
        <Stack spacing={3}>
            {messages && messages.map((el, index)=>
            { 
                switch (el.type) {
                    case 'divider':
                      return <TimeLine el={el}/>
                    
                    case 'img':
                      return <MediaMsg el={el} menu={menu}  key={`MediaMsg-${el.id}`} onDelete={onDelete}/>
                    case 'doc':
                        return <DocMsg el={el} menu={menu}  key={`DocMsg-${el.id}`} onDelete={onDelete}/>
                    case 'link':
                        return <LinkMsg el={el} menu={menu}  key={`LinkMsg-${el.id}`} onDelete={onDelete}/>
                    case 'reply':
                        return <ReplyMsg el={el} menu={menu}  key={`ReplyMsg-${el.id}`} onDelete={onDelete}/>
                        
                    default:
                      return <TextMsg el={el} menu={menu}  key={`DefaultMsg-${el.message_id}`} onDelete={onDelete}/>
                }
            })}
        </Stack>
    </Box>
  )
}

export default Message