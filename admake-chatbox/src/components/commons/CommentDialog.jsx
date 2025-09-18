import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography
} from '@mui/material';
import { StyledButton } from './TitlePanel';

function CommentDialog({open, setOpen, dialogTitle}) {
  const [comment, setComment] = useState('');
  const [receiver, setReceiver] = useState('');

  const handleClose = () => {
    setOpen(false);
  };

  const handleSend = () => {
    
    console.log('Gửi comment:', comment, 'cho:', receiver);
    setOpen(false); 
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <TextField
                autoFocus
                margin="dense"
                label="Comment"
                type="text"
                fullWidth
                variant="outlined"
                value={comment}
                multiline
                rows={10}  // số dòng hiển thị
                sx={{ width: 550, height: 400 }}
                onChange={(e) => setComment(e.target.value)}
            />

          <FormControl fullWidth margin="dense">
            {/* <DateInput/> */}
            <Select
              labelId="receiver-label"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              label="Gửi cho ai"
            >
              <MenuItem value="customer">Client</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="support">Tech helper</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSend} variant="contained">Send</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default CommentDialog;

export function PictureDialog({open, setOpen, imageUrl='/images/avatar.jpg', dialogTitle}) {
  const [comment, setComment] = useState('');
  const [receiver, setReceiver] = useState('');

  const handleClose = () => {
    setOpen(false);
  };

  const handleSend = () => {
    
    console.log('Gửi comment:', comment, 'cho:', receiver);
    setOpen(false); 
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          
          <img src={imageUrl} sx={{width:600,height:450}}/>
          <FormControl fullWidth margin="dense">
            {/* <DateInput/> */}
            <Select
              labelId="receiver-label"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              label="Gửi cho ai"
            >
              <MenuItem value="customer">On time</MenuItem>
              <MenuItem value="manager">Late</MenuItem>
              <MenuItem value="support">Too late</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSend} variant="contained">Send</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}


export function ConfirmDialog({open, setOpen, ...props}) {
  const [comment, setComment] = useState('');
  const [receiver, setReceiver] = useState('');

  const handleClose = () => {
    setOpen(false);
  };

  const handleSend = () => {
    console.log('Gửi comment:', comment, 'cho:', receiver);
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} 
          sx={{
          '& .MuiPaper-root': {
            width: 300,
            height: 500,
            color:"#fff",
            backgroundImage: 'url("images/panelBK_001.svg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(255,255,255,0.5)',
            p: 5,
            borderRadius: 5,
            overflow:'visible',
            display: 'flex', 
            justifyContent: "flex-start"
          },
        }}>
      {props.img && <img src={props.img} style={{position:'absolute',
        width:400, height:'auto',left:100,top:-50
      }}/>}
        <DialogTitle>{props.title}</DialogTitle>
        <DialogContent>
          <Typography>
            {props.content}
          </Typography>
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
          <DialogActions sx={{ p: 0 }}>
            <StyledButton onClick={handleSend} variant="contained" title="OK"/>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
