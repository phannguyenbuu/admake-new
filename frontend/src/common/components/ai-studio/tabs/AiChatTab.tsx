import React, { useState, useRef, useEffect } from "react";
import { Input, Tooltip, message, Spin } from "antd";
import {
  SendOutlined,
  CopyOutlined,
  DeleteOutlined,
  RobotOutlined,
  UserOutlined,
  PictureOutlined,
  ExpandOutlined,
  CloseCircleFilled,
} from "@ant-design/icons";
import { Sparkles, Terminal } from "lucide-react";
import type { AiEngine, ChatMessage, CodeBlock } from "../types";

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
    "Xin chào! Tôi là Trợ Lý Kỹ Thuật AI Studio của ADMAKE (kết nối trực tiếp ChatGPT Bridge & Google AI).\n\n" +
    "• Hỗ trợ viết script tự động hóa (Ruby SketchUp, Python, G-code CNC, AutoLISP AutoCAD).\n" +
    "• Bạn có thể Paste ảnh trực tiếp (Ctrl + V) hoặc kéo thả ảnh để phân tích và yêu cầu viết code tương ứng.\n" +
    "• Toàn bộ code xuất ra được tách riêng trong ô chuyên dụng để bạn Sao Chép (Copy) 1 chạm và sử dụng ngay.\n\n" +
    "Hãy đặt câu hỏi hoặc dán ảnh bản vẽ/bảng hiệu vào đây để bắt đầu!",
  engine: "toolx",
  model: "chatgpt-bridge",
  timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
};

const SUGGESTIONS = [
  "Viết script Ruby tạo bảng hiệu Billboard tấm lớn 1 trụ trong SketchUp",
  "Script Ruby dựng biển hộp đèn mica hút nổi tròn có viền nhôm định hình",
  "Tư vấn kết cấu khung sắt hộp mạ kẽm đan ô chịu gió bão cho Pano 10m x 4m",
  "Code script tạo bộ chữ nổi LED hắt sáng chân mica cháo trong SketchUp",
];

// Component hiển thị Khung Code chuyên dụng có Header ngôn ngữ & Nút Copy
interface CodeSnippetProps {
  code: string;
  language: string;
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    message.success("Đã sao chép mã code vào Clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-2.5 rounded-xl border border-slate-700/80 bg-slate-900 text-slate-100 overflow-hidden shadow-md">
      {/* Header thanh công cụ code */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-800/90 border-b border-slate-700/60 text-xs text-slate-300 select-none">
        <div className="flex items-center gap-1.5 font-mono uppercase font-bold text-cyan-400 tracking-wider text-[11px]">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>{language || "code"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip title="Sao chép toàn bộ script này">
            <button
              type="button"
              onClick={handleCopyCode}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border-none ${
                copied
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-700/80 hover:bg-slate-600 text-white hover:text-cyan-200"
              }`}
            >
              <CopyOutlined />
              <span>{copied ? "Đã Chép!" : "Sao Chép Code"}</span>
            </button>
          </Tooltip>

          <Tooltip title={isExpanded ? "Thu gọn khung nhìn" : "Mở rộng khung nhìn"}>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs border-none"
            >
              <ExpandOutlined />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Vùng hiển thị nội dung Code Mono */}
      <pre
        className={`p-3.5 text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed text-emerald-300 select-text custom-scrollbar ${
          isExpanded ? "max-h-[700px]" : "max-h-[360px]"
        }`}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const AiChatTab: React.FC<AiChatTabProps> = ({
  apiHost,
  hasGeminiKey,
  hasGptKey,
  onUseAsPrompt,
}) => {
  const [engine, setEngine] = useState<AiEngine>("toolx");
  const [model, setModel] = useState<string>("chatgpt-bridge");
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME]);
  const [inputText, setInputText] = useState<string>("");
  const [pastedImages, setPastedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, pastedImages]);

  // Xử lý dán ảnh từ Clipboard (Ctrl + V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          hasImage = true;
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setPastedImages((prev) => [...prev, event.target!.result as string]);
              message.success("✨ Đã dán ảnh vào câu hỏi!");
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // Chọn ảnh từ máy tính
  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPastedImages((prev) => [...prev, event.target!.result as string]);
          message.success(`Đã thêm ảnh: ${file.name}`);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  // Gửi tin nhắn
  const handleSend = async (contentToSend?: string) => {
    const text = (contentToSend || inputText).trim();
    if ((!text && pastedImages.length === 0) || loading) return;

    const currentImages = [...pastedImages];
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text || "(Gửi ảnh tham khảo)",
      images: currentImages.length > 0 ? currentImages : undefined,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText("");
    setPastedImages([]);
    setLoading(true);

    try {
      if (engine === "toolx") {
        // GỌI API RIÊNG: /api/ai/toolx/chat (Kết nối ChatGPT qua GenAI Toolxprint Extension Bridge)
        const res = await fetch(`${apiHost}/ai/toolx/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            images: currentImages,
            new_chat: false,
            wait: true,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Lỗi phản hồi từ ChatGPT Toolxprint Bridge");
        }

        const botMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          role: "assistant",
          content: data.reply || data.text || "",
          code_blocks: data.code_blocks && data.code_blocks.length > 0 ? data.code_blocks : undefined,
          engine: "toolx",
          model: "ChatGPT Web Bridge v3.0",
          durationSeconds: data.duration_seconds || 0,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, botMsg]);
      } else {
        // GỌI API CHAT CHUẨN: /api/ai/chat (Gemini hoặc OpenAI GPT)
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
      }
    } catch (err: any) {
      message.error(err.message || "Lỗi kết nối AI Bridge");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success("Đã sao chép nội dung tin nhắn!");
  };

  const handleUsePrompt = (content: string) => {
    let promptIdea = content;
    const match = content.match(/"([^"]{20,})"/);
    if (match && match[1]) {
      promptIdea = match[1];
    } else {
      const lines = content.split("\n").filter((l) => l.trim().length > 10);
      if (lines.length > 0) {
        promptIdea = lines[0].replace(/^[•\-*0-9.]+\s*/, "");
      }
    }

    onUseAsPrompt(promptIdea);
    message.success("✨ Đã chuyển nội dung sang ô Tạo Thiết Kế!");
  };

  // Helper render nội dung tin nhắn với Code Block bóc tách
  const renderMessageContent = (content: string, codeBlocks?: CodeBlock[]) => {
    if (codeBlocks && codeBlocks.length > 0) {
      // Loại bỏ duplicate markdown code nếu trong content đã có
      const cleanText = content.replace(/```[\s\S]*?```/g, "").trim();
      return (
        <div className="space-y-2">
          {cleanText && <div className="whitespace-pre-wrap leading-relaxed">{cleanText}</div>}
          {codeBlocks.map((cb, idx) => (
            <CodeSnippet key={idx} language={cb.language} code={cb.code} />
          ))}
        </div>
      );
    }

    // Tự động bóc tách Markdown code blocks (```lang ... ```) nếu có
    const parts: React.ReactNode[] = [];
    const codeBlockRegex = /```([a-zA-Z0-9_\-#+]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const preText = content.slice(lastIndex, match.index).trim();
      if (preText) {
        parts.push(
          <div key={`text_${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
            {preText}
          </div>
        );
      }
      const lang = match[1] || "code";
      const code = match[2];
      parts.push(
        <CodeSnippet key={`code_${match.index}`} language={lang} code={code.trim()} />
      );
      lastIndex = match.index + match[0].length;
    }

    const remainingText = content.slice(lastIndex).trim();
    if (remainingText) {
      parts.push(
        <div key={`text_${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
          {remainingText}
        </div>
      );
    }

    return parts.length > 0 ? (
      <div className="space-y-2">{parts}</div>
    ) : (
      <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
    );
  };

  return (
    <div className="flex flex-col h-[70vh] text-slate-800">
      {/* Header Info & Engine Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-white rounded-xl border border-slate-200 text-xs shrink-0 shadow-xs">
        {/* Bộ chọn Engine */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setEngine("toolx");
              setModel("chatgpt-bridge");
            }}
            className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border-none ${
              engine === "toolx"
                ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🤖</span>
            <span>ChatGPT Bridge (Toolxprint)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse ml-0.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setEngine("gemini");
              setModel("gemini-2.5-flash");
            }}
            className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border-none ${
              engine === "gemini"
                ? "bg-blue-600 text-white shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🟢</span>
            <span>Gemini Flash</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEngine("gpt");
              setModel("gpt-4o-mini");
            }}
            className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border-none ${
              engine === "gpt"
                ? "bg-violet-600 text-white shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🟣</span>
            <span>OpenAI GPT</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {engine === "toolx" && (
            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              ⚡ Bridge Extension Kết Nối Trực Tiếp
            </span>
          )}

          <Tooltip title="Xóa lịch sử hội thoại">
            <button
              type="button"
              onClick={() => {
                setMessages([DEFAULT_WELCOME]);
                setPastedImages([]);
              }}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer border-none"
            >
              <DeleteOutlined />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Danh sách tin nhắn */}
      <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-3.5 custom-scrollbar">
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
                    : m.engine === "toolx"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
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
                {/* Ảnh đính kèm trong tin nhắn của User */}
                {isUser && m.images && m.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {m.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="w-20 h-20 rounded-xl overflow-hidden border border-white/40 shadow-sm shrink-0 bg-slate-800"
                      >
                        <img src={img} alt="User upload" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Nội dung tin nhắn (kèm Code Blocks nếu có) */}
                {isUser ? (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                ) : (
                  renderMessageContent(m.content, m.code_blocks)
                )}

                {/* Footer metadata & actions */}
                {!isUser && m.id !== "welcome" && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-[10px] text-slate-400">
                    <span className="font-mono">
                      {m.engine === "toolx" ? "ChatGPT Bridge v3.0" : m.engine?.toUpperCase()} ({m.model})
                      {m.durationSeconds ? ` • ${m.durationSeconds}s` : ""}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(m.content)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center gap-1 cursor-pointer border-none"
                      >
                        <CopyOutlined />
                        <span>Sao chép text</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUsePrompt(m.content)}
                        className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Làm Prompt tạo ảnh</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-3 rounded-2xl w-fit border border-slate-200 shadow-2xs">
            <Spin size="small" />
            <span className="font-medium">
              {engine === "toolx"
                ? "Đang gửi sang Chrome Extension và chờ ChatGPT soạn câu trả lời & code..."
                : "AI đang suy nghĩ và phản hồi..."}
            </span>
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
            className="text-[10px] px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer shadow-2xs font-medium"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Vùng xem trước ảnh đã Paste (Ctrl + V) hoặc tải lên */}
      {pastedImages.length > 0 && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-slate-50/90 rounded-2xl border border-slate-200 overflow-x-auto shrink-0 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-600 shrink-0 ml-1">
            📷 Ảnh đính kèm ({pastedImages.length}):
          </span>
          {pastedImages.map((img, idx) => (
            <div
              key={idx}
              className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-300 shrink-0 group shadow-xs"
            >
              <img src={img} alt={`Attached ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPastedImages((prev) => prev.filter((_, i) => i !== idx))}
                className="absolute top-1 right-1 text-rose-600 bg-white/90 rounded-full hover:scale-110 transition-transform cursor-pointer border-none flex items-center justify-center p-0"
                title="Xóa ảnh này"
              >
                <CloseCircleFilled className="text-sm" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input box với sự kiện onPaste */}
      <div
        onPaste={handlePaste}
        className="flex items-end gap-2 p-2 bg-white rounded-2xl border border-slate-300 shadow-xs shrink-0 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
      >
        {/* Nút đính kèm ảnh ẩn */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleSelectFiles}
          accept="image/*"
          multiple
          className="hidden"
        />

        <Tooltip title="Đính kèm ảnh hoặc ấn Ctrl + V để dán ảnh chụp màn hình trực tiếp">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer border-none shrink-0"
          >
            <PictureOutlined className="text-base" />
          </button>
        </Tooltip>

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
          placeholder="Nhập câu hỏi hoặc dán ảnh (Ctrl + V) để yêu cầu viết script / code (Enter để gửi)..."
          className="!bg-transparent !text-slate-800 !border-none !text-xs !resize-none focus:!shadow-none"
        />

        <button
          type="button"
          disabled={loading || (!inputText.trim() && pastedImages.length === 0)}
          onClick={() => handleSend()}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold transition-all shadow-xs cursor-pointer border-none shrink-0"
        >
          <SendOutlined className="text-sm" />
        </button>
      </div>
    </div>
  );
};
