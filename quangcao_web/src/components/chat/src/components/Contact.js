import { Avatar,ToggleButton, ToggleButtonGroup, Grid, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, IconButton, Slide, Stack, Typography} from '@mui/material'
import React, { useState, useEffect } from 'react';
import {useTheme } from "@mui/material/styles";
import { Bell, CaretRight, Phone, Prohibit, Star, Trash, VideoCamera, X } from 'phosphor-react';
import { useDispatch } from 'react-redux';
import { ToggleSidebar, UpdateSidebarType } from '../redux/slices/app';
import { faker } from '@faker-js/faker';
import AntSwitch from './AntSwitch';
import '../css/global.css';
import { useUser } from '../UserContext';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});


function RatingButtons({ userRole }) {
  const [value, setValue] = useState(null);

  const handleChange = (event, newValue) => {
    if (newValue !== null) {
      setValue(newValue);
    }
  };

  const toggleSize = { width: 80, height: 40, fontSize: 12, borderRadius: 30 };


  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleChange}
      aria-label="rating"
      size="small"
      sx={{ gap: 0, width: 300 }}
    >
      <ToggleButton value="not_pass" 
          sx={{ ...toggleSize,
            '&.Mui-selected': {
            backgroundColor: '#ff2a3cff', // Cam
            color: '#fff',
            '&:hover': {
              backgroundColor: '#ff2a3cff',
            },
          } }} aria-label="not pass">
        Không đạt
      </ToggleButton>
      <ToggleButton value="late"  sx={{ ...toggleSize,
            '&.Mui-selected': {
            backgroundColor: '#ffaf24ff', // Cam
            color: '#fff',
            '&:hover': {
              backgroundColor: '#ffaf24ff',
            },
          } }} aria-label="late">
        Chậm
      </ToggleButton>
      <ToggleButton value="normal"  sx={{ ...toggleSize,
            '&.Mui-selected': {
            backgroundColor: '#00ff04ff', // Cam
            color: '#fff',
            '&:hover': {
              backgroundColor: '#00ff04ff',
            },
          } }} aria-label="normal">
        Bình thường
      </ToggleButton>
      <ToggleButton value="quite"  sx={{ ...toggleSize,
            '&.Mui-selected': {
            backgroundColor: '#c77affff', // Cam
            color: '#fff',
            '&:hover': {
              backgroundColor: '#c77affff',
            },
          } }} aria-label="quite">
        Khá
      </ToggleButton>
      <ToggleButton value="good"  sx={{ ...toggleSize,
            '&.Mui-selected': {
            backgroundColor: '#00c3ffff', // Cam
            color: '#fff',
            '&:hover': {
              backgroundColor: '#00c3ffff',
            },
          } }} aria-label="good">
        Tốt
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

const BlockDialog = ({open, handleClose}) =>{
  return (
    <Dialog
    open={open}
    TransitionComponent={Transition}
    keepMounted
    onClose={handleClose}
    aria-describedby="alert-dialog-slide-description"
  >
    <DialogTitle>Block this contact</DialogTitle>
    <DialogContent>
      <DialogContentText id="alert-dialog-slide-description">
       Are you sure you want to block this contact?
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleClose}>Cancel</Button>
      <Button onClick={handleClose}>Yes</Button>
    </DialogActions>
  </Dialog>
  )
}

const DeleteDialog = ({open, handleClose}) =>{
  return (
    <Dialog
    open={open}
    TransitionComponent={Transition}
    keepMounted
    onClose={handleClose}
    aria-describedby="alert-dialog-slide-description"
  >
    <DialogTitle>Delete this chat</DialogTitle>
    <DialogContent>
      <DialogContentText id="alert-dialog-slide-description">
       Are you sure you want to delete this chat?
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleClose}>Cancel</Button>
      <Button onClick={handleClose}>Yes</Button>
    </DialogActions>
  </Dialog>
  )
}

const Contact = ({messages}) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [openBlock, setOpenBlock] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [photos, setPhotos] = useState([]);

  const {userId, username, userRole, userIcon } = useUser();

  useEffect(()=>{
    if(messages)
      setPhotos(messages.filter((el)=>el.type === 'img' || el.type === 'doc'));
  },[messages]);

  const handleCloseBlock = () =>{
    setOpenBlock(false);
  }

  const handleCloseDelete = () =>{
    setOpenDelete(false);
  }

  const [value, setValue] = useState(null);

  

  return (
    <Box sx={{width:600, height:'100vh'}}>
      <Stack sx={{height:'100%'}}>
        {/* Header */}
        <Box sx={{
          boxShadow: '0px 0px 2px rgba(0.25)',
          width: '100%',
          backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background
        }}>
          <Stack sx={{height:'100%', p:2}} direction='row' alignItems='center'
           justifyContent='space-between' spacing={3}>
            <Typography variant='subtitle2'>Informations</Typography>
            <IconButton onClick={()=>{
              dispatch(ToggleSidebar());
            }}>
              <X/>
            </IconButton>
          </Stack>
        </Box>

        <Typography ml={2}>Project Status</Typography>
          <Stack direction="row" sx={{ maxWidth:300 }}>
              {(userRole === 'lead' || userRole === 'owner') && <RatingButtons/>}
          </Stack>
        {/* Body */}
        <Stack className='scrollbar'  sx={{height:'100%', position:'relative', flexGrow:1, overflowY:'scroll'}} p={3}
        spacing={3}>
          {/* <Stack alignItems={'center'} direction='row' spacing={2}>
            <Avatar src={'/images/avatar.png'} alt={faker.name.firstName} sx={{height:64, width:64}}/>
            <Stack spacing={0.5}>
              <Typography variant='article' fontWeight={600}>
                {faker.name.fullName()}
              </Typography>
              <Typography variant='article' fontWeight={500}>
                {'+94 713725452'}
              </Typography>
            </Stack>
          </Stack>
          <Stack direction='row' alignItems='center' justifyContent='space-evenly'>
            <Stack spacing={1} alignItems='center' >
              <IconButton>
                <Phone/>
              </IconButton>
              <Typography variant='overline'>Voice</Typography>
            </Stack>
            <Stack spacing={1} alignItems='center' >
              <IconButton>
                <VideoCamera/>
              </IconButton>
              <Typography variant='overline'>Video</Typography>
            </Stack>
          </Stack>
          <Divider/>
          <Stack spacing={0.5}>
            <Typography variant='article'>About</Typography>
            <Typography variant='body2'>Hi I'm working</Typography>
          </Stack>
          <Divider/> */}
          <Stack direction='row' alignItems={'center'} justifyContent='space-between' >
            <Typography variant='subtitle2'>Documents</Typography>
            <Button onClick={()=>{
              dispatch(UpdateSidebarType('SHARED'))
            }} endIcon={<CaretRight/>}>{photos.length}</Button>
          </Stack>
          <Grid container spacing={2}>
            {photos.map((el, index) => (
              <Grid item xs={4} key={index}> {/* xs=4 nghĩa 12/4=3 cột */}
                <Box>
                  <img 
                    src={`${process.env.REACT_APP_API_URL}/static/${el.file_url}`} 
                    alt={el.file_url.split('_')[0]} 
                    style={{ width: "100%", height: "auto" }} 
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
          <Divider/>

          <Stack direction='row' alignItems={'center'} justifyContent='space-between'>
            <Stack direction='row' spacing={2} alignItems={'center'}>
              <Star size={21}/>
              <Typography variant='subtitle2'>Starred Messages</Typography>
            </Stack>
            <IconButton onClick={()=>{
              dispatch(UpdateSidebarType('STARRED'))
            }}><CaretRight/></IconButton>
          </Stack>

          <Divider/>
          
          <Stack direction='row' alignItems={'center'} justifyContent='space-between'>
            <Stack direction='row' spacing={2} alignItems={'center'}>
              <Bell size={21}/>
              <Typography variant='subtitle2'>Mute Notifications</Typography>
            </Stack>
            <AntSwitch/>
          </Stack>
          <Divider/>
          
        </Stack>
      </Stack>
      {openBlock && <BlockDialog open={openBlock} handleClose={handleCloseBlock}/>}
      {openDelete && <DeleteDialog open={openDelete} handleClose={handleCloseDelete}/>}
    </Box>
  )
}

export default Contact