/**
 * ElementDetailPricing.tsx - Khung chi tiết kích thước cấu kiện khi được chọn trong 3D
 * Hiển thị Dx, Dy, Dz, thể tích V, diện tích bề mặt (nếu là dạng tấm mỏng).
 * Nếu là chữ 3D: Cung cấp form điều chỉnh nội dung chữ, font, độ nổi.
 */

import React, { useState, useEffect, useMemo } from "react";
import { Box } from "lucide-react";
import type { SelectedMeshInfo, Text3DParams } from "../editor3d/editorTypes";
import type { Signboard3DModel } from "../../../services/genaiSignboard.service";
import { Text3DSettingsForm } from "../editor3d/Text3DSettingsForm";

interface ElementDetailPricingProps {
  selection: SelectedMeshInfo;
  model3D: Signboard3DModel | null;
  onDeselect?: () => void;
  onUpdateTextParams?: (params: Text3DParams) => void;
}

export const ElementDetailPricing: React.FC<ElementDetailPricingProps> = ({
  selection,
  model3D,
  onDeselect,
  onUpdateTextParams,
}) => {
  // Nhận diện nếu cấu kiện là Chữ 3D nổi
  const isTextObject = Boolean(
    selection.isText ||
    selection.textParams ||
    selection.type === "text3d" ||
    selection.name?.toLowerCase().includes("chữ")
  );

  const [textParams, setTextParams] = useState<Text3DParams>(() => {
    return (
      selection.textParams || {
        text: selection.name?.replace(/^Chữ 3D:\s*"?|"?$/g, "") || "DUSEK DESIGN",
        fontFamily: "be-vietnam-pro",
        fontSize: 0.25,
        extrude: 0.04,
        fontStyle: "normal",
        fontWeight: "bold",
        bevelType: "round",
        bevelSize: 0.008,
        color: selection.color || "#d97706",
        materialId: selection.materialId || "inox_gold_mirror",
        glow: false,
      }
    );
  });

  useEffect(() => {
    if (selection.textParams) {
      setTextParams(selection.textParams);
    }
  }, [selection.textParams]);

  const handleTextParamsChange = (newParams: Text3DParams) => {
    setTextParams(newParams);
    onUpdateTextParams?.(newParams);
  };

  // 1. Tính toán kích thước hình học
  const elementDims = useMemo(() => {
    let dx = Math.abs(selection.scale[0]) || 1;
    let dy = Math.abs(selection.scale[1]) || 1;
    let dz = Math.abs(selection.scale[2]) || 0.05;

    if (selection.elementIndex !== undefined && model3D?.elements?.[selection.elementIndex]) {
      const el = model3D.elements[selection.elementIndex];
      if (el.base && el.base.length >= 3 && el.extrude) {
        const xs = el.base.map((p) => p[0]);
        const ys = el.base.map((p) => p[1]);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        dx = Math.max(0.01, (maxX - minX) * (selection.scale[0] || 1));
        dy = Math.max(0.01, (maxY - minY) * (selection.scale[1] || 1));
        dz = Math.max(
          0.01,
          Math.sqrt(el.extrude[0] ** 2 + el.extrude[1] ** 2 + el.extrude[2] ** 2) *
            (selection.scale[2] || 1)
        );
      } else if (el.scale) {
        dx = Math.abs(el.scale[0] * selection.scale[0]);
        dy = Math.abs(el.scale[1] * selection.scale[1]);
        dz = Math.abs(el.scale[2] * selection.scale[2]);
      }
    }

    dx = Math.round(dx * 1000) / 1000;
    dy = Math.round(dy * 1000) / 1000;
    dz = Math.round(dz * 1000) / 1000;

    const volume = Math.round(dx * dy * dz * 1000) / 1000;
    const sorted = [dx, dy, dz].sort((a, b) => b - a);
    const max1 = sorted[0];
    const max2 = sorted[1];
    const minDim = sorted[2];

    const isThinSheet =
      minDim <= 0.06 || /mặt|alu|bạt|hiflex|tấm|mica|panel|nền|bảng/i.test(selection.name);

    const surfaceAreaOneSide = Math.round(max1 * max2 * 100) / 100;
    const surfaceAreaBothSides = Math.round(surfaceAreaOneSide * 2 * 100) / 100;

    return {
      dx,
      dy,
      dz,
      volume,
      isThinSheet,
      surfaceAreaOneSide,
      surfaceAreaBothSides,
      maxDim: max1,
    };
  }, [selection, model3D]);

  return (
    <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
      {/* Tiêu đề cấu kiện */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 text-[#00b4b6]">
            <Box className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-800 text-xs truncate">
            {isTextObject ? `Chữ 3D: "${textParams.text}"` : (selection.name || "Cấu kiện 3D")}
          </span>
          <span className="text-[10px] text-slate-400 font-mono shrink-0">
            ({isTextObject ? "text3d" : selection.type})
          </span>
        </div>
        {onDeselect && (
          <button
            type="button"
            onClick={onDeselect}
            className="text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-slate-100 shrink-0"
          >
            Bỏ chọn
          </button>
        )}
      </div>

      {/* 1. Nếu là chữ 3D: Form cài đặt chữ 3D */}
      {isTextObject ? (
        <Text3DSettingsForm
          params={textParams}
          onChange={handleTextParamsChange}
        />
      ) : (
        /* Kích thước & Thể tích & Diện tích tấm mỏng gom gọn trên 1 dòng duy nhất */
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] flex items-center justify-between gap-2 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">📐 KT:</span>
            <span className="font-bold text-slate-800">
              {elementDims.dx}m × {elementDims.dy}m × {elementDims.dz}m
            </span>
            <span className="text-[10px] text-slate-400 font-medium">({elementDims.volume}m³)</span>
          </div>

          <div className="w-px h-3.5 bg-slate-200 shrink-0" />

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">📄 DT:</span>
            <span className="font-bold text-teal-700">
              1 mặt: {elementDims.surfaceAreaOneSide}m²
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              (2 mặt: {elementDims.surfaceAreaBothSides}m²)
            </span>
            {elementDims.isThinSheet && (
              <span className="text-[9px] bg-teal-50 text-teal-700 border border-teal-200 px-1 py-0.2 rounded font-semibold ml-0.5">
                Tấm mỏng
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
