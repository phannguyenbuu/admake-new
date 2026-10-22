import React, { useState, useEffect, useCallback } from "react";
import { Box, Maximize2, Lock, Unlock, RotateCcw, Ruler, Check } from "lucide-react";
import type { Signboard3DModel } from "../../../services/genaiSignboard.service";

interface WholeModelSizePanelProps {
  model3D: Signboard3DModel | null;
  onUpdateDimensions: (width: number, height: number, depth: number) => void;
}

const COMMON_PRESETS = [
  { label: "Biển vẫy mini", width: 0.8, height: 0.6, depth: 0.15, depthDisplay: "15cm" },
  { label: "Cửa hàng tiêu chuẩn", width: 3.0, height: 1.2, depth: 0.2, depthDisplay: "20cm" },
  { label: "Mặt tiền phố vừa", width: 4.5, height: 1.8, depth: 0.2, depthDisplay: "20cm" },
  { label: "Mặt tiền công ty lớn", width: 6.0, height: 2.5, depth: 0.25, depthDisplay: "25cm" },
  { label: "Showroom / Tòa nhà", width: 8.0, height: 3.0, depth: 0.3, depthDisplay: "30cm" },
  { label: "Billboard ngoài trời", width: 12.0, height: 5.0, depth: 0.5, depthDisplay: "50cm" },
];

export const WholeModelSizePanel: React.FC<WholeModelSizePanelProps> = ({
  model3D,
  onUpdateDimensions,
}) => {
  const currentW = Number(model3D?.dimensions?.width) || 6.0;
  const currentH = Number(model3D?.dimensions?.height) || 2.5;
  const currentD = Number(model3D?.dimensions?.depth) || 0.25;

  const [width, setWidth] = useState<number>(currentW);
  const [height, setHeight] = useState<number>(currentH);
  const [depth, setDepth] = useState<number>(currentD);
  const [depthUnit, setDepthUnit] = useState<"cm" | "mm">(() => {
    try {
      return (localStorage.getItem("admake_depth_unit") as "cm" | "mm") || "cm";
    } catch {
      return "cm";
    }
  });
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [hasChanged, setHasChanged] = useState<boolean>(false);

  const handleSetDepthUnit = (u: "cm" | "mm") => {
    setDepthUnit(u);
    try {
      localStorage.setItem("admake_depth_unit", u);
    } catch {}
  };

  // Đồng bộ khi model3D bên ngoài thay đổi (ví dụ chọn mẫu mới)
  useEffect(() => {
    setWidth(currentW);
    setHeight(currentH);
    setDepth(currentD);
    setHasChanged(false);
  }, [currentW, currentH, currentD]);

  const handleWidthChange = (newVal: number) => {
    const val = Math.max(0.1, Number(newVal.toFixed(2)));
    if (isLocked && width > 0) {
      const ratio = val / width;
      const nextH = Math.max(0.1, Number((height * ratio).toFixed(2)));
      const nextD = Math.max(0.01, Number((depth * ratio).toFixed(3)));
      setWidth(val);
      setHeight(nextH);
      setDepth(nextD);
      onUpdateDimensions(val, nextH, nextD);
    } else {
      setWidth(val);
      onUpdateDimensions(val, height, depth);
    }
    setHasChanged(true);
  };

  const handleHeightChange = (newVal: number) => {
    const val = Math.max(0.1, Number(newVal.toFixed(2)));
    if (isLocked && height > 0) {
      const ratio = val / height;
      const nextW = Math.max(0.1, Number((width * ratio).toFixed(2)));
      const nextD = Math.max(0.01, Number((depth * ratio).toFixed(3)));
      setWidth(nextW);
      setHeight(val);
      setDepth(nextD);
      onUpdateDimensions(nextW, val, nextD);
    } else {
      setHeight(val);
      onUpdateDimensions(width, val, depth);
    }
    setHasChanged(true);
  };

  const handleDepthChange = (newVal: number) => {
    const val = Math.max(0.01, Number(newVal.toFixed(3)));
    if (isLocked && depth > 0) {
      const ratio = val / depth;
      const nextW = Math.max(0.1, Number((width * ratio).toFixed(2)));
      const nextH = Math.max(0.1, Number((height * ratio).toFixed(2)));
      setWidth(nextW);
      setHeight(nextH);
      setDepth(val);
      onUpdateDimensions(nextW, nextH, val);
    } else {
      setDepth(val);
      onUpdateDimensions(width, height, val);
    }
    setHasChanged(true);
  };

  const applyPreset = (preset: typeof COMMON_PRESETS[0]) => {
    setWidth(preset.width);
    setHeight(preset.height);
    setDepth(preset.depth);
    setHasChanged(true);
    onUpdateDimensions(preset.width, preset.height, preset.depth);
  };

  const area = (width * height).toFixed(2);
  const volume = (width * height * depth).toFixed(3);
  const perimeter = (2 * (width + height)).toFixed(2);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 space-y-3">
      {/* Header & Lock toggle */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#00b4b6]">
            <Ruler className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight m-0">
              Kích thước toàn khối 3D
            </h4>
            <p className="text-[10px] text-slate-400 m-0">
              Không chọn phần tử: chỉnh kích thước tổng thể biển hiệu
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsLocked(!isLocked)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
            isLocked
              ? "bg-teal-50 border-[#00b4b6] text-[#00b4b6]"
              : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"
          }`}
          title={isLocked ? "Đang khóa tỷ lệ đồng dạng" : "Mở khóa tỷ lệ tự do"}
        >
          {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          <span>{isLocked ? "Khóa tỷ lệ" : "Tỷ lệ tự do"}</span>
        </button>
      </div>

      {/* 3 Trục Kích Thước X, Y, Z */}
      <div className="grid grid-cols-3 gap-2">
        {/* X: Chiều Dài / Ngang */}
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Ngang (X)
            </span>
            <span className="text-[10px] font-normal text-slate-400">mét</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleWidthChange(width - 0.1)}
              className="w-5 h-6 rounded bg-white hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 cursor-pointer shadow-2xs"
            >
              -
            </button>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="50"
              value={width}
              onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 0.1)}
              className="w-full text-center font-bold text-xs bg-white border border-slate-200 rounded px-1 py-0.5 text-slate-800 focus:outline-none focus:border-[#00b4b6]"
            />
            <button
              type="button"
              onClick={() => handleWidthChange(width + 0.1)}
              className="w-5 h-6 rounded bg-white hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 cursor-pointer shadow-2xs"
            >
              +
            </button>
          </div>
        </div>

        {/* Y: Chiều Cao / Đứng */}
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Cao (Y)
            </span>
            <span className="text-[10px] font-normal text-slate-400">mét</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleHeightChange(height - 0.1)}
              className="w-5 h-6 rounded bg-white hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 cursor-pointer shadow-2xs"
            >
              -
            </button>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="30"
              value={height}
              onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 0.1)}
              className="w-full text-center font-bold text-xs bg-white border border-slate-200 rounded px-1 py-0.5 text-slate-800 focus:outline-none focus:border-[#00b4b6]"
            />
            <button
              type="button"
              onClick={() => handleHeightChange(height + 0.1)}
              className="w-5 h-6 rounded bg-white hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 cursor-pointer shadow-2xs"
            >
              +
            </button>
          </div>
        </div>

        {/* Z: Chiều Sâu / Độ Dày */}
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
            <span className="flex items-center gap-1 text-blue-600">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Sâu (Z)
            </span>
            <div className="flex items-center gap-0.5 bg-slate-200/90 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => handleSetDepthUnit("cm")}
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold cursor-pointer transition-all ${
                  depthUnit === "cm"
                    ? "bg-white text-blue-600 shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Đơn vị Centimet (cm)"
              >
                cm
              </button>
              <button
                type="button"
                onClick={() => handleSetDepthUnit("mm")}
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold cursor-pointer transition-all ${
                  depthUnit === "mm"
                    ? "bg-white text-blue-600 shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Đơn vị Milimet (mm)"
              >
                mm
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const step = 0.01;
                handleDepthChange(Math.max(0.005, depth - step));
              }}
              className="w-5 h-6 rounded bg-white hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 cursor-pointer shadow-2xs"
            >
              -
            </button>
            <input
              type="number"
              step={depthUnit === "cm" ? 0.5 : 5}
              min={depthUnit === "cm" ? 0.5 : 5}
              max={depthUnit === "cm" ? 500 : 5000}
              value={depthUnit === "cm" ? Number((depth * 100).toFixed(1)) : Math.round(depth * 1000)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  handleDepthChange(depthUnit === "cm" ? Math.max(0.005, val / 100) : Math.max(0.005, val / 1000));
                }
              }}
              className="w-full text-center font-bold text-xs bg-white border border-slate-200 rounded px-1 py-0.5 text-slate-800 focus:outline-none focus:border-[#00b4b6]"
            />
            <button
              type="button"
              onClick={() => {
                const step = 0.01;
                handleDepthChange(depth + step);
              }}
              className="w-5 h-6 rounded bg-white hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 cursor-pointer shadow-2xs"
            >
              +
            </button>
          </div>
          <div className="text-[9px] text-center text-slate-400 mt-1 font-medium">
            {depthUnit === "cm" ? `≈ ${Math.round(depth * 1000)} mm` : `≈ ${(depth * 100).toFixed(1)} cm`}
          </div>
        </div>
      </div>

      {/* Thông số tính toán tự động: Diện tích, Thể tích, Chu vi */}
      <div className="grid grid-cols-3 gap-1.5 p-2 bg-teal-50/60 rounded-xl border border-teal-100 text-center text-xs">
        <div>
          <span className="text-[10px] text-teal-700 block">Diện tích mặt</span>
          <strong className="text-teal-950 font-bold text-xs">{area} m²</strong>
        </div>
        <div>
          <span className="text-[10px] text-teal-700 block">Thể tích khối</span>
          <strong className="text-teal-950 font-bold text-xs">{volume} m³</strong>
        </div>
        <div>
          <span className="text-[10px] text-teal-700 block">Chu vi viền</span>
          <strong className="text-teal-950 font-bold text-xs">{perimeter} m</strong>
        </div>
      </div>

      {/* Gợi ý kích thước nhanh */}
      <div>
        <label className="text-[11px] font-semibold text-slate-600 mb-1.5 block">
          ⚡ Chọn nhanh kích thước tiêu chuẩn:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_PRESETS.map((p) => {
            const isSelected =
              Math.abs(width - p.width) < 0.01 &&
              Math.abs(height - p.height) < 0.01 &&
              Math.abs(depth - p.depth) < 0.01;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#00b4b6] text-white border-[#00b4b6] shadow-2xs font-bold"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                {p.label} ({p.width}×{p.height}m • {p.depthDisplay})
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-start gap-1.5">
        <span className="text-[#00b4b6] font-bold">💡</span>
        <span>
          Điều chỉnh kích thước toàn khối sẽ tự động co giãn kết cấu 3D, cập nhật khối lượng vật tư (m², mét dài, tấm) và dự toán tức thì. Nhấp chuột vào từng chữ/thanh để chỉnh riêng lẻ.
        </span>
      </div>
    </div>
  );
};
