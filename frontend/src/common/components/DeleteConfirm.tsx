import React, { useState } from "react";
import { IconButton, Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Modal } from "antd";

interface DeleteConfirmProps {
  caption?: string;
  text?: string;
  elId?: string | number;
  onDelete: (id: string | number | undefined) => void;
}

const DeleteConfirm: React.FC<DeleteConfirmProps> = ({
  caption,
  text = "mục này",
  elId,
  onDelete,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      {caption ? (
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<DeleteIcon />}
          onClick={() => setShowConfirm(true)}
        >
          {caption}
        </Button>
      ) : (
        <IconButton
          onClick={() => setShowConfirm(true)}
          size="small"
          sx={{ color: "#ef4444" }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}

      <Modal
        title={`Bạn có chắc muốn xóa ${text}?`}
        open={showConfirm}
        onOk={() => {
          onDelete(elId);
          setShowConfirm(false);
        }}
        onCancel={() => setShowConfirm(false)}
        okText="Xóa"
        cancelText="Hủy"
      />
    </>
  );
};

export default DeleteConfirm;
