/**
 * PricingLineItemsList.tsx - Danh sách các thành phần cấu thành dự toán
 * Hỗ trợ: Đơn vị tính, Khối lượng (tự động theo m2/m3/cái hoặc nhập tay), Đơn giá, Thành tiền
 * Checkbox (uncheck -> gạch ngang line-through), Nút "+" Thêm thành phần kiểu Kế toán
 * Font-weight 500 (font-medium) toàn diện
 */

import React, { useState } from "react";
import { Input, InputNumber, Button, Checkbox, message, Select } from "antd";
import { Plus, Trash2, X } from "lucide-react";
import { formatVND } from "../../../services/aiPricingEngine";
import type { PricingLineItem } from "./studioExportUtil";

interface PricingLineItemsListProps {
  items: PricingLineItem[];
  onToggleCheck: (id: string) => void;
  onAddCustomItem: (name: string, detail: string, total: number, quantity?: number, unit?: string, unitPrice?: number) => void;
  onDeleteCustomItem: (id: string) => void;
  onItemUnitChange?: (id: string, unit: string) => void;
  onItemQuantityChange?: (id: string, qty: number) => void;
  onItemUnitPriceChange?: (id: string, unitPrice: number) => void;
  onItemNameChange?: (id: string, name: string) => void;
  onItemDetailChange?: (id: string, detail: string) => void;
  highlightedItemId?: string | null;
}

const UNIT_OPTIONS = [
  { value: "m²", label: "m²" },
  { value: "m³", label: "m³" },
  { value: "tấm", label: "tấm" },
  { value: "mét dài", label: "mét dài" },
  { value: "cái", label: "cái" },
  { value: "bộ", label: "bộ" },
  { value: "cây (6m)", label: "cây (6m)" },
  { value: "hố móng", label: "hố móng" },
  { value: "khoán", label: "khoán" },
];

export const PricingLineItemsList: React.FC<PricingLineItemsListProps> = ({
  items,
  onToggleCheck,
  onAddCustomItem,
  onDeleteCustomItem,
  onItemUnitChange,
  onItemQuantityChange,
  onItemUnitPriceChange,
  onItemNameChange,
  onItemDetailChange,
  highlightedItemId,
}) => {
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);
  const [newCustomName, setNewCustomName] = useState<string>("");
  const [newCustomDetail, setNewCustomDetail] = useState<string>("");
  const [newCustomUnit, setNewCustomUnit] = useState<string>("cái");
  const [newCustomQty, setNewCustomQty] = useState<number>(1);
  const [newCustomUnitPrice, setNewCustomUnitPrice] = useState<number>(200000);

  const calculatedTotal = Math.round((newCustomQty || 1) * (newCustomUnitPrice || 0));

  const handleSave = () => {
    if (!newCustomName.trim()) {
      message.warning("Vui lòng nhập tên thành phần!");
      return;
    }
    onAddCustomItem(
      newCustomName.trim(),
      newCustomDetail.trim() || "Thành phần bổ sung",
      calculatedTotal,
      newCustomQty,
      newCustomUnit,
      newCustomUnitPrice
    );
    setNewCustomName("");
    setNewCustomDetail("");
    setNewCustomUnit("cái");
    setNewCustomQty(1);
    setNewCustomUnitPrice(200000);
    setIsAddingItem(false);
    message.success("✨ Đã thêm thành phần mới vào bảng giá!");
  };

  return (
    <div className="space-y-1.5 pt-1 border-t border-slate-100 font-medium">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-700 uppercase tracking-wide">
          📋 Thành Phần Cấu Thành
        </span>
        <button
          type="button"
          onClick={() => setIsAddingItem(!isAddingItem)}
          className="text-[11px] font-medium text-[#00b4b6] hover:text-[#009294] flex items-center gap-1 cursor-pointer transition-colors px-1.5 py-0.5 rounded-md hover:bg-teal-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm thành phần</span>
        </button>
      </div>

      {/* Form thêm dòng thành phần kiểu Kế toán */}
      {isAddingItem && (
        <div className="p-2.5 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2 text-xs font-medium">
          <div className="font-medium text-teal-900 text-[11px] flex items-center justify-between">
            <span>+ Bổ sung thành phần dự toán:</span>
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder="Tên thành phần (vd: Bản mã chân cột...)"
              value={newCustomName}
              onChange={(e) => setNewCustomName(e.target.value)}
              size="small"
              className="font-medium"
            />
            <Input
              placeholder="Quy cách / Diễn giải..."
              value={newCustomDetail}
              onChange={(e) => setNewCustomDetail(e.target.value)}
              size="small"
              className="font-medium"
            />
          </div>
          <div className="grid grid-cols-4 gap-1.5 items-center">
            <Select
              size="small"
              value={newCustomUnit}
              onChange={setNewCustomUnit}
              className="w-full text-xs font-medium"
              options={UNIT_OPTIONS}
            />
            <InputNumber
              placeholder="Khối lượng"
              value={newCustomQty}
              min={0.01}
              step={1}
              onChange={(v) => setNewCustomQty(v || 1)}
              size="small"
              className="w-full font-medium"
            />
            <InputNumber
              placeholder="Đơn giá (VNĐ)"
              value={newCustomUnitPrice}
              min={0}
              step={10000}
              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, "") || 0)}
              onChange={(v) => setNewCustomUnitPrice(v || 0)}
              size="small"
              className="w-full font-medium"
            />
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-medium text-teal-800 truncate">
                {formatVND(calculatedTotal)}
              </span>
              <Button
                type="primary"
                size="small"
                onClick={handleSave}
                className="bg-[#00b4b6] hover:bg-[#009294] font-medium text-xs px-2"
              >
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header cột nhỏ */}
      <div className="px-2 py-0.5 text-[9.5px] text-slate-400 font-medium flex items-center justify-between">
        <span>Tên vật tư / hạng mục</span>
        <div className="flex items-center gap-1.5 text-right pr-1">
          <span className="w-14 text-center">Đơn vị</span>
          <span className="w-12 text-center">K.Lượng</span>
          <span className="w-18 text-right">Đơn giá</span>
          <span className="min-w-[62px] text-right">Thành tiền</span>
        </div>
      </div>

      {/* Bảng danh sách các mục với Checkbox & gạch ngang line-through */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div className="text-xs divide-y divide-slate-100 max-h-[220px] overflow-y-scroll always-visible-scrollbar pr-1">
        {items.map((item, idx) => {
          const isChecked = item.checked;
          const isHighlighted = item.id === highlightedItemId;
          return (
            <div
              key={item.id}
              ref={(el) => {
                if (isHighlighted && el) {
                  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
              }}
              className={`py-1 px-2 flex items-center justify-between gap-1 transition-all ${
                isHighlighted
                  ? "bg-teal-50/95 ring-2 ring-[#00b4b6] rounded-lg shadow-xs z-10 my-0.5"
                  : isChecked
                  ? "hover:bg-slate-50/90"
                  : "bg-slate-50/60 opacity-65"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                <Checkbox
                  checked={isChecked}
                  onChange={() => onToggleCheck(item.id)}
                  className="scale-90 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 shrink-0 select-none">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => onItemNameChange?.(item.id, e.target.value)}
                      className={`w-full bg-transparent hover:bg-slate-100/80 focus:bg-white border border-transparent hover:border-slate-300 focus:border-[#00b4b6] focus:ring-1 focus:ring-[#00b4b6]/25 rounded px-1 -mx-1 py-0 text-[10.5px] font-medium transition-all outline-none truncate ${
                        isChecked ? (isHighlighted ? "text-teal-950 font-bold" : "text-slate-800") : "line-through text-slate-400"
                      }`}
                      title="Nhấp để chỉnh sửa tên hạng mục"
                    />
                    {isHighlighted && (
                      <span className="px-1 py-0.5 bg-[#00b4b6] text-white text-[8.5px] rounded font-bold shrink-0 animate-pulse">
                        3D
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={item.detail || ""}
                    onChange={(e) => onItemDetailChange?.(item.id, e.target.value)}
                    placeholder="Quy cách / diễn giải..."
                    className={`w-full bg-transparent hover:bg-slate-100/70 focus:bg-white border border-transparent hover:border-slate-200 focus:border-[#00b4b6] rounded px-1 -mx-1 py-0 text-[9px] transition-all outline-none truncate ${
                      isChecked ? "text-slate-500" : "line-through text-slate-400"
                    }`}
                    title="Nhấp để chỉnh sửa quy cách"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 justify-end font-medium">
                {/* 1. Đơn vị tính */}
                <Select
                  size="small"
                  value={item.unit || "khoán"}
                  onChange={(u) => onItemUnitChange?.(item.id, u)}
                  className="w-14 text-[10px] font-medium [&_.ant-select-selector]:!px-1 [&_.ant-select-selection-item]:!text-[10px] [&_.ant-select-selection-item]:!pe-3"
                  popupMatchSelectWidth={false}
                  title="Đơn vị tính"
                  options={UNIT_OPTIONS}
                />

                {/* 2. Khối lượng (Quantity) */}
                <InputNumber
                  size="small"
                  min={0.01}
                  step={0.5}
                  value={item.quantity ?? 1}
                  onChange={(q) => onItemQuantityChange?.(item.id, Number(q) || 0)}
                  className="w-12 text-[10px] font-medium text-right [&_.ant-input-number-input]:!px-1 [&_.ant-input-number-input]:!py-0.5 [&_.ant-input-number-input]:!text-[10px]"
                  title="Khối lượng"
                  placeholder="KL"
                />

                {/* 3. Đơn giá */}
                <InputNumber
                  size="small"
                  value={item.unitPrice ?? item.total}
                  onChange={(p) => onItemUnitPriceChange?.(item.id, Number(p) || 0)}
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, "") || 0)}
                  className="w-18 text-[10px] font-medium text-right [&_.ant-input-number-input]:!px-1 [&_.ant-input-number-input]:!py-0.5 [&_.ant-input-number-input]:!text-[10px]"
                  title="Đơn giá"
                />

                {/* 4. Thành tiền */}
                <span
                  className={`font-medium text-[10.5px] min-w-[62px] text-right truncate ${
                    isHighlighted ? "text-teal-900 font-bold" : isChecked ? "text-slate-800" : "line-through text-slate-400"
                  }`}
                >
                  {formatVND(item.total)}
                </span>
                {item.isCustom && (
                  <button
                    type="button"
                    onClick={() => onDeleteCustomItem(item.id)}
                    className="p-0.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Xóa mục này"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};
