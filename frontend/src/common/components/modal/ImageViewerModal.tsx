import React, { useState, useEffect } from "react";
import { Modal, Tooltip, Empty } from "antd";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CloseOutlined,
  SwapOutlined,
} from "@ant-design/icons";

export interface ImageViewerModalProps {
  open: boolean;
  onCancel: () => void;
  imageUrl?: string | null;
  title?: string;
  width?: number | string;
  maxHeight?: number | string;
  alt?: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  open,
  onCancel,
  imageUrl,
  title = "Xem ảnh chi tiết",
}) => {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset controls state on modal open or image URL change + Push history state for phone back button
  useEffect(() => {
    if (open) {
      setScale(1);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);

      // Intercept phone / browser native Back button to close modal instead of navigating away
      window.history.pushState({ modalOpen: "imageViewer" }, "");

      const handlePopState = () => {
        onCancel();
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [open, imageUrl, onCancel]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.3, 5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.3, 0.4));
  const handleRotateLeft = () => setRotation((prev) => prev - 90);
  const handleRotateRight = () => setRotation((prev) => prev + 90);
  const handleFlipH = () => setFlipH((prev) => !prev);
  const handleFlipV = () => setFlipV((prev) => !prev);

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setPosition({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (scale !== 1) {
      handleReset();
    } else {
      setScale(2.5);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.2, 5));
    } else {
      setScale((prev) => Math.max(prev - 0.2, 0.4));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const getFullUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) {
      return url;
    }
    const apiHost = import.meta.env.VITE_API_IMAGE || "";
    return apiHost + (url.startsWith("/") ? url : "/" + url);
  };

  const finalSrc = getFullUrl(imageUrl);

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      closable={false}
      width="100vw"
      style={{ maxWidth: "100vw", top: 0, padding: 0, margin: 0 }}
      styles={{
        body: {
          height: "100vh",
          padding: 0,
          background: "rgba(15, 23, 42, 0.94)",
          backdropFilter: "blur(12px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        },
        content: {
          background: "transparent",
          boxShadow: "none",
          padding: 0,
          borderRadius: 0,
        },
      }}
      centered
      destroyOnClose
    >
      {/* ── Fixed High-Visibility Floating Close Button (Top-Right) ──────────── */}
      <button
        type="button"
        onClick={onCancel}
        className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[99999] h-11 w-11 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center shadow-2xl border-2 border-white/40 cursor-pointer transition-all"
        title="Đóng (Esc / Nút back)"
      >
        <CloseOutlined className="text-xl font-bold" />
      </button>

      {/* ── Top Header Bar ────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-16 sm:right-20 z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-b from-slate-950/90 to-transparent text-white select-none pointer-events-auto">
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
          <span className="text-sm sm:text-base font-bold tracking-wide text-slate-100 truncate">{title}</span>
          <span className="text-xs bg-slate-800/90 text-cyan-400 font-mono px-2 py-0.5 rounded-full border border-slate-700">
            {Math.round(scale * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          {finalSrc && (
            <a
              href={finalSrc}
              target="_blank"
              rel="noreferrer"
              download
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
              title="Tải ảnh gốc / Mở tab mới"
            >
              <DownloadOutlined /> Tải về
            </a>
          )}
        </div>
      </div>

      {/* ── Main Viewport (Image Drag & Pan & Zoom & Tap-Backdrop-to-Close) ─── */}
      <div
        className="flex-1 w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onCancel();
          }
        }}
      >
        {finalSrc ? (
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
              transition: isDragging ? "none" : "transform 0.15s ease-out",
              willChange: "transform",
            }}
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center pointer-events-none"
          >
            <img
              src={finalSrc}
              alt={title}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
              draggable={false}
            />
          </div>
        ) : (
          <Empty description={<span className="text-slate-400">Không có hình ảnh để hiển thị</span>} />
        )}
      </div>

      {/* ── Floating Toolbar Controls ──────────────────────────────────────── */}
      {finalSrc && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white shadow-2xl backdrop-blur-md select-none">
          <Tooltip title="Thu nhỏ (-)">
            <button
              type="button"
              onClick={handleZoomOut}
              className="h-9 px-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-cyan-400 flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer"
            >
              <ZoomOutOutlined className="text-base" />
            </button>
          </Tooltip>

          <span className="text-xs font-mono font-bold text-slate-300 px-2 min-w-[48px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <Tooltip title="Phóng to (+)">
            <button
              type="button"
              onClick={handleZoomIn}
              className="h-9 px-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-cyan-400 flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer"
            >
              <ZoomInOutlined className="text-base" />
            </button>
          </Tooltip>

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          <Tooltip title="Xoay trái 90°">
            <button
              type="button"
              onClick={handleRotateLeft}
              className="h-9 w-9 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-cyan-400 flex items-center justify-center transition-all cursor-pointer"
            >
              <RotateLeftOutlined className="text-base" />
            </button>
          </Tooltip>

          <Tooltip title="Xoay phải 90°">
            <button
              type="button"
              onClick={handleRotateRight}
              className="h-9 w-9 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-cyan-400 flex items-center justify-center transition-all cursor-pointer"
            >
              <RotateRightOutlined className="text-base" />
            </button>
          </Tooltip>

          <Tooltip title="Lật ngang">
            <button
              type="button"
              onClick={handleFlipH}
              className={`h-9 w-9 rounded-xl hover:bg-slate-800 flex items-center justify-center transition-all cursor-pointer ${
                flipH ? "bg-cyan-950 text-cyan-400 border border-cyan-700" : "text-slate-300 hover:text-cyan-400"
              }`}
            >
              <SwapOutlined className="text-base" />
            </button>
          </Tooltip>

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          <Tooltip title="Đặt lại (Reset)">
            <button
              type="button"
              onClick={handleReset}
              className="h-9 px-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-rose-400 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
            >
              <ReloadOutlined className="text-xs" /> Đặt lại
            </button>
          </Tooltip>
        </div>
      )}
    </Modal>
  );
};

export default ImageViewerModal;
