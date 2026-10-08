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
    link.download = `admake_ai_${image.id}_${image.resolution}_300dpi.png`;
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
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "20px",
          padding: 0,
          overflow: "hidden",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        },
        body: { padding: 0 },
      }}
    >
      <div className="flex flex-col h-[88vh] text-slate-800">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-base font-extrabold text-slate-800">
              TRÌNH XEM ẢNH SIÊU NÉT 4K
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              300 DPI
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {image.resolution} ({image.width} × {image.height} px)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
              {image.engine}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip title="Thu nhỏ">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.4, s - 0.25))}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <ZoomOutOutlined />
              </button>
            </Tooltip>
            <span className="text-xs font-mono text-slate-600 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Tooltip title="Phóng to">
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(4, s + 0.25))}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <ZoomInOutlined />
              </button>
            </Tooltip>
            <Tooltip title="Về 100%">
              <button
                type="button"
                onClick={() => setScale(1)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                <ScissorOutlined />
                <span>Sửa ảnh này (Inpainting)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-xs cursor-pointer"
            >
              <DownloadOutlined />
              <span>Tải PNG gốc</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors ml-2 cursor-pointer"
            >
              <CloseOutlined />
            </button>
          </div>
        </div>

        {/* Viewport Zoom & Pan */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-slate-100">
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center center",
              transition: "transform 0.15s ease-out",
            }}
            className="relative shadow-lg rounded-xl overflow-hidden border border-slate-200 bg-white"
          >
            <img
              src={image.url}
              alt={image.prompt}
              className="max-h-[68vh] object-contain block select-none pointer-events-none"
            />
          </div>
        </div>

        {/* Footer info & prompt */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-4 text-xs">
          <div className="flex-1 line-clamp-2 text-slate-700">
            <span className="font-bold text-blue-600 mr-2">Prompt:</span>
            {image.enhancedPrompt || image.prompt}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-slate-500 font-mono text-[11px]">
              {image.tokens} tokens • ${image.costUsd.toFixed(4)} ({image.costVnd.toLocaleString("vi-VN")} đ)
            </span>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
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
