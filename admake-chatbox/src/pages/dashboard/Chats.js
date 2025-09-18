import { Box, IconButton, Stack, Typography, InputBase, Button, Divider, Avatar, Badge } from
  '@mui/material'
import { ArchiveBox, CircleDashed, MagnifyingGlass } from 'phosphor-react';
import {useTheme } from '@mui/material/styles';
import React from 'react';
import { faker } from '@faker-js/faker';
import {ChatList} from '../../data';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search';
import ChatElement, {WorkElement} from '../../components/ChatElement';
import infors from '../../json/works.json';
import useApiFlaskReceive from "../../api/ApiFlaskReceive";
import { useUser } from '../../UserContext';
import { useWindowDimensions} from '../../hooks/useResponsive';

const Chats = () => {
  const { userId, username } = useUser();
  const {width, height} = useWindowDimensions();

  const theme = useTheme();
  return (    
    <Box sx={{
      position: "relative", width: '90vw', 
      
      backgroundColor: theme.palette.mode === 'light'? "#F8FAFF" : theme.palette.background.paper,
      boxShadow: '0px 0px 2px rgba(0,0,0,0.25)'
    }}>
      <Stack p={{xs:0,sm:3}} spacing={2} sx={{scale: {xs: 0.8, sm: 1}}}>
        <Stack direction="row" alignItems='center' justifyContent='space-between'
          sx={{scale: {xs: 0.6, sm: 1}}}
        >
          <Typography variant='h5'>
            {username}
          </Typography>

          <Stack spacing={1}>
          <Stack direction='row' alignItems='center' spacing={1.5}>
            <ArchiveBox size={24} />
            <Button>
              Work Assignment
            </Button>
          </Stack>
          <Divider />
        </Stack>

          <IconButton>
            <CircleDashed />
          </IconButton>

          
        </Stack>

        <Stack sx={{ width: "100%"}}>
          <Search>
            <SearchIconWrapper>
              <MagnifyingGlass color="#709CE6" />
            </SearchIconWrapper>
            <StyledInputBase placeholder='Search...' inputProps={{ "aria-label": "search" }} />
          </Search>
        </Stack>
      </Stack>

      <Stack>
        <Stack className='scrollbar' spacing={2} direction='column' 
          sx={{alignItems:'flex-start', justifyContent:'flex-start', 
            flexGrow:1, width:width - 60, height:height - 100, overflow:'scroll'}}>

          <Stack spacing={2} sx={{
            transform: {xs: 'scale(0.8)', sm: ''},
            transformOrigin: 'top left'}}>

            {infors.map((el)=>{
              return <WorkElement {...el}/>
            })}
            
          </Stack>
          
        </Stack>
      </Stack>

    </Box>
  )
}

export default Chats