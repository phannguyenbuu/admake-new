import React, { useState } from "react";
import { Tooltip, message } from "antd";
import { CopyOutlined, ExpandOutlined } from "@ant-design/icons";
import { Terminal } from "lucide-react";

interface CodeSnippetProps {
  code: string;
  language: string;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = ({ code, language }) => {
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
