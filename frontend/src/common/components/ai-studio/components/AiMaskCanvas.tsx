import React, { useRef, useState, useEffect, useCallback } from "react";
import { Slider, Tooltip, Space } from "antd";
import { UndoOutlined, DeleteOutlined, EditOutlined, ScissorOutlined } from "@ant-design/icons";

interface AiMaskCanvasProps {
  imageUrl: string;
  onMaskChange: (maskBase64: string | null) => void;
  disabled?: boolean;
}

export const AiMaskCanvas: React.FC<AiMaskCanvasProps> = ({
  imageUrl,
  onMaskChange,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [brushSize, setBrushSize] = useState<number>(36);
  const [toolMode, setToolMode] = useState<"brush" | "eraser">("brush");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasDim, setCanvasDim] = useState<{ width: number; height: number }>({ width: 600, height: 400 });

  // Nạp và điều chỉnh kích thước Canvas theo tỉ lệ ảnh
  useEffect(() => {
    if (!imageUrl) return;
    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;
      const containerWidth = containerRef.current?.clientWidth || 600;
      const maxHeight = 420;
      
      let renderW = containerWidth;
      let renderH = (img.naturalHeight / img.naturalWidth) * containerWidth;

      if (renderH > maxHeight) {
        renderH = maxHeight;
        renderW = (img.naturalWidth / img.naturalHeight) * maxHeight;
      }

      setCanvasDim({ width: Math.round(renderW), height: Math.round(renderH) });
      setImageLoaded(true);
      setHasMask(false);
      setHistory([]);
      onMaskChange(null);
    };
  }, [imageUrl]);

  // Khởi tạo Canvas sau khi ảnh nạp xong
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = canvasDim.width;
    canvas.height = canvasDim.height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const blank = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([blank]);
    }
  }, [imageLoaded, canvasDim]);

  // Xuất Mask chuẩn định dạng OpenAI Inpainting (Alpha = 0 ở vùng vẽ, Alpha = 255 ở vùng giữ nguyên)
  const exportOpenAiMask = useCallback(() => {
    if (!canvasRef.current || !imgRef.current) return;
    const drawCanvas = canvasRef.current;
    const origW = imgRef.current.naturalWidth || drawCanvas.width;
    const origH = imgRef.current.naturalHeight || drawCanvas.height;

    // Tạo canvas offscreen với độ phân giải gốc của ảnh
    const offCanvas = document.createElement("canvas");
    offCanvas.width = origW;
    offCanvas.height = origH;
    const offCtx = offCanvas.getContext("2d");
    if (!offCtx) return;

    // Bước 1: Tô màu trắng đặc (Alpha = 255) cho toàn bộ ảnh
    offCtx.fillStyle = "rgba(255, 255, 255, 1.0)";
    offCtx.fillRect(0, 0, origW, origH);

    // Bước 2: Dùng chế độ 'destination-out' để đục thủng vùng người dùng đã vẽ (Alpha = 0)
    offCtx.globalCompositeOperation = "destination-out";
    offCtx.drawImage(drawCanvas, 0, 0, origW, origH);

    const maskDataUrl = offCanvas.toDataURL("image/png");
    onMaskChange(maskDataUrl);
  }, [onMaskChange]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || !canvasRef.current) return;
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;

    if (toolMode === "brush") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(239, 68, 68, 0.65)"; // Màu đỏ bán trong suốt hiển thị vùng sửa
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0, 0, 0, 1)";
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || !canvasRef.current) return;
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !canvasRef.current) return;
    setIsDrawing(false);
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.closePath();

    // Lưu snapshot vào history
    const currentFrame = ctx.getImageData(0, 0, canvasDim.width, canvasDim.height);
    setHistory((prev) => [...prev.slice(-15), currentFrame]);
    setHasMask(true);
    exportOpenAiMask();
  };

  const handleUndo = () => {
    if (history.length <= 1 || !canvasRef.current) return;
    const newHist = history.slice(0, -1);
    const lastFrame = newHist[newHist.length - 1];
    const ctx = canvasRef.current.getContext("2d");
    if (ctx && lastFrame) {
      ctx.putImageData(lastFrame, 0, 0);
      setHistory(newHist);
      if (newHist.length <= 1) {
        setHasMask(false);
        onMaskChange(null);
      } else {
        exportOpenAiMask();
      }
    }
  };

  const handleClear = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasDim.width, canvasDim.height);
      const blank = ctx.getImageData(0, 0, canvasDim.width, canvasDim.height);
      setHistory([blank]);
      setHasMask(false);
      onMaskChange(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full" ref={containerRef}>
      {/* Thanh công cụ vẽ cọ Mask */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setToolMode("brush")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              toolMode === "brush"
                ? "bg-red-500 text-white shadow-sm shadow-red-500/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <EditOutlined />
            <span>Cọ tô vùng sửa</span>
          </button>

          <button
            type="button"
            onClick={() => setToolMode("eraser")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              toolMode === "eraser"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <ScissorOutlined />
            <span>Tẩy vùng xóa</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-[140px]">
            <span className="text-slate-400 text-[11px] whitespace-nowrap">Cọ: {brushSize}px</span>
            <Slider
              min={8}
              max={80}
              value={brushSize}
              onChange={(val) => setBrushSize(val)}
              className="flex-1 !my-0 !py-0"
            />
          </div>

          <Tooltip title="Hoàn tác nét vẽ">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
            >
              <UndoOutlined />
            </button>
          </Tooltip>

          <Tooltip title="Xóa toàn bộ mask">
            <button
              type="button"
              onClick={handleClear}
              disabled={!hasMask}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 disabled:opacity-40 text-rose-400 transition-colors"
            >
              <DeleteOutlined />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Vùng Canvas vẽ trực quan chồng lên ảnh gốc */}
      <div className="relative mx-auto flex items-center justify-center bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl p-1">
        {/* Ảnh nền */}
        <img
          src={imageUrl}
          alt="Original for Edit"
          style={{ width: canvasDim.width, height: canvasDim.height }}
          className="object-contain block select-none pointer-events-none rounded-xl"
        />

        {/* Lớp Canvas vẽ */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            cursor: toolMode === "brush" ? "crosshair" : "cell",
          }}
          className="rounded-xl touch-none"
        />

        {!hasMask && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/90 text-slate-300 text-[11px] px-3 py-1 rounded-full border border-slate-700 pointer-events-none shadow-lg backdrop-blur-sm">
            💡 Dùng chuột hoặc ngón tay tô lên vùng muốn AI vẽ lại
          </div>
        )}
      </div>
    </div>
  );
};
