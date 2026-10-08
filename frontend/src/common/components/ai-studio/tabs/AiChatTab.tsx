import React, { useState, useRef, useEffect } from "react";
import { Input, Tooltip, message, Spin } from "antd";
import {
  SendOutlined,
  CopyOutlined,
  DeleteOutlined,
  RobotOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Sparkles } from "lucide-react";
import type { AiEngine, ChatMessage } from "../types";

const { TextArea } = Input;

interface AiChatTabProps {
  apiHost: string;
  hasGeminiKey: boolean;
  hasGptKey: boolean;
  onUseAsPrompt: (promptText: string) => void;
}

const DEFAULT_WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Xin chào! Tôi là Trợ Lý Chuyên Gia AI Studio của ADMAKE. Tôi có thể hỗ trợ bạn:\n\n" +
    "• Tư vấn quy cách kỹ thuật, vật tư in ấn, bảng hiệu quảng cáo (Alu, Mica, Bạt 3M, LED).\n" +
    "• Lên ý tưởng thiết kế, phối màu và soạn Prompt chi tiết để tạo thiết kế 4K.\n" +
    "• Giải đáp mọi thắc mắc kỹ thuật ngành in và marketing thương hiệu.\n\n" +
    "Bạn muốn tìm hiểu hoặc lên ý tưởng gì hôm nay?",
  engine: "gemini",
  model: "gemini-3.6-flash",
  timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
};

const SUGGESTIONS = [
  "Tư vấn vật liệu bảng hiệu mặt tiền ngoài trời chống bay màu",
  "Phân biệt hệ màu in ấn CMYK và RGB cho thợ thiết kế",
  "Viết prompt tạo ảnh biển hiệu quán cafe vintage ấm cúng",
  "Bóc tách định mức bạt 3M không gân khổ 3m x 6m",
];

export const AiChatTab: React.FC<AiChatTabProps> = ({
  apiHost,
  hasGeminiKey,
  hasGptKey,
  onUseAsPrompt,
}) => {
  const [engine] = useState<AiEngine>("gemini");
  const [model] = useState<string>("gemini-2.5-flash");
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME]);
  const [inputText, setInputText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (contentToSend?: string) => {
    const text = (contentToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText("");
    setLoading(true);

    try {
      // Chuẩn hóa danh sách messages gửi lên backend
      const cleanMessages = newHistory
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch(`${apiHost}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: cleanMessages,
          engine,
          model,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Lỗi phản hồi từ AI");
      }

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: "assistant",
        content: data.reply,
        engine: data.engine || engine,
        model: data.model || model,
        tokens: data.usage?.total_tokens || 0,
        costUsd: data.usage?.cost_usd || 0,
        costVnd: data.usage?.cost_vnd || 0,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      message.error(err.message || "Lỗi trò chuyện AI");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success("Đã sao chép nội dung tin nhắn!");
  };

  const handleUsePrompt = (content: string) => {
    // Trích xuất đoạn prompt nếu có trong ngoặc kép hoặc dùng toàn bộ đoạn văn ngắn
    let promptIdea = content;
    const match = content.match(/"([^"]{20,})"/);
    if (match && match[1]) {
      promptIdea = match[1];
    } else {
      // Lấy 2 câu đầu nếu văn bản quá dài
      const lines = content.split("\n").filter((l) => l.trim().length > 10);
      if (lines.length > 0) {
        promptIdea = lines[0].replace(/^[•\-*0-9.]+\s*/, "");
      }
    }

    onUseAsPrompt(promptIdea);
    message.success("✨ Đã chuyển nội dung sang ô Tạo Thiết Kế!");
  };

  const totalChatTokens = messages.reduce((s, m) => s + (m.tokens || 0), 0);
  const totalChatCostUsd = messages.reduce((s, m) => s + (m.costUsd || 0), 0);

  return (
    <div className="flex flex-col h-[70vh] text-slate-800">
      {/* Header Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 text-xs shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-800 font-bold text-xs">Trợ Lý AI Chuyên Gia In Ấn & Báo Giá</span>
        </div>

        <div className="flex items-center gap-3">
          {totalChatTokens > 0 && (
            <span className="text-[11px] font-mono text-slate-500">
              {totalChatTokens} tok • ${totalChatCostUsd.toFixed(4)}
            </span>
          )}
          <Tooltip title="Xóa lịch sử hội thoại">
            <button
              type="button"
              onClick={() => setMessages([DEFAULT_WELCOME])}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <DeleteOutlined />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Danh sách tin nhắn */}
      <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-3.5">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                  isUser
                    ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"
                    : "bg-blue-50 text-blue-600 border border-blue-200"
                }`}
              >
                {isUser ? <UserOutlined /> : <RobotOutlined />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? "bg-blue-600 text-white rounded-tr-xs shadow-xs"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-xs"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Footer metadata & actions */}
                {!isUser && m.id !== "welcome" && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-[10px] text-slate-400">
                    <span className="font-mono">
                      {m.engine?.toUpperCase()} ({m.model}) • {m.tokens || 0} tok
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(m.content)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CopyOutlined />
                        <span>Sao chép</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUsePrompt(m.content)}
                        className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Làm Prompt tạo thiết kế</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl w-fit border border-slate-200 shadow-2xs">
            <Spin size="small" />
            <span>AI đang suy nghĩ và phản hồi...</span>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Gợi ý câu hỏi nhanh */}
      <div className="flex flex-wrap gap-1.5 pb-2 shrink-0">
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(s)}
            className="text-[10px] px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="flex items-end gap-2 p-2 bg-white rounded-2xl border border-slate-300 shadow-xs shrink-0 focus-within:border-blue-500">
        <TextArea
          rows={2}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Nhập câu hỏi hoặc yêu cầu tư vấn vật liệu, báo giá, ý tưởng bảng hiệu (Enter để gửi)..."
          className="!bg-transparent !text-slate-800 !border-none !text-xs !resize-none focus:!shadow-none"
        />

        <button
          type="button"
          disabled={loading || !inputText.trim()}
          onClick={() => handleSend()}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold transition-all shadow-xs cursor-pointer border-none shrink-0"
        >
          <SendOutlined className="text-sm" />
        </button>
      </div>
    </div>
  );
};
