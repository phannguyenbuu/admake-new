import React, { useState } from "react";
import { Modal, Segmented } from "antd";
import { ColumnWidthOutlined, CommentOutlined } from "@ant-design/icons";
import { AIPricingSplitView } from "./AIPricingSplitView";
import { AIPricingChat } from "./AIPricingChat";

interface AIAssistantModalProps {
  open: boolean;
  onCancel: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ open, onCancel }) => {
  const [activeView, setActiveView] = useState<"split" | "chat">("split");

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={activeView === "split" ? "95vw" : 1000}
      centered
      destroyOnClose
      styles={{
        body: { padding: 0, height: "86vh", display: "flex", flexDirection: "column" },
        content: { padding: 0, borderRadius: "20px", overflow: "hidden" },
      }}
      title={
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-800">
              TRỢ LÝ AI BÓC TÁCH & BÁO GIÁ BẢNG HIỆU ADMAKE
            </span>
          </div>
          <div className="mr-8">
            <Segmented
              value={activeView}
              onChange={(val) => setActiveView(val as "split" | "chat")}
              options={[
                {
                  label: "◫ Chia đôi màn hình",
                  value: "split",
                  icon: <ColumnWidthOutlined />,
                },
                {
                  label: "💬 Hội thoại Chat AI",
                  value: "chat",
                  icon: <CommentOutlined />,
                },
              ]}
              size="small"
              className="!bg-slate-200/80 !font-semibold !text-xs"
            />
          </div>
        </div>
      }
    >
      <div className="flex-1 overflow-hidden p-2 md:p-3 bg-slate-100">
        {activeView === "split" ? <AIPricingSplitView /> : <AIPricingChat />}
      </div>
    </Modal>
  );
};
