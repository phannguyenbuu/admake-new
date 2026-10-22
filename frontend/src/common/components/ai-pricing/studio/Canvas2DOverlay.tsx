/**
 * Canvas2DOverlay.tsx - Giao diện kéo thả Logo & Text 2D trên Canvas
 * Toàn bộ công cụ và lịch sử được gom vào 1 panel duy nhất ở góc phải dưới màn hình
 * Có nút Chevron Up/Down để Collapse / Expand và sử dụng hoàn toàn Light Theme
 */

import React, { useRef, useState, useEffect } from "react";
import { Tooltip, Input, Dropdown } from "antd";
import {
  Upload,
  Type,
  Trash2,
  Sliders,
  FileText,
  FileDown,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { OverlayLogo, OverlayTextItem, CanvasPageType, OverlayItemPageScope, PdfOrientation } from "./overlayTypes";

interface Canvas2DOverlayProps {
  activeCanvasPage: CanvasPageType;
  setActiveCanvasPage: (page: CanvasPageType) => void;
  logo: OverlayLogo | null;
  onUploadLogo: (file: File) => void;
  onRemoveLogo: () => void;
  onUpdateLogo: (updates: Partial<OverlayLogo>) => void;
  textItems: OverlayTextItem[];
  onAddTextItem: (preset?: Partial<OverlayTextItem>) => void;
  onUpdateTextItem: (id: string, updates: Partial<OverlayTextItem>) => void;
  onDeleteTextItem: (id: string) => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  renderHistory?: string[];
  activeRenderUrl?: string | null;
  setActiveRenderUrl?: (url: string) => void;
  onExportPdf?: (orientation?: PdfOrientation) => void;
  orientation?: PdfOrientation;
  setOrientation?: (o: PdfOrientation) => void;
}

const COLOR_PALETTE = [
  { name: "Trắng", val: "#ffffff" },
  { name: "Vàng Gold", val: "#f59e0b" },
  { name: "Xanh Cyan", val: "#00b4b6" },
  { name: "Đỏ", val: "#ef4444" },
  { name: "Đen / Tối", val: "#1e293b" },
  { name: "Xanh Dương", val: "#3b82f6" },
];

const FONT_SIZES = [11, 14, 18, 24, 32];
const FONT_WEIGHTS: Array<"300" | "400" | "600" | "700" | "900"> = ["300", "400", "600", "700", "900"];

export const Canvas2DOverlay: React.FC<Canvas2DOverlayProps> = ({
  activeCanvasPage,
  setActiveCanvasPage,
  logo,
  onUploadLogo,
  onRemoveLogo,
  onUpdateLogo,
  textItems,
  onAddTextItem,
  onUpdateTextItem,
  onDeleteTextItem,
  selectedItemId,
  setSelectedItemId,
  containerRef,
  renderHistory,
  activeRenderUrl,
  setActiveRenderUrl,
  onExportPdf,
  orientation,
  setOrientation,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Trạng thái thu gọn / mở rộng panel Chú thích & Logo (mặc định thu gọn)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(true);

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; itemX: number; itemY: number } | null>(null);

  // Lắng nghe phím ESC để bỏ chọn item
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedItemId(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSelectedItemId]);

  const handlePointerDown = (e: React.PointerEvent, id: string, initX: number, initY: number) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setSelectedItemId(id);
    setDraggingId(id);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      itemX: initX,
      itemY: initY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !dragStartRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const deltaXPct = ((e.clientX - dragStartRef.current.clientX) / rect.width) * 100;
    const deltaYPct = ((e.clientY - dragStartRef.current.clientY) / rect.height) * 100;

    const newX = Math.max(0, Math.min(94, Number((dragStartRef.current.itemX + deltaXPct).toFixed(1))));
    const newY = Math.max(0, Math.min(94, Number((dragStartRef.current.itemY + deltaYPct).toFixed(1))));

    if (draggingId === "logo") {
      onUpdateLogo({ x: newX, y: newY });
    } else {
      onUpdateTextItem(draggingId, { x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      setDraggingId(null);
      dragStartRef.current = null;
    }
  };

  // Lọc items theo trang đang xem
  const visibleTexts = textItems.filter((t) => t.page === activeCanvasPage || t.page === "both");
  const showLogo = logo && (logo.page === activeCanvasPage || logo.page === "both");
  const selectedText = textItems.find((t) => t.id === selectedItemId);

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUploadLogo(file);
          e.target.value = "";
        }}
      />

      {/* 1. VÙNG OVERLAY KÉO THẢ TEXT & LOGO TRÊN CANVAS (Light theme, không nền đen) */}
      <div
        className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Render Logo */}
        {showLogo && (
          <div
            style={{
              position: "absolute",
              left: `${logo!.x}%`,
              top: `${logo!.y}%`,
              width: `${logo!.width}%`,
            }}
            className={`pointer-events-auto cursor-move group select-none ${
              selectedItemId === "logo" ? "ring-2 ring-[#00b4b6] ring-offset-2 ring-offset-white rounded-lg" : ""
            }`}
            onPointerDown={(e) => handlePointerDown(e, "logo", logo!.x, logo!.y)}
          >
            <img src={logo!.url} alt="Logo" className="w-full h-auto object-contain block max-h-24 pointer-events-none drop-shadow-md" />
          </div>
        )}

        {/* Render danh sách Text 2D (Light theme, không dùng nền đen) */}
        {visibleTexts.map((item) => {
          const isSelected = selectedItemId === item.id;
          const cleanBg = item.bgColor && !item.bgColor.includes("0,0,0") ? item.bgColor : "transparent";

          return (
            <div
              key={item.id}
              style={{
                position: "absolute",
                left: `${item.x}%`,
                top: `${item.y}%`,
                fontSize: `${item.fontSize}px`,
                fontWeight: item.fontWeight,
                color: item.color,
                backgroundColor: cleanBg,
                borderRadius: `${item.borderRadius || 6}px`,
                textShadow: "0 1.5px 3px rgba(0,0,0,0.85), 0 0 6px rgba(0,0,0,0.5)",
              }}
              className={`pointer-events-auto cursor-move select-none px-2 py-0.5 max-w-[85%] transition-shadow whitespace-pre-wrap leading-tight ${
                isSelected
                  ? "ring-2 ring-[#00b4b6] shadow-xl ring-offset-2 ring-offset-white"
                  : "hover:ring-1 hover:ring-white/80"
              }`}
              onPointerDown={(e) => handlePointerDown(e, item.id, item.x, item.y)}
            >
              {item.text}
            </div>
          );
        })}
      </div>

      {/* 2. THANH FOOTER: Thứ tự Xuất PDF -> Chú thích & Logo -> Text setting */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-40 flex items-center gap-2 max-w-[calc(100%-24px)] overflow-x-auto select-none pointer-events-auto">
        {/* (1) Nút Xuất PDF */}
        {onExportPdf && (
          <Dropdown
            placement="top"
            trigger={["hover"]}
            menu={{
              items: [
                {
                  key: "landscape",
                  label: (
                    <div className="flex items-center gap-2 py-1 px-1 font-semibold text-xs text-slate-800">
                      <span className="text-sm">↔️</span>
                      <div><div>In Nằm (Khổ ngang A4)</div><div className="text-[10px] text-slate-400 font-normal">297 × 210 mm • Dàn ngang</div></div>
                    </div>
                  ),
                  onClick: () => { setOrientation?.("landscape"); onExportPdf("landscape"); },
                },
                {
                  key: "portrait",
                  label: (
                    <div className="flex items-center gap-2 py-1 px-1 font-semibold text-xs text-slate-800">
                      <span className="text-sm">↕️</span>
                      <div><div>In Đứng (Khổ dọc A4)</div><div className="text-[10px] text-slate-400 font-normal">210 × 297 mm • Khổ dọc chuẩn</div></div>
                    </div>
                  ),
                  onClick: () => { setOrientation?.("portrait"); onExportPdf("portrait"); },
                },
              ],
            }}
          >
            <button
              type="button"
              onClick={() => onExportPdf()}
              className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-gradient-to-r from-[#00b4b6] to-[#0284c7] hover:from-[#00a2a4] hover:to-[#0275b0] text-white border-none text-xs font-bold shadow-lg cursor-pointer transition-all hover:scale-102 active:scale-98 shrink-0"
              title="Hover để chọn Khổ Nằm / Khổ Đứng hoặc bấm để xuất PDF ngay"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Xuất PDF</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>
          </Dropdown>
        )}

        {/* (2) Nút Chú thích & Logo */}
        <button
          type="button"
          onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
          className={`flex items-center gap-1.5 px-3 h-9 rounded-xl border font-bold text-xs shadow-md cursor-pointer transition-all shrink-0 ${
            !isPanelCollapsed
              ? "bg-slate-800 text-white border-slate-800"
              : "bg-white/95 hover:bg-white text-slate-700 border-slate-200/90"
          }`}
          title="Mở / đóng bảng Chú thích & Logo"
        >
          <Sliders className="w-3.5 h-3.5 text-[#00b4b6]" />
          <span>Chú thích & Logo</span>
          {isPanelCollapsed ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-300" />}
        </button>

        {/* (3) Logo setting (xuất hiện ở footer khi Logo được chọn) */}
        {selectedItemId === "logo" && logo && (
          <div
            className="flex items-center gap-2 bg-white/95 backdrop-blur-md p-1 px-2.5 rounded-xl border border-slate-200 shadow-xl text-slate-700 text-xs shrink-0 select-none font-medium h-9"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-slate-500 text-[11px] font-semibold">Cỡ logo:</span>
            <input
              type="range"
              min={8}
              max={35}
              value={logo.width}
              onChange={(e) => onUpdateLogo({ width: Number(e.target.value) })}
              className="w-16 accent-[#00b4b6] cursor-pointer"
            />
            <select
              value={logo.page}
              onChange={(e) => onUpdateLogo({ page: e.target.value as OverlayItemPageScope })}
              className="bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-slate-700 text-[11px] cursor-pointer"
            >
              <option value="both">Cả 2 trang</option>
              <option value="render">Trang 1</option>
              <option value="quote">Trang 2</option>
            </select>
            <button
              type="button"
              onClick={onRemoveLogo}
              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded cursor-pointer transition-colors"
              title="Xóa logo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* (4) Text setting (xuất hiện khi có Text được chọn) */}
        {selectedText && (
          <div
            className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 px-2 rounded-xl border border-slate-200 shadow-xl text-slate-800 text-xs shrink-0 select-none font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            <Input
              size="small"
              value={selectedText.text}
              onChange={(e) => onUpdateTextItem(selectedText.id, { text: e.target.value })}
              className="w-32 sm:w-40 bg-slate-50 border-slate-300 text-slate-800 text-xs rounded-lg"
              placeholder="Nội dung chữ..."
            />
            <select
              value={selectedText.fontSize}
              onChange={(e) => onUpdateTextItem(selectedText.id, { fontSize: Number(e.target.value) })}
              className="bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-slate-700 text-[11px] cursor-pointer"
            >
              {FONT_SIZES.map((fs) => (
                <option key={fs} value={fs}>{fs}px</option>
              ))}
            </select>
            <select
              value={selectedText.fontWeight}
              onChange={(e) => onUpdateTextItem(selectedText.id, { fontWeight: e.target.value as any })}
              className="bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-slate-700 text-[11px] cursor-pointer"
            >
              <option value="300">Light 300</option>
              <option value="400">Regular 400</option>
              <option value="600">Semibold 600</option>
              <option value="700">Bold 700</option>
              <option value="900">Black 900</option>
            </select>
            <div className="flex items-center gap-1 px-1 bg-slate-100 rounded p-0.5 border border-slate-200">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.val}
                  type="button"
                  onClick={() => onUpdateTextItem(selectedText.id, { color: c.val })}
                  style={{ backgroundColor: c.val }}
                  className={`w-3.5 h-3.5 rounded-full border border-slate-300 cursor-pointer transition-transform ${
                    selectedText.color === c.val ? "scale-125 ring-2 ring-[#00b4b6]" : ""
                  }`}
                  title={c.name}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateTextItem(selectedText.id, {
                  bgColor: selectedText.bgColor === "transparent" ? "rgba(255,255,255,0.92)" : "transparent",
                })
              }
              className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer border transition-colors ${
                selectedText.bgColor && selectedText.bgColor !== "transparent"
                  ? "bg-[#00b4b6] text-white border-[#00b4b6]"
                  : "bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Nền
            </button>
            <select
              value={selectedText.page}
              onChange={(e) => onUpdateTextItem(selectedText.id, { page: e.target.value as OverlayItemPageScope })}
              className="bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-slate-700 text-[11px] cursor-pointer"
            >
              <option value="both">Cả 2 trang</option>
              <option value="render">Trang 1</option>
              <option value="quote">Trang 2</option>
            </select>
            <button
              type="button"
              onClick={() => onDeleteTextItem(selectedText.id)}
              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded cursor-pointer transition-colors"
              title="Xóa chữ này"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3. BẢNG PANEL CHÚ THÍCH & LOGO KHI MỞ RA (nằm phía trên thanh footer) */}
      {!isPanelCollapsed && (
        <div className="absolute bottom-14 left-3 sm:left-4 z-40 select-none pointer-events-auto max-w-[400px] w-[calc(100%-24px)] sm:w-[380px]">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-3 text-slate-800 text-xs space-y-2.5 font-medium">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase tracking-wide">
                <Sliders className="w-3.5 h-3.5 text-[#00b4b6]" />
                <span>Chú Thích Bản Vẽ & Logo</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPanelCollapsed(true)}
                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                title="Đóng bảng"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Nhóm công cụ Logo & Thêm Text 2D */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 cursor-pointer transition-colors text-[11px]"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-600" />
                  <span>{logo ? "Đổi Logo" : "+ Logo"}</span>
                </button>
                {logo && (
                  <Tooltip title="Xóa logo">
                    <button
                      type="button"
                      onClick={onRemoveLogo}
                      className="w-7 h-7 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Tooltip>
                )}
              </div>

              <button
                type="button"
                onClick={() => onAddTextItem()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00b4b6] to-[#0284c7] hover:from-[#009b9d] hover:to-[#0275b0] text-white font-bold cursor-pointer transition-all shadow-xs text-xs"
              >
                <Type className="w-3.5 h-3.5" />
                <span>+ Thêm Text 2D</span>
              </button>
            </div>

            {/* Quick preset chips */}
            <div className="flex items-center gap-1 flex-wrap pt-0.5 border-t border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 mr-0.5">Mẫu:</span>
              <button
                type="button"
                onClick={() => onAddTextItem({ text: "CÔNG TY TNHH ADMAKE VIỆT NAM", label: "Chủ đầu tư", fontSize: 16, fontWeight: "700" })}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700 font-medium border border-slate-200 cursor-pointer"
              >
                + Chủ đầu tư
              </button>
              <button
                type="button"
                onClick={() => onAddTextItem({ text: "GHI CHÚ: MẶT BẬT 3M IN UV CHỐNG NẮNG", label: "Ghi chú", fontSize: 13, color: "#d97706" })}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700 font-medium border border-slate-200 cursor-pointer"
              >
                + Ghi chú
              </button>
            </div>

            {/* Lịch sử render thumbnails nếu có */}
            {renderHistory && renderHistory.length > 0 && setActiveRenderUrl && (
              <div className="pt-1.5 border-t border-slate-100 space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Lịch sử render ({renderHistory.length} bản):
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5 visible-scrollbar">
                  {renderHistory.map((url, idx) => (
                    <div
                      key={url}
                      onClick={() => setActiveRenderUrl(url)}
                      className={`h-11 w-14 rounded-lg overflow-hidden border-2 cursor-pointer shrink-0 transition-all ${
                        activeRenderUrl === url ? "border-[#00b4b6] scale-105 shadow-md" : "border-slate-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={url} alt={`Version ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
