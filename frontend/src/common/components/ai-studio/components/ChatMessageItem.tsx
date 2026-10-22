import React from "react";
import { CopyOutlined, RobotOutlined, UserOutlined } from "@ant-design/icons";
import { Sparkles } from "lucide-react";
import type { ChatMessage, CodeBlock } from "../types";
import { CodeSnippet } from "./CodeSnippet";

interface ChatMessageItemProps {
  message: ChatMessage;
  onCopy: (content: string) => void;
  onUsePrompt: (content: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message: m,
  onCopy,
  onUsePrompt
}) => {
  const isUser = m.role === "user";

  const renderContent = (content: string, codeBlocks?: CodeBlock[]) => {
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
    <div className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
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
          renderContent(m.content, m.code_blocks)
        )}

        {/* Footer metadata & actions */}
        {!isUser && m.id !== "welcome" && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-[10px] text-slate-400">
            <span className="font-mono">
              {m.engine === "toolx" ? "AI Vision Bridge v3.0" : m.engine?.toUpperCase()} ({m.model})
              {m.durationSeconds ? ` • ${m.durationSeconds}s` : ""}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onCopy(m.content)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center gap-1 cursor-pointer border-none"
              >
                <CopyOutlined />
                <span>Sao chép text</span>
              </button>

              <button
                type="button"
                onClick={() => onUsePrompt(m.content)}
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
};
