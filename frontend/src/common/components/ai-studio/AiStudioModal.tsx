import React from "react";
import { Modal } from "antd";
import { Signboard3DStudio } from "../ai-pricing/Signboard3DStudio";

interface AiStudioModalProps {
  open: boolean;
  onCancel: () => void;
}

export const AiStudioModal: React.FC<AiStudioModalProps> = ({ open, onCancel }) => {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width="96vw"
      style={{ top: "2.5vh", maxWidth: "1680px", paddingBottom: 0 }}
      styles={{
        content: {
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "24px",
          padding: 0,
          overflow: "hidden",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        },
        body: {
          padding: 0,
          height: "94vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f8fafc",
        },
      }}
      title={null}
      closable={false}
      destroyOnClose={false}
    >
      <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-slate-50">
        <Signboard3DStudio onClose={onCancel} />
      </div>
    </Modal>
  );
};
