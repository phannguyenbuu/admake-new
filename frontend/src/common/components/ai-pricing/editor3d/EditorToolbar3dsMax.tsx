/**
 * EditorToolbar3dsMax.tsx - Thanh công cụ điều khiển 3D phong cách 3ds Max
 * Thiết kế Light Theme đồng bộ cột trái, các nút bấm chủ đạo sử dụng màu Xanh Admake Gradient (#00b4b6 -> #0284c7)
 */

import React, { useEffect } from "react";
import { Tooltip } from "antd";
import {
  MousePointer,
  Move,
  RotateCw,
  Maximize2,
  Globe,
  Compass,
  Type,
  Palette,
  Trash2,
  RotateCcw,
  Magnet,
} from "lucide-react";
import type { TransformMode, CoordinateSpace } from "./editorTypes";

interface EditorToolbar3dsMaxProps {
  mode: TransformMode;
  setMode: (m: TransformMode) => void;
  space?: CoordinateSpace;
  setSpace?: (s: CoordinateSpace) => void;
  snap?: boolean;
  setSnap?: (v: boolean) => void;
  hasSelection?: boolean;
  onAddText?: () => void;
  onOpenMaterialPicker?: () => void;
  onDeleteSelected?: () => void;
  onResetTransform?: () => void;
  onDeselect?: () => void;
}

export const EditorToolbar3dsMax: React.FC<EditorToolbar3dsMaxProps> = ({
  mode,
  setMode,
  hasSelection,
  onDeleteSelected,
  onDeselect,
}) => {
  // Lắng nghe phím tắt 3ds Max: Q, W, E, R, Del, Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.key === "q" || e.key === "Q") setMode("select");
      else if (e.key === "w" || e.key === "W") setMode("translate");
      else if (e.key === "e" || e.key === "E") setMode("rotate");
      else if (e.key === "r" || e.key === "R") setMode("scale");
      else if (e.key === "Delete" && hasSelection) onDeleteSelected?.();
      else if (e.key === "Escape") onDeselect?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasSelection, setMode, onDeleteSelected, onDeselect]);

  return (
    <div className="flex flex-col space-y-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs select-none text-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00b4b6]" />
          Biến đổi
        </span>
      </div>

      {/* 1. Hàng 4 chế độ Biến đổi (Transform Modes) */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-white rounded-xl border border-slate-200/80">
        <Tooltip title="Chọn vật thể (Phím Q)" placement="top">
          <button
            type="button"
            onClick={() => setMode("select")}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs transition-all cursor-pointer ${
              mode === "select"
                ? "bg-gradient-to-r from-[#00b4b6] to-[#0284c7] text-white font-bold shadow-xs scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="font-semibold">Chọn (Q)</span>
          </button>
        </Tooltip>

        <Tooltip title="Di chuyển theo 3 trục X-Y-Z (Phím W)" placement="top">
          <button
            type="button"
            onClick={() => setMode("translate")}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs transition-all cursor-pointer ${
              mode === "translate"
                ? "bg-gradient-to-r from-[#00b4b6] to-[#0284c7] text-white font-bold shadow-xs scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span className="font-semibold">Dời (W)</span>
          </button>
        </Tooltip>

        <Tooltip title="Xoay theo 3 trục (Phím E)" placement="top">
          <button
            type="button"
            onClick={() => setMode("rotate")}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs transition-all cursor-pointer ${
              mode === "rotate"
                ? "bg-gradient-to-r from-[#00b4b6] to-[#0284c7] text-white font-bold shadow-xs scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="font-semibold">Xoay (E)</span>
          </button>
        </Tooltip>

        <Tooltip title="Kéo dãn không đồng dạng 3 trục X-Y-Z (Phím R)" placement="top">
          <button
            type="button"
            onClick={() => setMode("scale")}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs transition-all cursor-pointer ${
              mode === "scale"
                ? "bg-gradient-to-r from-[#00b4b6] to-[#0284c7] text-white font-bold shadow-xs scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="font-semibold">Scale (R)</span>
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
