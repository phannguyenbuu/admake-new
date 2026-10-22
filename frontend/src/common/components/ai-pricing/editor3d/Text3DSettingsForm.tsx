/**
 * Text3DSettingsForm.tsx - Form cài đặt tham số Chữ 3D nhúng trực tiếp vào panel bên trái
 * Kiểu dáng, Cao chữ (mm, max 10000), Dày chân (mm), Kiểu bo viền thu gọn nằm trọn trên 1 hàng
 * Hỗ trợ chọn màu Xanh ADMAKE (#00B4B6) và Inox Vàng Gương 304 chuẩn phản chiếu
 * Font-weight 500 (font-medium) toàn diện
 */

import React, { useState, useEffect } from "react";
import { Input, Select, InputNumber, Tooltip, Tag } from "antd";
import { Sparkles, FileText, Bold, Italic, Layers, Palette } from "lucide-react";
import type { Text3DParams, BevelType, FontOption } from "./editorTypes";
import { CORE_100_FONTS, fetchAllSignageFonts } from "./fontCatalog";
import { SIGNBOARD_MATERIALS } from "./materialsCatalog";

interface Text3DSettingsFormProps {
  params: Text3DParams;
  onChange: (newParams: Text3DParams) => void;
}

export const Text3DSettingsForm: React.FC<Text3DSettingsFormProps> = ({
  params,
  onChange,
}) => {
  const [fonts, setFonts] = useState<FontOption[]>(CORE_100_FONTS);

  useEffect(() => {
    fetchAllSignageFonts().then(setFonts);
  }, []);

  const handleFieldChange = <K extends keyof Text3DParams>(key: K, val: Text3DParams[K]) => {
    onChange({ ...params, [key]: val });
  };

  const handleMaterialChange = (matId: string) => {
    const found = SIGNBOARD_MATERIALS.find((m) => m.id === matId);
    onChange({
      ...params,
      materialId: matId,
      color: found?.color || params.color,
      glow: Boolean(found?.glow),
    });
  };

  const groupedFonts = [
    { label: "✨ Không Chân Hiện Đại (Sans-serif)", options: fonts.filter((f) => f.category === "sans-serif") },
    { label: "👑 Chữ Nổi Biển Hiệu & CNC (Display)", options: fonts.filter((f) => f.category === "display") },
    { label: "🏛️ Có Chân Sang Trọng & Spa (Serif)", options: fonts.filter((f) => f.category === "serif") },
    { label: "✒️ Uốn Lượn & Nghệ Thuật (Script)", options: fonts.filter((f) => f.category === "script") },
    { label: "🏗️ Khối Hộp Công Nghiệp (Slab)", options: fonts.filter((f) => f.category === "slab") },
    { label: "📦 Font Tuỳ Chỉnh Backend", options: fonts.filter((f) => f.category === "custom") },
  ];

  const fontSizeMm = Math.round((params.fontSize || 0.25) * 1000);
  const extrudeMm = Math.round((params.extrude || 0.04) * 1000);
  const isBold = params.fontWeight === "bold" || params.fontWeight === "600" || params.fontWeight === "800";
  const isItalic = params.fontStyle === "italic";

  return (
    <div className="space-y-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-medium">
      {/* 1. Nội dung chữ */}
      <div>
        <label className="font-medium text-slate-800 flex items-center gap-1.5 mb-1 text-[11px]">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>Nội dung chữ nổi:</span>
        </label>
        <Input
          size="middle"
          value={params.text || "ADMAKE"}
          onChange={(e) => handleFieldChange("text", e.target.value)}
          placeholder="ADMAKE"
          className="font-medium text-sm"
        />
      </div>

      {/* 2. Chọn 100 Font chữ */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="font-medium text-slate-800 flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Bộ Font chữ:</span>
          </label>
          <Tag color="blue" className="text-[10px] font-medium m-0">Chuẩn ADMAKE</Tag>
        </div>
        <Select
          size="small"
          value={params.fontFamily || "admake-pro"}
          onChange={(val) => handleFieldChange("fontFamily", val)}
          showSearch
          optionFilterProp="label"
          className="w-full text-xs font-medium"
          options={groupedFonts.map((g) => ({
            label: g.label,
            options: g.options.map((f) => ({
              label: `${f.name} - ${f.best_for}`,
              value: f.id,
            })),
          }))}
        />
      </div>

      {/* 3. ĐÚNG 1 HÀNG DUY NHẤT: Kiểu dáng | Cao chữ (mm, max 10000) | Dày chân (mm) | Bo viền */}
      <div className="pt-1 border-t border-slate-200/70">
        <div className="grid grid-cols-12 gap-1 items-end">
          {/* Cột 1: Kiểu dáng (B & I) - 3 cols */}
          <div className="col-span-3 flex flex-col gap-0.5">
            <span className="text-[10px] font-medium text-slate-600 truncate">Kiểu dáng</span>
            <div className="flex items-center gap-1">
              <Tooltip title={isBold ? "Đậm (Bold)" : "Thường"}>
                <button
                  type="button"
                  onClick={() => handleFieldChange("fontWeight", isBold ? "normal" : "bold")}
                  className={`flex-1 h-7 rounded flex items-center justify-center cursor-pointer transition-all border ${
                    isBold
                      ? "bg-blue-600 text-white border-blue-600 font-bold"
                      : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200 font-medium"
                  }`}
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip title={isItalic ? "Nghiêng (Italic)" : "Thẳng"}>
                <button
                  type="button"
                  onClick={() => handleFieldChange("fontStyle", isItalic ? "normal" : "italic")}
                  className={`flex-1 h-7 rounded flex items-center justify-center cursor-pointer transition-all border ${
                    isItalic
                      ? "bg-blue-600 text-white border-blue-600 font-bold"
                      : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200 font-medium"
                  }`}
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Cột 2: Cao chữ (mm) - Tối đa 10000mm - 3 cols */}
          <div className="col-span-3 flex flex-col gap-0.5">
            <span className="text-[10px] font-medium text-slate-600 truncate">Cao (mm)</span>
            <InputNumber
              size="small"
              min={10}
              max={10000}
              step={20}
              value={fontSizeMm}
              onChange={(val) => handleFieldChange("fontSize", Math.max(0.01, Math.min(10.0, (val || 250) / 1000)))}
              className="w-full text-[11px] font-medium"
              placeholder="250"
              title="Chiều cao chữ (mm, tối đa 10000mm)"
            />
          </div>

          {/* Cột 3: Dày chân (mm) - 2 cols */}
          <div className="col-span-2 flex flex-col gap-0.5">
            <span className="text-[10px] font-medium text-slate-600 truncate">Dày (mm)</span>
            <InputNumber
              size="small"
              min={2}
              max={1000}
              step={5}
              value={extrudeMm}
              onChange={(val) => handleFieldChange("extrude", Math.max(0.002, Math.min(1.0, (val || 40) / 1000)))}
              className="w-full text-[11px] font-medium"
              placeholder="40"
              title="Độ dày chân chữ (mm)"
            />
          </div>

          {/* Cột 4: Bo viền (4 icon bevel) - 4 cols */}
          <div className="col-span-4 flex flex-col gap-0.5">
            <span className="text-[10px] font-medium text-slate-600 truncate">Bo viền</span>
            <div className="grid grid-cols-4 gap-0.5">
              {[
                {
                  value: "round" as BevelType,
                  title: "Bo Tròn - Tự nhiên",
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 19V12a7 7 0 0 1 7-7h7" />
                    </svg>
                  ),
                },
                {
                  value: "chamfer" as BevelType,
                  title: "Vát Chéo 45°",
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 19V13L13 5H19" />
                    </svg>
                  ),
                },
                {
                  value: "round_soft" as BevelType,
                  title: "Bo Mềm Mịn",
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 19v-5c0-3 3-5 6-5s6-2 6-4h2" />
                    </svg>
                  ),
                },
                {
                  value: "none" as BevelType,
                  title: "Vuông Sắc Cạnh",
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 19V5h14" />
                    </svg>
                  ),
                },
              ].map((b) => {
                const isSelected = params.bevelType === b.value;
                return (
                  <Tooltip key={b.value} title={b.title}>
                    <button
                      type="button"
                      onClick={() => handleFieldChange("bevelType", b.value)}
                      className={`h-7 rounded flex items-center justify-center cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {b.icon}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Chọn Màu Sắc & Nút Xanh ADMAKE */}
      <div className="pt-1 border-t border-slate-200/70">
        <div className="flex items-center justify-between mb-1.5">
          <label className="font-medium text-slate-800 flex items-center gap-1 text-[11px]">
            <Palette className="w-3.5 h-3.5 text-teal-600" />
            <span>Màu sắc & Nhận diện:</span>
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-mono">{params.color || "#00b4b6"}</span>
            <input
              type="color"
              value={params.color || "#00b4b6"}
              onChange={(e) => handleFieldChange("color", e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border border-slate-300 p-0"
              title="Tuỳ chọn mã màu khác"
            />
          </div>
        </div>

        {/* Bảng màu nhanh: Xanh ADMAKE, Vàng Gương 304, Trắng Sứ, Đỏ, Đen */}
        <div className="grid grid-cols-5 gap-1">
          <button
            type="button"
            onClick={() => {
              handleFieldChange("color", "#00b4b6");
              handleMaterialChange("mica_admake_teal");
            }}
            className={`py-1 px-1 rounded flex flex-col items-center justify-center gap-0.5 cursor-pointer border transition-all text-[9.5px] font-medium ${
              params.color?.toLowerCase() === "#00b4b6"
                ? "bg-teal-50 border-[#00b4b6] text-teal-800 ring-1 ring-[#00b4b6]"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Xanh ADMAKE (#00B4B6)"
          >
            <span className="w-3.5 h-3.5 rounded-full bg-[#00b4b6] shadow-2xs border border-white" />
            <span className="truncate">Xanh Admake</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleFieldChange("color", "#f5c542");
              handleMaterialChange("inox_gold_mirror");
            }}
            className={`py-1 px-1 rounded flex flex-col items-center justify-center gap-0.5 cursor-pointer border transition-all text-[9.5px] font-medium ${
              params.color?.toLowerCase() === "#f5c542" || params.materialId === "inox_gold_mirror"
                ? "bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Inox Vàng Gương 304 (#F5C542)"
          >
            <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-2xs border border-white" />
            <span className="truncate">Vàng Gương</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleFieldChange("color", "#ffffff");
              handleMaterialChange("mica_white_milk");
            }}
            className={`py-1 px-1 rounded flex flex-col items-center justify-center gap-0.5 cursor-pointer border transition-all text-[9.5px] font-medium ${
              params.color?.toLowerCase() === "#ffffff"
                ? "bg-slate-100 border-slate-400 text-slate-800 ring-1 ring-slate-400"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Trắng Sứ (#FFFFFF)"
          >
            <span className="w-3.5 h-3.5 rounded-full bg-white shadow-2xs border border-slate-300" />
            <span className="truncate">Trắng Sứ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleFieldChange("color", "#ef4444");
              handleMaterialChange("mica_red");
            }}
            className={`py-1 px-1 rounded flex flex-col items-center justify-center gap-0.5 cursor-pointer border transition-all text-[9.5px] font-medium ${
              params.color?.toLowerCase() === "#ef4444"
                ? "bg-rose-50 border-rose-500 text-rose-800 ring-1 ring-rose-500"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Đỏ Cờ (#EF4444)"
          >
            <span className="w-3.5 h-3.5 rounded-full bg-[#ef4444] shadow-2xs border border-white" />
            <span className="truncate">Đỏ Cờ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleFieldChange("color", "#0f172a");
              handleMaterialChange("inox_black_titan");
            }}
            className={`py-1 px-1 rounded flex flex-col items-center justify-center gap-0.5 cursor-pointer border transition-all text-[9.5px] font-medium ${
              params.color?.toLowerCase() === "#0f172a"
                ? "bg-slate-800 border-slate-900 text-white ring-1 ring-slate-800"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Đen Titan (#0F172A)"
          >
            <span className="w-3.5 h-3.5 rounded-full bg-[#0f172a] shadow-2xs border border-white" />
            <span className="truncate">Đen Titan</span>
          </button>
        </div>
      </div>

      {/* 5. Chọn vật liệu mặt chữ */}
      <div>
        <label className="font-medium text-slate-800 flex items-center gap-1.5 mb-1 text-[11px]">
          <Layers className="w-3.5 h-3.5 text-teal-600" />
          <span>Vật liệu mặt chữ:</span>
        </label>
        <Select
          size="small"
          value={params.materialId || "mica_admake_teal"}
          onChange={handleMaterialChange}
          className="w-full text-xs font-medium"
          options={[
            {
              label: "👑 INOX CHỮ NỔI GƯƠNG",
              options: SIGNBOARD_MATERIALS.filter((m) => m.category === "inox").map((m) => ({
                label: m.name,
                value: m.id,
              })),
            },
            {
              label: "🎨 MICA ĐÀI LOAN HỘP",
              options: SIGNBOARD_MATERIALS.filter((m) => m.category === "mica").map((m) => ({
                label: m.name,
                value: m.id,
              })),
            },
            {
              label: "💡 ĐÈN LED PHÁT SÁNG",
              options: SIGNBOARD_MATERIALS.filter((m) => m.category === "led").map((m) => ({
                label: m.name,
                value: m.id,
              })),
            },
            {
              label: "✨ MẶT DỰNG ALU",
              options: SIGNBOARD_MATERIALS.filter((m) => m.category === "alu").map((m) => ({
                label: m.name,
                value: m.id,
              })),
            },
          ]}
        />
      </div>
    </div>
  );
};
