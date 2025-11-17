
import React, {useState} from "react";
import type { MessageTypeProps } from "../@types/chat.type";
import { IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { Modal } from "antd";

interface DeleteAssetButtonProps {
  text?: string;
  el: MessageTypeProps;
  onDelete: (id: string) => void;
}

const DeleteConfirm: React.FC<DeleteAssetButtonProps> = ({ text, el, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  return (
      <>
        <IconButton
          key = {`delete-${el.message_id}`}
          size="small"
          aria-label="delete"
          color="error"
          onClick={() => setShowConfirm(true)}
          sx={{
            color: '#777',
            top: -10,
            '&:hover': {
              color: 'red',
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
        
        <Modal
          title={`Bạn có chắc muốn xóa ${text}?`}
          open={showConfirm}
          onOk = {() => {
            onDelete(el?.message_id);
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
          >
        </Modal>
      </>
    );
}

export default DeleteConfirm;
