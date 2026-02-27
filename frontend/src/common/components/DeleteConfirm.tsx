
import React, {useState} from "react";
import type { MessageTypeProps } from "../@types/chat.type";
import { IconButton, Button } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { Modal } from "antd";

interface DeleteAssetButtonProps {
  caption?: string;
  text?: string;
  elId?: string | number;
  onDelete: (id: string | number | undefined) => void;
}

const DeleteConfirm: React.FC<DeleteAssetButtonProps> = ({ caption, text, elId, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  return (
      <>
        
       {caption ? (
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<DeleteIcon />}
          onClick={() => setShowConfirm(true)}
          sx={{ mt: 1 }}
        >
          Xóa nghỉ phép
        </Button>
      ) : (
        <IconButton
          onClick={() => setShowConfirm(true)}
          sx={{ mt: 1 }}
        >
          <DeleteIcon />  {/* ✅ Icon TRONG IconButton */}
        </IconButton>
      )}


        
        <Modal
          title={`Bạn có chắc muốn xóa ${text}?`}
          open={showConfirm}
          onOk = {() => {
            onDelete(elId);
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
          >
        </Modal>
      </>
    );
}

export default DeleteConfirm;
