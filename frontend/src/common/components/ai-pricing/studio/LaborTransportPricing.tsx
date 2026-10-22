/**
 * LaborTransportPricing.tsx - Khối tính Nhân công (số công x đơn giá),
 * Vận chuyển (số km x đơn giá), Slider hao hụt (0% - 100%) và Tổng cộng giá vốn.
 * Font-weight 500 (font-medium) toàn diện
 */

import React, { useState, useEffect } from "react";
import { Slider, InputNumber, Tooltip } from "antd";
import { HardHat, Truck, Percent, Package, Scale, Info } from "lucide-react";
import { formatVND } from "../../../services/aiPricingEngine";

interface LaborTransportPricingProps {
  laborDays: number;
  laborUnitPrice: number;
  onLaborDaysChange: (val: number | null) => void;
  onLaborRateChange: (val: number | null) => void;
  laborCost: number;

  transportKm: number;
  transportUnitPrice: number;
  onTransportKmChange: (val: number | null) => void;
  onTransportRateChange: (val: number | null) => void;
  transportCost: number;

  scrapPercent: number;
  onScrapChange: (val: number) => void;
  scrapAmount: number;
  materialsCost?: number;

  shippingWeightText?: string;
  packageDimensions?: string;
  recommendedVehicle?: string;
  onShippingWeightChange?: (val: string) => void;
  onPackageDimensionsChange?: (val: string) => void;
  onRecommendedVehicleChange?: (val: string) => void;

  totalProductionCost: number;
}

export const LaborTransportPricing: React.FC<LaborTransportPricingProps> = ({
  laborDays,
  laborUnitPrice,
  onLaborDaysChange,
  onLaborRateChange,
  laborCost,
  transportKm,
  transportUnitPrice,
  onTransportKmChange,
  onTransportRateChange,
  transportCost,
  scrapPercent,
  onScrapChange,
  scrapAmount,
  materialsCost = 0,
  shippingWeightText,
  packageDimensions,
  recommendedVehicle,
  onShippingWeightChange,
  onPackageDimensionsChange,
  onRecommendedVehicleChange,
  totalProductionCost,
}) => {
  const [weight, setWeight] = useState<string>(() => {
    try {
      return localStorage.getItem("admake_logistics_weight") || shippingWeightText || "";
    } catch {
      return shippingWeightText || "";
    }
  });

  const [pkgDims, setPkgDims] = useState<string>(() => {
    try {
      return localStorage.getItem("admake_logistics_pkg_dims") || packageDimensions || "";
    } catch {
      return packageDimensions || "";
    }
  });

  const [vehicle, setVehicle] = useState<string>(() => {
    try {
      return localStorage.getItem("admake_logistics_vehicle") || recommendedVehicle || "";
    } catch {
      return recommendedVehicle || "";
    }
  });

  useEffect(() => {
    if (shippingWeightText !== undefined && shippingWeightText !== "") {
      setWeight(shippingWeightText);
    }
  }, [shippingWeightText]);

  useEffect(() => {
    if (packageDimensions !== undefined && packageDimensions !== "") {
      setPkgDims(packageDimensions);
    }
  }, [packageDimensions]);

  useEffect(() => {
    if (recommendedVehicle !== undefined && recommendedVehicle !== "") {
      setVehicle(recommendedVehicle);
    }
  }, [recommendedVehicle]);

  const handleWeightChange = (val: string) => {
    setWeight(val);
    try { localStorage.setItem("admake_logistics_weight", val); } catch {}
    onShippingWeightChange?.(val);
  };

  const handlePkgDimsChange = (val: string) => {
    setPkgDims(val);
    try { localStorage.setItem("admake_logistics_pkg_dims", val); } catch {}
    onPackageDimensionsChange?.(val);
  };

  const handleVehicleChange = (val: string) => {
    setVehicle(val);
    try { localStorage.setItem("admake_logistics_vehicle", val); } catch {}
    onRecommendedVehicleChange?.(val);
  };
  return (
    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2 text-xs font-medium">
      {/* 1. Nhân công sản xuất & lắp đặt (2 input: số công x đơn giá) */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70 font-medium">
        <div className="flex items-center gap-1.5 text-slate-700 font-medium text-[11px]">
          <HardHat className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Nhân công sản xuất & lắp đặt:</span>
        </div>
        <span className="font-medium text-slate-800">{formatVND(laborCost)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 font-medium">
        <div>
          <label className="text-[10px] text-slate-500 font-medium block mb-1">
            Số công thợ:
          </label>
          <InputNumber
            value={laborDays}
            min={1}
            step={1}
            onChange={onLaborDaysChange}
            size="small"
            className="w-full text-xs font-medium"
            addonAfter="công"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 font-medium block mb-1">
            Đơn giá / công (VNĐ):
          </label>
          <InputNumber
            value={laborUnitPrice}
            min={50000}
            step={20000}
            formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, "") || 0)}
            onChange={onLaborRateChange}
            size="small"
            className="w-full text-xs font-medium"
          />
        </div>
      </div>

      {/* 2. Vận chuyển: số km x đơn giá */}
      <div className="pt-2 border-t border-slate-200/70 space-y-1.5 font-medium">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium text-[11px]">
            <Truck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span>Vận chuyển công trình:</span>
          </div>
          <span className="font-medium text-slate-800">{formatVND(transportCost)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 font-medium">
          <div>
            <label className="text-[10px] text-slate-500 font-medium block mb-1">
              Cự ly (km):
            </label>
            <InputNumber
              value={transportKm}
              min={1}
              step={1}
              onChange={onTransportKmChange}
              size="small"
              className="w-full text-xs font-medium"
              addonAfter="km"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-medium block mb-1">
              Đơn giá / km (VNĐ):
            </label>
            <InputNumber
              value={transportUnitPrice}
              min={5000}
              step={1000}
              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, "") || 0)}
              onChange={onTransportRateChange}
              size="small"
              className="w-full text-xs font-medium"
            />
          </div>
        </div>

        {/* Thông tin đóng gói, trọng lượng & xe vận chuyển: cho phép người dùng tự điền thông tin */}
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 space-y-2 text-[11px] font-medium text-slate-600 mt-2 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-sky-500" />
              <span>Quy cách đóng gói & Vận tải</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              (Người dùng tự chỉnh sửa)
            </span>
          </div>

          {/* 1. Trọng lượng */}
          <div className="flex items-center justify-between gap-2">
            <label className="text-slate-600 flex items-center gap-1 shrink-0 text-[11px] font-medium">
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              <span>Trọng lượng:</span>
            </label>
            <input
              type="text"
              value={weight}
              onChange={(e) => handleWeightChange(e.target.value)}
              placeholder="VD: 899 kg"
              className="flex-1 min-w-0 max-w-[280px] text-right font-medium text-slate-800 text-[11px] bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#00b4b6] focus:ring-1 focus:ring-[#00b4b6] rounded-lg px-2 py-1 focus:outline-none transition-all shadow-2xs"
            />
          </div>

          {/* 2. Đóng gói */}
          <div className="flex items-center justify-between gap-2">
            <label className="text-slate-600 flex items-center gap-1 shrink-0 text-[11px] font-medium">
              <Package className="w-3.5 h-3.5 text-indigo-500" />
              <span>Đóng gói:</span>
            </label>
            <input
              type="text"
              value={pkgDims}
              onChange={(e) => handlePkgDimsChange(e.target.value)}
              placeholder="VD: 6.0m × 3.0m × 0.45m (chia 2 module)"
              className="flex-1 min-w-0 max-w-[280px] text-right font-medium text-slate-800 text-[11px] bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#00b4b6] focus:ring-1 focus:ring-[#00b4b6] rounded-lg px-2 py-1 focus:outline-none transition-all shadow-2xs"
            />
          </div>

          {/* 3. Đề xuất xe */}
          <div className="flex items-center justify-between gap-2">
            <label className="text-slate-600 flex items-center gap-1 shrink-0 text-[11px] font-medium">
              <Truck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Đề xuất xe:</span>
            </label>
            <input
              type="text"
              value={vehicle}
              onChange={(e) => handleVehicleChange(e.target.value)}
              placeholder="VD: Xe cẩu tự hành 5 - 8 tấn"
              className="flex-1 min-w-0 max-w-[280px] text-right font-medium text-emerald-700 text-[11px] bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#00b4b6] focus:ring-1 focus:ring-[#00b4b6] rounded-lg px-2 py-1 focus:outline-none transition-all shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* 3. % Hao hụt vật tư: Slider kéo từ 0% đến 100% */}
      <div className="pt-2 border-t border-slate-200/70 space-y-1 font-medium">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 text-slate-700 font-medium">
            <Percent className="w-3 h-3 text-rose-500" />
            <span>Hao hụt vật tư ({scrapPercent}%):</span>
            <Tooltip
              title={`Công thức: Tổng chi phí vật tư (${formatVND(materialsCost)}) × ${scrapPercent}% = +${formatVND(scrapAmount)}`}
            >
              <Info className="w-3 h-3 text-slate-400 hover:text-slate-600 cursor-pointer" />
            </Tooltip>
          </div>
          <span className="font-medium text-rose-600">+{formatVND(scrapAmount)}</span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={scrapPercent}
          onChange={onScrapChange}
          className="m-0"
        />
      </div>

      {/* 4. Tổng cộng giá vốn dự toán */}
      <div className="pt-2 border-t border-slate-300 flex items-center justify-between font-medium">
        <div>
          <span className="font-medium text-slate-800 text-xs block">
            Tổng cộng giá vốn:
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Đã gồm nhân công, xe & hao hụt
          </span>
        </div>
        <span className="font-medium text-[#00b4b6] text-base">
          {formatVND(totalProductionCost)}
        </span>
      </div>
    </div>
  );
};
