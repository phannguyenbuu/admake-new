/**
 * EditorInspectorPanel.tsx - Bảng điều khiển toạ độ (Transform) và vật liệu vật thể
 * Thiết kế 2 cột: Cột 1 Transform Panel, Cột 2 Vật liệu (Dropdown 2 cột)
 * Theme sáng đồng bộ Admake teal gradient
 */

import React, { useState } from "react";
import { Tooltip, InputNumber, Input, Popover } from "antd";
import {
  X,
  Palette,
  Maximize2,
  Move,
  RotateCw,
  Type,
  Lock,
  Unlock,
  Layers,
  ChevronDown,
  Search,
} from "lucide-react";
import type { SelectedMeshInfo } from "./editorTypes";
import { SIGNBOARD_MATERIALS } from "./materialsCatalog";
import { MaterialPbrSliders, type CustomPbrProps } from "./MaterialPbrSliders";

const MATERIAL_CATEGORIES = [
  { key: "alu", title: "✨ Mặt dựng Alu Alcorest" },
  { key: "inox", title: "👑 Inox & Kim loại chữ nổi" },
  { key: "mica", title: "🎨 Mica Đài Loan chữ hộp" },
  { key: "iron", title: "🏗️ Khung sắt kết cấu" },
  { key: "led", title: "💡 Đèn LED & Neon" },
  { key: "lumion", title: "💎 Vật Liệu Kiến Trúc PBR" },
];

interface EditorInspectorPanelProps {
  selection: SelectedMeshInfo | null;
  onUpdateTransform: (
    pos: [number, number, number],
    rot: [number, number, number],
    scale: [number, number, number]
  ) => void;
  onApplyMaterial: (materialId: string) => void;
  onUpdateMaterialProperties?: (props: CustomPbrProps) => void;
  onOpenEditTextModal?: () => void;
  onOpenAddTextModal?: () => void;
  onClose?: () => void;
}

export const EditorInspectorPanel: React.FC<EditorInspectorPanelProps> = ({
  selection,
  onUpdateTransform,
  onApplyMaterial,
  onUpdateMaterialProperties,
  onOpenEditTextModal,
  onOpenAddTextModal,
  onClose,
}) => {
  const [uniformScale, setUniformScale] = useState<boolean>(false);
  const [matDropdownOpen, setMatDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const px = selection?.position[0] ?? 0;
  const py = selection?.position[1] ?? 0;
  const pz = selection?.position[2] ?? 0;

  const rx = selection?.rotation[0] ?? 0;
  const ry = selection?.rotation[1] ?? 0;
  const rz = selection?.rotation[2] ?? 0;

  const sx = selection?.scale[0] ?? 1;
  const sy = selection?.scale[1] ?? 1;
  const sz = selection?.scale[2] ?? 1;

  const handlePosChange = (axis: 0 | 1 | 2, val: number | null) => {
    if (!selection || val === null) return;
    const next: [number, number, number] = [px, py, pz];
    next[axis] = val;
    onUpdateTransform(next, [rx, ry, rz], [sx, sy, sz]);
  };

  const handleRotChange = (axis: 0 | 1 | 2, val: number | null) => {
    if (!selection || val === null) return;
    const next: [number, number, number] = [rx, ry, rz];
    next[axis] = val;
    onUpdateTransform([px, py, pz], next, [sx, sy, sz]);
  };

  const handleScaleChange = (axis: 0 | 1 | 2, val: number | null) => {
    if (!selection || val === null || val <= 0) return;
    const next: [number, number, number] = [sx, sy, sz];
    if (uniformScale) {
      const ratio = val / (next[axis] || 1);
      next[0] = Number((next[0] * ratio).toFixed(3));
      next[1] = Number((next[1] * ratio).toFixed(3));
      next[2] = Number((next[2] * ratio).toFixed(3));
    } else {
      next[axis] = val;
    }
    onUpdateTransform([px, py, pz], [rx, ry, rz], next);
  };

  const currentMat = selection
    ? SIGNBOARD_MATERIALS.find((m) => m.id === selection.materialId)
    : undefined;

  return (
    <div className="flex flex-col space-y-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs select-none text-xs text-slate-700">
      {/* Header Panel */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 overflow-hidden pr-2">
          {selection ? (
            selection.isText ? (
              <div className="p-1.5 rounded-lg bg-teal-50 text-[#00b4b6]">
                <Type className="w-4 h-4" />
              </div>
            ) : (
              <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                <Layers className="w-4 h-4" />
              </div>
            )
          ) : (
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
              <Layers className="w-4 h-4" />
            </div>
          )}
          <div className="overflow-hidden">
            <h4 className="font-bold text-slate-800 truncate text-xs">
              {selection?.name || "Bảng Biến Đổi & Vật Liệu"}
            </h4>
            <span className="text-[10px] text-slate-500 font-semibold uppercase">
              {selection?.type || "Chưa chọn vật thể trên 3D"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {selection && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              title="Bỏ chọn vật thể"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* CHIA THÀNH 2 CỘT: 1 BÊN TRANSFORM PANEL, 1 BÊN VẬT LIỆU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-0.5">
        {/* CỘT 1: TRANSFORM PANEL (VỊ TRÍ, XOAY, SCALE) */}
        <div className="space-y-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
          <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200/60">
            <Move className="w-3.5 h-3.5 text-[#00b4b6]" />
            <span>Biến Đổi (Transform)</span>
          </div>

          {/* 1. Vị trí Position */}
          <div>
            <div className="flex items-center gap-1 text-slate-700 font-semibold mb-1 text-[11px]">
              <span className="text-sky-600 font-bold">Vị trí</span>
              <span className="text-slate-400 font-normal">(mét)</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="flex items-center bg-white rounded-lg px-1.5 py-0.5 border border-red-200">
                <span className="font-bold text-red-500 mr-1 text-[11px]">X</span>
                <InputNumber
                  size="small"
                  disabled={!selection}
                  value={Number(px.toFixed(3))}
                  step={0.05}
                  onChange={(v) => handlePosChange(0, v)}
                  className="w-full bg-transparent border-0 p-0 text-xs font-semibold"
                />
              </div>
              <div className="flex items-center bg-white rounded-lg px-1.5 py-0.5 border border-emerald-200">
                <span className="font-bold text-emerald-600 mr-1 text-[11px]">Y</span>
                <InputNumber
                  size="small"
                  disabled={!selection}
                  value={Number(py.toFixed(3))}
                  step={0.05}
                  onChange={(v) => handlePosChange(1, v)}
                  className="w-full bg-transparent border-0 p-0 text-xs font-semibold"
                />
              </div>
              <div className="flex items-center bg-white rounded-lg px-1.5 py-0.5 border border-blue-200">
                <span className="font-bold text-blue-500 mr-1 text-[11px]">Z</span>
                <InputNumber
                  size="small"
                  disabled={!selection}
                  value={Number(pz.toFixed(3))}
                  step={0.05}
                  onChange={(v) => handlePosChange(2, v)}
                  className="w-full bg-transparent border-0 p-0 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* 2. Xoay góc Rotation */}
          <div>
            <div className="flex items-center gap-1 text-slate-700 font-semibold mb-1 text-[11px]">
              <span className="text-emerald-600 font-bold">Xoay góc</span>
              <span className="text-slate-400 font-normal">(độ)</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="flex items-center bg-white rounded-lg px-1.5 py-0.5 border border-red-200">
                <span className="font-bold text-red-500 mr-1 text-[11px]">X°</span>
                <InputNumber
                  size="small"
                  disabled={!selection}
                  value={Math.round(rx)}
                  step={5}
                  onChange={(v) => handleRotChange(0, v)}
                  className="w-full bg-transparent border-0 p-0 text-xs font-semibold"
                />
              </div>
              <div className="flex items-center bg-white rounded-lg px-1.5 py-0.5 border border-emerald-200">
                <span className="font-bold text-emerald-600 mr-1 text-[11px]">Y°</span>
                <InputNumber
                  size="small"
                  disabled={!selection}
                  value={Math.round(ry)}
                  step={5}
                  onChange={(v) => handleRotChange(1, v)}
                  className="w-full bg-transparent border-0 p-0 text-xs font-semibold"
                />
              </div>
              <div className="flex items-center bg-white rounded-lg px-1.5 py-0.5 border border-blue-200">
                <span className="font-bold text-blue-500 mr-1 text-[11px]">Z°</span>
                <InputNumber
                  size="small"
                  disabled={!selection}
                  value={Math.round(rz)}
                  step={5}
                  onChange={(v) => handleRotChange(2, v)}
                  className="w-full bg-transparent border-0 p-0 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* 3. Kích thước Scale */}
          <div>
            <div className="flex items-center justify-between text-slate-700 font-semibold mb-1 text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-amber-500 font-bold">Scale</span>
                <span className="text-slate-400 font-normal">(Kéo dãn)</span>
              </div>
              <Tooltip title={uniformScale ? "Khóa tỷ lệ đồng dạng" : "Kéo dãn tự do từng trục"}>
                <button
                  type="button"
                  disabled={!selection}
                  onClick={() => setUniformScale(!uniformScale)}
                  className={`p-0.5 rounded cursor-pointer transition-colors ${
                    uniformScale ? "text-[#00b4b6] bg-teal-50" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {uniformScale ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </button>
              </Tooltip>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="flex items-center bg-white rounded-lg px-1.5 py-0.5 border border-red-200">
                <span className="font-bold text-red-500 mr-1 text-[11px]">Sx</span>
                <InputNumber
                  size="small"
                  disabled={!selection}
                  value={Number(sx.toFixed(2))}
                  step={0.1}
                  min={0.01}
                  onChange={(v) => handleScaleChange(0, v)}
                  className="w-full bg-transparent border-0 p-0 text-xs font-semibold"
                />
              </div>
              <div className="flex items-center bg-white rounded-lg px-1.5 py-0.5 border border-emerald-200">
                <span className="font-bold text-emerald-600 mr-1 text-[11px]">Sy</span>
                <InputNumber
                  size="small"
                  disabled={!selection}
                  value={Number(sy.toFixed(2))}
                  step={0.1}
                  min={0.01}
                  onChange={(v) => handleScaleChange(1, v)}
                  className="w-full bg-transparent border-0 p-0 text-xs font-semibold"
                />
              </div>
              <div className="flex items-center bg-white rounded-lg px-1.5 py-0.5 border border-blue-200">
                <span className="font-bold text-blue-500 mr-1 text-[11px]">Sz</span>
                <InputNumber
                  size="small"
                  disabled={!selection}
                  value={Number(sz.toFixed(2))}
                  step={0.1}
                  min={0.01}
                  onChange={(v) => handleScaleChange(2, v)}
                  className="w-full bg-transparent border-0 p-0 text-xs font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CỘT 2: VẬT LIỆU ADMAKE (DROPDOWN CHIA LÀM 2 CỘT) */}
        <div className="space-y-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-200/60">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#00b4b6]" />
                <span>Vật Liệu Admake (PBR)</span>
              </span>
              {currentMat?.category_vn && (
                <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-semibold border border-teal-200">
                  {currentMat.category_vn}
                </span>
              )}
            </div>

            {/* Dropdown vật liệu dạng Popover chia làm 2 cột */}
            <Popover
              open={matDropdownOpen && !!selection}
              onOpenChange={(v) => { if (selection) setMatDropdownOpen(v); }}
              trigger="click"
              placement="bottomRight"
              overlayInnerStyle={{ padding: "8px", borderRadius: "14px" }}
              content={
                <div className="w-[330px] sm:w-[390px] max-h-[380px] overflow-y-auto custom-scrollbar p-1 select-none">
                  {/* Ô tìm kiếm nhanh */}
                  <div className="mb-2 sticky top-0 bg-white pt-0.5 pb-1.5 z-10 border-b border-slate-100">
                    <Input
                      placeholder="Tìm nhanh vật liệu (Alu, Inox, Mica, LED...)"
                      prefix={<Search className="w-3.5 h-3.5 text-slate-400" />}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      size="small"
                      allowClear
                      className="rounded-lg text-xs"
                    />
                  </div>

                  {MATERIAL_CATEGORIES.map((cat) => {
                    const items = SIGNBOARD_MATERIALS.filter((m) => {
                      if (m.category !== cat.key) return false;
                      if (!searchQuery) return true;
                      return m.name.toLowerCase().includes(searchQuery.toLowerCase());
                    });
                    if (items.length === 0) return null;
                    return (
                      <div key={cat.key} className="mb-2.5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase px-1 mb-1 tracking-wider flex items-center gap-1">
                          <span>{cat.title}</span>
                          <span className="text-slate-400 font-normal">({items.length})</span>
                        </div>
                        {/* DROPDOWN VẬT LIỆU CHIA LÀM 2 CỘT */}
                        <div className="grid grid-cols-2 gap-1.5">
                          {items.map((m) => {
                            const isSelected =
                              selection?.materialId === m.id || currentMat?.id === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  onApplyMaterial(m.id);
                                  setMatDropdownOpen(false);
                                }}
                                className={`group relative flex items-center h-9 sm:h-10 rounded-lg border text-left transition-all cursor-pointer overflow-hidden p-0 ${
                                  isSelected
                                    ? "bg-teal-50 border-[#00b4b6] text-teal-950 font-bold shadow-2xs ring-1 ring-[#00b4b6]"
                                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800"
                                }`}
                                title={m.name}
                              >
                                {/* Hình vuông height 100% canh lề trái */}
                                <div
                                  className="h-full aspect-square shrink-0 border-r border-slate-200 flex items-center justify-center shadow-inner"
                                  style={{ backgroundColor: m.color }}
                                />
                                <div className="min-w-0 flex-1 px-2 py-0.5">
                                  <span className="text-[11.5px] truncate font-semibold block leading-tight">
                                    {m.name}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              }
            >
              <button
                type="button"
                disabled={!selection}
                className={`w-full flex items-center h-10 rounded-xl border text-xs transition-all cursor-pointer overflow-hidden p-0 ${
                  selection
                    ? "bg-white border-slate-300 hover:border-[#00b4b6] shadow-2xs"
                    : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {/* Hình vuông height 100% canh lề trái */}
                <div
                  className="h-full aspect-square shrink-0 border-r border-slate-200 flex items-center justify-center shadow-inner"
                  style={{ backgroundColor: currentMat?.color || "#cbd5e1" }}
                />
                <div className="flex-1 min-w-0 px-2.5 text-left">
                  <span className="font-semibold text-slate-800 truncate block">
                    {currentMat?.name ||
                      (selection ? "Chọn vật liệu cho vật thể này..." : "Chưa chọn vật thể")}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2.5" />
              </button>
            </Popover>

            {/* Bộ Slider thông số PBR & Texture Map (Độ bóng, nhám, kim loại, trong suốt, texture map) */}
            {selection && (
              <MaterialPbrSliders
                materialId={selection?.materialId || currentMat?.id || (selection ? `mesh_${selection.uuid}` : undefined)}
                currentMaterial={currentMat}
                onChange={onUpdateMaterialProperties}
                disabled={!selection}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
