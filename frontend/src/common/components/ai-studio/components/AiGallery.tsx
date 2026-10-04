import React, { useState } from "react";
import { Tooltip, Popconfirm, Empty, message } from "antd";
import {
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ScissorOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { Sparkles } from "lucide-react";
import type { AiStudioImageItem } from "../types";

interface AiGalleryProps {
  images: AiStudioImageItem[];
  onSelectImage: (img: AiStudioImageItem) => void;
  onSendToEdit: (img: AiStudioImageItem) => void;
  onDeleteImage: (id: string) => void;
}

export const AiGallery: React.FC<AiGalleryProps> = ({
  images,
  onSelectImage,
  onSendToEdit,
  onDeleteImage,
}) => {
  const [filterType, setFilterType] = useState<"all" | "create" | "edit">("all");

  const filtered = images.filter((img) => {
    if (filterType === "all") return true;
    if (filterType === "create") return img.taskType === "create";
    return img.taskType === "edit" || img.taskType === "inpainting";
  });

  const totalTokens = images.reduce((sum, i) => sum + (i.tokens || 0), 0);
  const totalCostUsd = images.reduce((sum, i) => sum + (i.costUsd || 0), 0);

  const handleDownload = (e: React.MouseEvent, img: AiStudioImageItem) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = img.url;
    link.download = `admake_ai_${img.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("Đang tải ảnh gốc chuẩn 300 DPI!");
  };

  const handleCopyPrompt = (e: React.MouseEvent, promptText: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(promptText);
    message.success("Đã sao chép prompt!");
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 text-slate-200">
      {/* Gallery Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Thư Viện Kết Quả
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
            {images.length} ảnh
          </span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filterType === "all"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setFilterType("create")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filterType === "create"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tạo thiết kế
          </button>
          <button
            type="button"
            onClick={() => setFilterType("edit")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filterType === "edit"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sửa thiết kế
          </button>
        </div>
      </div>

      {/* Stats summary banner */}
      {images.length > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 my-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
          <span>
            Độ phân giải: <strong className="text-emerald-400 font-mono">4K Ultra HD (300 DPI)</strong>
          </span>
          <span>
            Tổng tiêu thụ:{" "}
            <strong className="text-violet-300 font-mono">
              {totalTokens.toLocaleString()} tokens
            </strong>{" "}
            •{" "}
            <strong className="text-amber-400 font-mono">
              ${totalCostUsd.toFixed(4)}
            </strong>
          </span>
        </div>
      )}

      {/* Grid danh sách ảnh */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-slate-500 text-xs">
            <Empty
              description={
                <span className="text-slate-400">
                  {filterType === "all"
                    ? "Chưa có ảnh nào được tạo. Hãy nhập prompt ở cột bên trái và bấm 'Tiến Hành Tạo Ảnh 4K'!"
                    : "Không có ảnh nào trong bộ lọc này."}
                </span>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map((img) => (
              <div
                key={img.id}
                onClick={() => onSelectImage(img)}
                className="group relative flex flex-col bg-slate-950/90 rounded-xl border border-slate-800/90 overflow-hidden hover:border-violet-500/60 transition-all hover:shadow-xl hover:shadow-violet-950/20 cursor-pointer"
              >
                {/* Image Thumbnail Container */}
                <div className="relative aspect-4/3 overflow-hidden bg-slate-900 flex items-center justify-center">
                  <img
                    src={img.thumbnailUrl || img.url}
                    alt={img.prompt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Badges on top */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-slate-950/80 text-violet-300 border border-violet-500/30 backdrop-blur-xs">
                      {img.engine}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 backdrop-blur-xs">
                      {img.resolution}
                    </span>
                  </div>

                  {img.taskType !== "create" && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/30 backdrop-blur-xs">
                      Inpainting
                    </div>
                  )}

                  {/* Hover Quick Action Buttons Overlay */}
                  <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 backdrop-blur-2xs">
                    <Tooltip title="Xem phóng to 4K">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectImage(img);
                        }}
                        className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white shadow-md transition-transform hover:scale-110"
                      >
                        <EyeOutlined />
                      </button>
                    </Tooltip>

                    <Tooltip title="Chuyển sang Tab Sửa ảnh (Inpainting)">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendToEdit(img);
                        }}
                        className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-transform hover:scale-110"
                      >
                        <ScissorOutlined />
                      </button>
                    </Tooltip>

                    <Tooltip title="Tải file PNG 300 DPI">
                      <button
                        type="button"
                        onClick={(e) => handleDownload(e, img)}
                        className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-transform hover:scale-110"
                      >
                        <DownloadOutlined />
                      </button>
                    </Tooltip>

                    <Popconfirm
                      title="Xóa ảnh này?"
                      description="Ảnh sẽ bị xóa khỏi thư viện phiên làm việc này."
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        onDeleteImage(img.id);
                      }}
                      onCancel={(e) => e?.stopPropagation()}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-md transition-transform hover:scale-110"
                      >
                        <DeleteOutlined />
                      </button>
                    </Popconfirm>
                  </div>
                </div>

                {/* Card Meta Description */}
                <div className="p-2.5 flex flex-col gap-1.5 text-[11px] bg-slate-950/90">
                  <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                    <span>{img.width}×{img.height} px</span>
                    <span className="text-violet-300 font-bold">${img.costUsd.toFixed(4)}</span>
                  </div>
                  <p className="line-clamp-2 text-slate-300 m-0 leading-snug" title={img.prompt}>
                    {img.prompt}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px] text-slate-500">
                    <span>{img.createdAt}</span>
                    <button
                      type="button"
                      onClick={(e) => handleCopyPrompt(e, img.enhancedPrompt || img.prompt)}
                      className="hover:text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      <CopyOutlined /> Prompt
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
