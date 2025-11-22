import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, {useRef, useEffect} from 'react';
import { DocMsg, LinkMsg, MediaMsg, ReplyMsg, TextMsg, TimeLine } from './MsgTypes';
import type { MsgTypeProps, MsgListTypeProps } from '../../../../@types/chat.type';

export const getTypeName = (file_url:string) => {
  let type = 'msg';
  if(file_url !== '') {
    type = 'doc';
    const ext = file_url.toLowerCase();

    if(file_url.startsWith('http') || file_url.startsWith('www')) {
      type = 'link';
    } else if(['.jpg', '.jpeg', '.png', '.gif', '.webp','.jfif'].some(s => ext.includes(s))) {
      type = 'img';
    }
  }
  return type;
}

const Message: React.FC<MsgListTypeProps> = ({ menu, messages, onDelete }) => {
  const theme = useTheme();
  const bottomRef = useRef<HTMLDivElement | null>(null);

 useEffect(() => {
  if (bottomRef.current) {
    setTimeout(() => {
      const el = bottomRef.current!;
      el.parentElement!.scrollTop = el.parentElement!.scrollHeight;
    }, 200);
  }

}, [messages]);



  
  return (
    <Box p={3} ref={bottomRef}>
        <Stack spacing={1}>
            {messages && messages.map((el)=>
            { 
              let type =  el.file_url && el.file_url !== '' ? getTypeName(el.file_url) : el.type;

              switch (type) {
                  case 'timeline':
                    return <TimeLine el={el} menu={menu}  key={`TimeLineMsg-${el.message_id}`} onDelete={onDelete}/>
                  case 'img':
                    return <MediaMsg el={el} menu={menu}  key={`MediaMsg-${el.message_id}`} onDelete={onDelete}/>
                  case 'doc':
                      return <DocMsg el={el} menu={menu}  key={`DocMsg-${el.message_id}`} onDelete={onDelete}/>
                  case 'link':
                      return <LinkMsg el={el} menu={menu}  key={`LinkMsg-${el.message_id}`} onDelete={onDelete}/>
                  case 'reply':
                      return <ReplyMsg el={el} menu={menu}  key={`ReplyMsg-${el.message_id}`} onDelete={onDelete}/>
                  default:
                    return <TextMsg el={el} menu={menu}  key={`DefaultMsg-${el.message_id}`} onDelete={onDelete}/>
              }
            })}
        </Stack>
    </Box>
  )
}

export default Message