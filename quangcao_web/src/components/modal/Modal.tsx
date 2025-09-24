import React from "react";
import { Modal, type ModalProps } from "antd";
import "./css.css";

const ModalComponent: React.FC<ModalProps> = ({ children, open, onCancel }) => {
  return (
    <>
      <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        centered
        className="form-material-modal"
      >
        {children}
      </Modal>
    </>
  );
};

export default ModalComponent;
