import { Avatar,Tabs, Tab, ToggleButton, ToggleButtonGroup, Grid, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, IconButton, Slide, Stack, Typography} from '@mui/material'
import React, { useState, useEffect } from 'react';
import {useTheme } from "@mui/material/styles";
import { Bell, CaretRight, Phone, Prohibit, Star, Trash, VideoCamera, X } from 'phosphor-react';
import { useDispatch } from 'react-redux';
import { ToggleSidebar, UpdateSidebarType } from '../redux/slices/app';
import AntSwitch from './AntSwitch';
import '../css/global.css';
import { useUser } from '../UserContext';
import { useApiStatic } from '../../../common/hooks/useApiHost';
import type { MessageTypeProps } from '../../../@types/chat.type';
import type { SlideProps } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import StarIcon from '@mui/icons-material/Star';

const Transition = React.forwardRef(function Transition(
  props: SlideProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});


function RatingButtons() {
  const [value, setValue] = React.useState<string | null>(null);

  const handleChange = (event: React.MouseEvent<HTMLElement>, 
    newValue: string | null) => {
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
        TẠO QR
      </ToggleButton>
      <ToggleButton value="late"  sx={{ ...toggleSize,
            '&.Mui-selected': {
            backgroundColor: '#ffaf24ff', // Cam
            color: '#fff',
            '&:hover': {
              backgroundColor: '#ffaf24ff',
            },
          } }} aria-label="late">
        TIẾP XÚC
      </ToggleButton>
      <ToggleButton value="normal"  sx={{ ...toggleSize,
            '&.Mui-selected': {
            backgroundColor: '#b7ff00ff', // Cam
            color: '#333',
            '&:hover': {
              backgroundColor: '#00ff04ff',
            },
          } }} aria-label="normal">
        HỢP ĐỒNG
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

interface BlockDialogProps {
  open: boolean;
  handleClose: () => void;
}


const BlockDialog: React.FC<BlockDialogProps> = ({ open, handleClose }) => {
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
  );
};

const DeleteDialog: React.FC<BlockDialogProps> = ({ open, handleClose }) => {
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

interface ContactProps {
  messages: MessageTypeProps[];
}

const Contact: React.FC<ContactProps> = ({ messages }) => {
 
  const theme = useTheme();
  // const dispatch = useDispatch();

  const [openBlock, setOpenBlock] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [photos, setPhotos] = useState<MessageTypeProps[]>([]);

  // const {userId, username, userRole, userIcon } = useUser();

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

  const [tabValue, setTabValue] = useState<number>(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const [activeFileUrl, setActiveFileUrl] = useState<string | null>(null);
  const handlePhotoClick = (fileUrl: string) => {
    // Chuyển sang tab "Tin nhắn lưu"
    // setValue(1);
    setActiveFileUrl(fileUrl);
    // Mở file bằng trình duyệt mặc định (mở tab mới)
    window.open(`${useApiStatic()}/${fileUrl}`, '_blank');
  }
 
  return (
    <Box sx={{width:'20vw', p:1, ml:0, height:'80vh', boxSizing: 'border-box'}}>
        <Typography ml={0} fontWeight={300} fontSize={12}>Trạng thái dự án</Typography>
          <Stack direction="row" sx={{ maxWidth:300 }}>
              <RatingButtons/>
          </Stack>
        
        <Stack className='scrollbar' sx={{position:'relative', flexGrow:1}} p={1}
        spacing={3}>
          
          <Tabs value={tabValue} onChange={handleChange} aria-label="nav tabs">
            <Tab 
              icon={<NotificationsIcon />} 
              iconPosition="start" 
              label="Tài liệu" 
              id="tab-0" 
              aria-controls="tabpanel-0" 
              sx={{fontSize:10, padding:0}}
            />
            <Tab 
              icon={<StarIcon />} 
              iconPosition="start" 
              label="Tin lưu" 
              id="tab-1" 
              aria-controls="tabpanel-1" 
              sx={{fontSize:10, padding:0}}
            />
          </Tabs>
           {tabValue === 0 && (
              <Box sx={{ p: 0.5, height:'60vh', overflowY:'scroll' }}>
                {photos.map((el, idx) => (
                  <img 
                    key={idx}
                    src={`${useApiStatic()}/${el.file_url}`} 
                    alt={el.file_url.split('_')[0]} 
                    style={{ width: '100%', height: 'auto', marginBottom: 8, cursor: 'pointer' }}
                    onClick={() => handlePhotoClick(el.file_url)}
                  />
                ))}
              </Box>
            )}
            {tabValue === 1 && (
              <Box sx={{ p: 0.5, height:'60vh', overflowY:'scroll' }}>
                <Typography variant="body1">Chưa có tin nhắn lưu</Typography>
                {/* Hiển thị danh sách message hoặc nội dung khác */}
              </Box>
            )}
          <Divider/>
          
        </Stack>
      
      {openBlock && <BlockDialog open={openBlock} handleClose={handleCloseBlock}/>}
      {openDelete && <DeleteDialog open={openDelete} handleClose={handleCloseDelete}/>}
    </Box>
  )
}

export default Contact