import React, { useState, useRef} from 'react';
import { Button, Modal, IconButton, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { NotifyProps } from '../../../@types/notify.type';
import { useUser } from "../../hooks/useUser";
import { notification } from 'antd';

const NotifyModal = () => {
  const [open, setOpen] = useState(false);
  const { notifyList, notifyDelete, setNotifyList, getNotifyList, isMobile } = useUser();
  const [scale, setScale] = useState(1);

  const ref = useRef<HTMLLIElement | null>(null);

  const [scales, setScales] = useState<{ [id: string]: number }>({});

  const handleMouseMove = (e: React.MouseEvent<HTMLLIElement>, id: string) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
    const maxDistance = 200;
    const minScale = 1;
    const maxScale = 1.05;

    let newScale = maxScale - (distance / maxDistance) * (maxScale - minScale);
    if (newScale < minScale) newScale = minScale;

    setScales((prev) => ({ ...prev, [id]: newScale }));
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLLIElement>, id: string) => {
    e.currentTarget.style.backgroundColor = '';
    setScales((prev) => ({ ...prev, [id]: 1 }));
  };

  const handleDelete = (id: string) => {
    notifyDelete(id);

    if (notifyList.length === 1) setOpen(false);

    setNotifyList(prev => prev.filter(n => n.id !== id));
  };

  const handleOpen = () => {
    getNotifyList();
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const commonStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
    marginBottom: 8,
    padding: 10,
    paddingLeft: 40,
    paddingRight: 40,
    border: '1px solid #00B5B4',
    borderRadius: 30,
    fontSize: 12,
    transition: 'background-color 0.6s ease, transform 0.2s ease',
    cursor: 'pointer',
  };

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
          backgroundColor: 'white', padding: '20px', borderRadius: '8px', 
          width: isMobile ? '90vw':'60vw', maxHeight: '80vh', 
        }}>
          {notifyList.length === 0 && <p>Không có thông báo nào</p>}
          <Stack height='60vh' style ={{overflowX: 'hidden', overflowY: 'auto'}}>
          <ul>
            {notifyList.map((notify) => (
              <li
                key={notify.id}
                
                style={{
                  ...commonStyles,
                  backgroundColor: 'transparent',
                  transform: `scale(${scales[notify.id ?? ''] || 1})`,
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#76ffffff'}
                onMouseMove={(e) => handleMouseMove(e, notify.id ?? '')}
                onMouseLeave={(e) => handleMouseLeave(e, notify.id ?? '')}
              >
                <a href={notify.target}>
                  <span>{notify.text}</span> <span style={{ fontWeight: 700, color: '#00B5B4' }}>{notify.description}</span>
                </a>
                <IconButton aria-label="close" size="small" onClick={() => {
                  notification.success({message:"Xóa thông báo thành công !"});
                  handleDelete(notify.id ?? '');
                }}>
                  <CloseIcon fontSize="small" style={{ color: '#00B5B4' }} />
                </IconButton>
              </li>
            ))}
          </ul>
          </Stack>
          <Button onClick={handleClose} variant="contained" style={{ marginTop: 10, borderRadius: 20, backgroundColor: "#00B5B4" }}>
            OK
          </Button>
        </div>
      </Modal>
    </>
  );
};
export default NotifyModal;
