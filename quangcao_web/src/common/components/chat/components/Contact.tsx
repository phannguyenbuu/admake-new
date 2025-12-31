import { Avatar,Tabs, Tab, ToggleButton, ToggleButtonGroup, Grid, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, IconButton, Slide, Stack, Typography} from '@mui/material'
import React, { useState, useEffect } from 'react';
import {useTheme } from "@mui/material/styles";
import '../css/global.css';
import { useApiStatic } from '../../../common/hooks/useApiHost';
import type { MessageTypeProps } from '../../../@types/chat.type';
import type { SlideProps } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import RatingButtons from './RatingButtons';
import { useUser } from '../../../common/hooks/useUser';
import QRCode from './QRCode';
import type { WorkSpace } from '../../../@types/work-space.type';
import { useChatGroup } from '../ProviderChat';

const Transition = React.forwardRef(function Transition(
  props: SlideProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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

const Contact: React.FC<ContactProps> = ( { messages }) => {
  const {workspaceEl} = useChatGroup();
  const [openBlock, setOpenBlock] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [photos, setPhotos] = useState<MessageTypeProps[]>([]);
  const {isMobile, chatBoxHeight } = useUser();

  useEffect(()=>{
    if(messages && messages.length > 0)
    {
      setPhotos(messages.filter((workspaceEl)=>workspaceEl.type === 'img' 
                || workspaceEl.type === 'doc'));
    }
  },[messages, workspaceEl]);

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
    setActiveFileUrl(fileUrl);
    window.open(`${useApiStatic()}/${fileUrl}`, '_blank');
  }

  const tabStyle = {fontSize:12, minWidth: 120};
   
  return (
    <Box sx={{width: isMobile ? '80vw' :'30vw', p:1,
      minHeight:chatBoxHeight, maxHeight:chatBoxHeight, 
      boxSizing: 'border-box'}}>
        <Stack className='scrollbar' sx={{position:'relative', flexGrow:1}} p={1} spacing={3}>
          <Tabs value={tabValue} onChange={handleChange} aria-label="nav tabs">
            <Tab 
              iconPosition="start" 
              label="QR"
              id="tab-0" 
              aria-controls="tabpanel-0" 
              sx={tabStyle}
            />
            <Tab 
              iconPosition="start" 
              label="Tài liệu" 
              id="tab-0" 
              aria-controls="tabpanel-0" 
              sx={tabStyle}
            />
          </Tabs>
          {tabValue === 0 && (
            <Stack direction="column" spacing={0} 
              sx={{width: '100%', overflowY:'auto', overflowX:'hidden'}}>
              <QRCode title="Mã QR cho khách hàng" filename='qrcode-admake-khachhang.png'
                url={`${window.location.origin}/chat/${workspaceEl?.id}`}/>
              <QRCode title="Mã QR cho nhân viên" filename='qrcode-admake-nhanvien.png'
                url={`${window.location.origin}/chat/a${workspaceEl?.id}`}/>
             </Stack>
            )}
           {tabValue === 1 && (
              <Box sx={{ p: 0.5,width: '100%', overflowY:'scroll', }}>
                {photos.length > 0 ? photos.map((workspaceEl, idx) => (
                  <img 
                    key={idx}
                    src={`${useApiStatic()}/${workspaceEl.file_url}`} 
                    alt={workspaceEl?.file_url?.split('_')[0]} 
                    style={{ width: '100%', height: 'auto', marginBottom: 8, cursor: 'pointer' }}
                    onClick={() => handlePhotoClick(workspaceEl?.file_url ?? '')}
                  />
                )) : 
              <Typography variant="body1">Chưa có tài liệu</Typography>
              }
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