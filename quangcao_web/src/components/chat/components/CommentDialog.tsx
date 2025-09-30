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
// import DateInput from './DateInput';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function CommentDialog({open, setOpen, dialogTitle}) {
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
