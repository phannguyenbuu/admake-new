import React, { useState } from "react";
import { Modal, Tooltip, message } from "antd";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CopyOutlined,
  ScissorOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { AiStudioImageItem } from "../types";

interface AiViewerModalProps {
  image: AiStudioImageItem | null;
  open: boolean;
  onClose: () => void;
  onSendToEdit?: (img: AiStudioImageItem) => void;
}

export const AiViewerModal: React.FC<AiViewerModalProps> = ({
  image,
  open,
  onClose,
  onSendToEdit,
}) => {
  const [scale, setScale] = useState<number>(1);

  if (!image) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = image.url;
    link.download = `toolx_ai_${image.id}_${image.resolution}_300dpi.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("Bắt đầu tải file ảnh PNG gốc chuẩn 300 DPI!");
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(image.enhancedPrompt || image.prompt);
    message.success("Đã sao chép prompt vào clipboard!");
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        setScale(1);
        onClose();
      }}
      footer={null}
      width="94vw"
      centered
      destroyOnClose
      styles={{
        content: {
          backgroundColor: "#030712",
          border: "1px solid #1f2937",
          borderRadius: "20px",
          padding: 0,
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
        },
        body: { padding: 0 },
      }}
    >
      <div className="flex flex-col h-[88vh] text-slate-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-emerald-400">
              TRÌNH XEM ẢNH SIÊU NÉT 4K
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              300 DPI
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {image.resolution} ({image.width} × {image.height} px)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 uppercase">
              {image.engine}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip title="Thu nhỏ">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.4, s - 0.25))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ZoomOutOutlined />
              </button>
            </Tooltip>
            <span className="text-xs font-mono text-slate-400 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Tooltip title="Phóng to">
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(4, s + 0.25))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ZoomInOutlined />
              </button>
            </Tooltip>
            <Tooltip title="Về 100%">
              <button
                type="button"
                onClick={() => setScale(1)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ReloadOutlined />
              </button>
            </Tooltip>

            {onSendToEdit && (
              <button
                type="button"
                onClick={() => {
                  onSendToEdit(image);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
              >
                <ScissorOutlined />
                <span>Sửa ảnh này (Inpainting)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-600/30"
            >
              <DownloadOutlined />
              <span>Tải PNG gốc</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-2"
            >
              <CloseOutlined />
            </button>
          </div>
        </div>

        {/* Viewport Zoom & Pan */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-radial-gradient from-slate-950 to-black">
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center center",
              transition: "transform 0.15s ease-out",
            }}
            className="relative shadow-2xl rounded-xl overflow-hidden border border-slate-800/80"
          >
            <img
              src={image.url}
              alt={image.prompt}
              className="max-h-[68vh] object-contain block select-none pointer-events-none"
            />
          </div>
        </div>

        {/* Footer info & prompt */}
        <div className="px-6 py-3.5 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-4 text-xs">
          <div className="flex-1 line-clamp-2 text-slate-300">
            <span className="font-bold text-violet-400 mr-2">Prompt:</span>
            {image.enhancedPrompt || image.prompt}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-slate-400 font-mono text-[11px]">
              {image.tokens} tokens • ${image.costUsd.toFixed(4)} ({image.costVnd.toLocaleString("vi-VN")} đ)
            </span>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <CopyOutlined />
              <span>Sao chép Prompt</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
