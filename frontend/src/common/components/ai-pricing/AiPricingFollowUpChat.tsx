import React, { useState } from "react";
import { Input } from "antd";
import {
  RobotOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  SendOutlined
} from "@ant-design/icons";

interface AiPricingFollowUpChatProps {
  chatMessages: Array<{ sender: "user" | "ai"; text: string }>;
  isChatSending: boolean;
  onSendMessage: (text: string) => void;
}

const CHAT_SUGGESTIONS = [
  "Khách muốn bớt giá thì giảm vào đâu?",
  "Nếu bỏ dàn giáo thì giá còn bao nhiêu?",
  "Đổi sang bạt 2 da xám thì tiết kiệm bao nhiêu?",
  "Bảng này có cần gia cố thêm chân chống không?",
  "Tính thêm thuế VAT 8% thì tổng bao nhiêu?",
];

export const AiPricingFollowUpChat: React.FC<AiPricingFollowUpChatProps> = ({
  chatMessages,
  isChatSending,
  onSendMessage
}) => {
  const [chatInput, setChatInput] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (!text || isChatSending) return;
    onSendMessage(text);
    setChatInput("");
  };

  const handleChipClick = (chip: string) => {
    onSendMessage(chip);
  };

  return (
    <>
      {/* Follow-up chat thread */}
      {chatMessages.length > 0 && (
        <div className="space-y-3 pt-2 bg-white rounded-2xl p-4 border border-slate-200">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <RobotOutlined className="text-cyan-600" />
            <span>Hội thoại trao đổi tiếp nối với AI:</span>
          </div>
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl text-xs max-w-[88%] leading-relaxed ${
                msg.sender === "user"
                  ? "ml-auto bg-slate-800 text-white rounded-tr-xs"
                  : "mr-auto bg-cyan-50/70 border border-cyan-200 text-slate-800 rounded-tl-xs shadow-2xs whitespace-pre-wrap"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {isChatSending && (
        <div className="flex items-center gap-2 text-xs text-cyan-700 font-semibold italic p-3 bg-cyan-50/50 rounded-xl border border-cyan-100">
          <SyncOutlined spin className="text-cyan-600" />
          <span>AI đang phân tích và soạn câu trả lời chuyên gia...</span>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200 space-y-2 mt-auto">
        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <ThunderboltOutlined className="text-amber-500" /> Gợi ý:
          </span>
          {CHAT_SUGGESTIONS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300 border border-slate-200 text-slate-600 transition-all cursor-pointer text-[11px]"
            >
              {chip}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            size="middle"
            placeholder="Hỏi tiếp AI: 'Nếu bớt 1 bộ dàn giáo thì giá ntn?', 'Khách muốn giảm 5%?'..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="rounded-xl !border-slate-200 text-xs"
            disabled={isChatSending}
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isChatSending}
            className="h-8 px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-200 text-white font-semibold text-xs transition-all flex items-center justify-center cursor-pointer border-none"
          >
            <SendOutlined />
          </button>
        </form>
      </div>
    </>
  );
};
