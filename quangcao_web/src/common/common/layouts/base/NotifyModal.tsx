import React, { useState } from 'react';
import { Button, Modal, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { NotifyProps } from '../../../@types/notify.type';

const NotifyModal = ({ notifyList, notifyDelete }: { notifyList: NotifyProps[], notifyDelete: (id: string) => void }) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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
          backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto'
        }}>
          <h2 id="notification-modal-title">Thông báo</h2>
          {notifyList.length === 0 && <p>Không có thông báo nào</p>}
          <ul>
            {notifyList.map((notify) => (
              <li key={notify.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span>{notify.text}</span>
                <IconButton aria-label="close" size="small" onClick={() => notifyDelete(notify.id)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </li>
            ))}
          </ul>
          <Button onClick={handleClose} variant="contained" color="primary" style={{ marginTop: '10px' }}>
            Đóng
          </Button>
        </div>
      </Modal>
    </>
  );
};
