import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import { Signboard3DStudio } from "../ai-pricing/Signboard3DStudio";

interface AiStudioModalProps {
  open: boolean;
  onCancel: () => void;
}

// Modal nằm trên FooterMenuBar (10001); toast/tooltip/dropdown của antd được nâng lên trên modal.
const MODAL_Z = 10050;

const MODAL_CSS = `
  .ai-studio-full-modal { z-index: ${MODAL_Z} !important; }
  .ai-studio-full-modal .ant-modal-mask { z-index: ${MODAL_Z} !important; }
  .ai-studio-full-modal-wrap { z-index: ${MODAL_Z + 1} !important; }
  .ai-studio-full-modal .ant-modal { z-index: ${MODAL_Z + 2} !important; }
`;

const OVERLAY_CSS = `
  .ant-message, .ant-notification { z-index: ${MODAL_Z + 50} !important; }
  .ant-tooltip, .ant-popover, .ant-dropdown, .ant-select-dropdown,
  .ant-picker-dropdown, .ant-image-preview-root .ant-image-preview-mask,
  .ant-image-preview-root .ant-image-preview-wrap { z-index: ${MODAL_Z + 40} !important; }
`;

export const AiStudioModal: React.FC<AiStudioModalProps> = ({ open, onCancel }) => {
  // Chỉ mount Studio (Three.js, polling...) sau lần mở đầu tiên.
  const [hasOpened, setHasOpened] = useState(open);
  useEffect(() => {
    if (open) setHasOpened(true);
  }, [open]);

  if (!hasOpened) return null;

  return (
    <>
      <style>{MODAL_CSS}</style>
      {open && <style>{OVERLAY_CSS}</style>}
      <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        width="96vw"
        centered
        zIndex={MODAL_Z}
        getContainer={() => document.body}
        rootClassName="ai-studio-full-modal"
        wrapClassName="ai-studio-full-modal-wrap"
        style={{
          maxWidth: "1680px",
          paddingBottom: 0,
        }}
        styles={{
          content: {
            backgroundColor: "#f1f5f9",
            border: "1px solid #cbd5e1",
            borderRadius: "20px",
            padding: 0,
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            height: "94vh",
            maxHeight: "94vh",
          },
          body: {
            padding: 0,
            height: "100%",
            maxHeight: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#f1f5f9",
            overflow: "hidden",
          },
        }}
        title={null}
        closable={false}
        destroyOnClose={false}
      >
        <div className="w-full h-full p-0 m-0 overflow-hidden flex flex-col bg-slate-100">
          <Signboard3DStudio onClose={onCancel} open={open} />
        </div>
      </Modal>
    </>
  );
};
