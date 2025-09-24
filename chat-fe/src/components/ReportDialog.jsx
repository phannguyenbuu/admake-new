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
  MenuItem
} from '@mui/material';

function ReportDialog({open, setOpen, data, dialogTitle}) {
  const [comment, setComment] = useState('');
  const [receiver, setReceiver] = useState('');

  const handleClose = () => {
    setOpen(false);
  };

  const handleSend = () => {
    // Xử lý gửi comment đến ai đó với dữ liệu comment và receiver
    console.log('Gửi comment:', comment, 'cho:', receiver);
    setOpen(false); // đóng dialog sau khi gửi
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          
          <img src='/images/avatar.jpg' sx={{width:600,height:450}}/>
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

export default ReportDialog;
