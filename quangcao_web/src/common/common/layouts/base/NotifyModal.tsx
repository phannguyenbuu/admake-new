import React, { useState, useEffect } from 'react';
import { Button, Modal, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { NotifyProps } from '../../../@types/notify.type';
import { useUser } from "../../hooks/useUser";

const NotifyModal = () => {
  const [open, setOpen] = useState(false);
  const {notifyList, notifyDelete, setNotifyList} = useUser();


  const handleDelete = (id: string) => {
    // Gọi hàm xóa backend
    notifyDelete(id);

    if(notifyList.length === 1)
      setOpen(false);

    setNotifyList(prev => prev.filter(n => n.id !== id));
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  console.log('NotifyList', notifyList);

  return (
    <>
      <Button style={{ background: 'none', border: 'none' }} onClick={handleOpen}>
        <span className="text-white font-semibold text-sm px-3 py-1.5 bg-red-600 rounded-full">
          {notifyList.length}
        </span>
      </Button>

      <Modal open={open} onClose={handleClose} aria-labelledby="notification-modal-title" aria-describedby="notification-modal-description">
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '60vw', maxHeight: '80vh', overflowY: 'auto'
        }}>

          {notifyList.length === 0 && <p>Không có thông báo nào</p>}
          <ul>
            {notifyList.map((notify) => (
              <li key={notify.id} 
                style={{ display: 'flex', justifyContent: 'space-between', gap:10,
                  alignItems: 'center', marginBottom: 8,
                  padding: 10, paddingLeft:40, paddingRight: 40,
                   border: '1px solid #333', borderRadius: 30,
                   }}>
                <a href={notify.target}>
                  <span>{notify.text}</span>
                </a>
                  <IconButton aria-label="close" size="small" onClick={() => handleDelete(notify.id)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                
              </li>
            ))}
          </ul>
          <Button onClick={handleClose} variant="contained" style={{ marginTop: '10px', backgroundColor: "#00B5B4" }}>
            Đóng
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default NotifyModal;
