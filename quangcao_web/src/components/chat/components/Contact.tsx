import { Avatar,Tabs, Tab, ToggleButton, ToggleButtonGroup, Grid, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, IconButton, Slide, Stack, Typography} from '@mui/material'
import React, { useState, useEffect } from 'react';
import {useTheme } from "@mui/material/styles";
import '../css/global.css';
import { useApiStatic } from '../../../common/hooks/useApiHost';
import type { GroupProps, MessageTypeProps } from '../../../@types/chat.type';
import type { SlideProps } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import RatingButtons from './RatingButtons';

import QRCode from './QRCode';

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
  groupEl: GroupProps | null;
  messages: MessageTypeProps[];
  setShowFooter: React.Dispatch<React.SetStateAction<boolean>>;
}

const Contact: React.FC<ContactProps> = ( { groupEl, messages, setShowFooter }) => {
 
  const theme = useTheme();
  // const dispatch = useDispatch();

  const [openBlock, setOpenBlock] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [photos, setPhotos] = useState<MessageTypeProps[]>([]);
  const [groupId,setGroupId] = useState<number>(0);
  // const {userId, username, userRole, userIcon } = useUser();

  useEffect(()=>{
    if(messages && messages.length > 0)
    {
      setGroupId(messages[0].group_id);
      setPhotos(messages.filter((groupEl)=>groupEl.type === 'img' || groupEl.type === 'doc'));
    }
  },[messages, groupEl]);

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

  const tabStyle = {fontSize:10, padding: '4px 8px', minWidth: '5vw',  marginRight: 0.2,borderRadius:'5px', background:"#ccc" };
 
  return (
    <Box sx={{width:'20vw', p:1, ml:0, height:'80vh', boxSizing: 'border-box'}}>
        <Typography ml={0} fontWeight={300} fontSize={12}>Trạng thái dự án</Typography>
          <Stack direction="row" sx={{ maxWidth:300 }}>
              <RatingButtons groupEl={groupEl} setShowFooter={setShowFooter}/>
          </Stack>
        
        <Stack className='scrollbar' sx={{position:'relative', flexGrow:1}} p={1}
        spacing={3}>
          
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
            <Tab 
              icon={<StarIcon />} 
              iconPosition="start" 
              label="" 
              id="tab-1" 
              aria-controls="tabpanel-1" 
              sx={tabStyle}
            />
            
          </Tabs>
          {tabValue === 0 && (
            <Stack direction="column" spacing={0} sx={{width: '20vw', height:'68vh',overflowY:'auto', overflowX:'hidden'}}>
              <QRCode title="Mã QR cho khách hàng" filename='qrcode-admake-khachhang.png'
                url={`${window.location.origin}/chat/${groupEl?.version}/${groupEl?.id}`}/>
              <QRCode title="Mã QR cho nhân viên" filename='qrcode-admake-nhanvien.png'
                url={`${window.location.origin}/chat/${groupEl?.version}/a${groupEl?.id}`}/>
             </Stack>
            )}
           {tabValue === 1 && (
              <Box sx={{ p: 0.5,width: '20vw', height:'68vh', overflowY:'scroll' }}>
                {photos.length > 0 ? photos.map((groupEl, idx) => (
                  <img 
                    key={idx}
                    src={`${useApiStatic()}/${groupEl.file_url}`} 
                    alt={groupEl.file_url.split('_')[0]} 
                    style={{ width: '100%', height: 'auto', marginBottom: 8, cursor: 'pointer' }}
                    onClick={() => handlePhotoClick(groupEl.file_url)}
                  />
                )) : 
              <Typography variant="body1">Chưa có tài liệu</Typography>
              }
              </Box>
            )}
            {tabValue === 2 && (
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