import React from 'react'
import { Box, Grid, IconButton, Stack, Tab, Tabs, Typography } from '@mui/material';
import {useTheme } from "@mui/material/styles";
import { useDispatch } from 'react-redux';
import { UpdateSidebarType } from '../redux/slices/app';
import { CaretLeft, X } from 'phosphor-react';
import type { MessageTypeProps, MsgListTypeProps } from '../../../@types/chat.type';
import {DocMsg, LinkMsg} from './Conversation/MsgTypes'
import { useAppDispatch } from '../../../common/hooks/useAppDispatch';
import type { SyntheticEvent } from 'react';

const SHARED_DOCS: MessageTypeProps[] = [];
const SHARED_LINKS: MessageTypeProps[] = [];

const SharedMessages: React.FC<MsgListTypeProps> = ({ messages }) => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const [value, setValue] = React.useState(0);

    const handleChange = (event: SyntheticEvent<Element, Event>, newValue: number) => {
      setValue(newValue);
    };




  return (
    <Box sx={{width:320, height:'100vh'}}>
        <Stack sx={{height:'100%'}}>
        {/* Header */}
        <Box sx={{
          boxShadow: '0px 0px 2px rgba(0.25)',
          width: '100%',
          // backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background
        }}>
          <Stack sx={{height:'100%', p:2}} direction='row' alignItems='center' spacing={3}>
             <IconButton onClick={()=>{
              dispatch(UpdateSidebarType('CONTACT'));
            }}>
              <CaretLeft/>
            </IconButton>
            <Typography variant='subtitle2'>Shared Messages</Typography>
           
          </Stack>
        </Box>

        <Tabs sx={{px:2, pt:2}} value={value} onChange={handleChange} centered>
            <Tab label="Media" />
            <Tab label="Link" />
            <Tab label="Docs" />
        </Tabs>

        {/* Body */}
        <Stack className='scrollbar' sx={{height:'100%', position:'relative', flexGrow:1, overflowY:'scroll'}} p={3}
        spacing={value === 1 ? 1 :3}>
            {(()=>{
                switch (value) {
                    case 0:
                        //Images
                       <Grid container spacing={2}>
                        {[0,1,2,3,4,5,6].map((el) => (
                          <Grid key={el}>
                            <img src={'/images/avatar.png'} alt={''} />
                          </Grid>
                        ))}
                      </Grid>

                        
                    case 1:
                        return SHARED_LINKS.map((el)=> <LinkMsg el={el}/>)
                        
                    case 2:
                        return SHARED_DOCS.map((el)=> <DocMsg el={el}/>)
                        
                    default:
                        break;
                }
            })()}
        </Stack>
        </Stack>
    </Box>
  )
}

export default SharedMessages