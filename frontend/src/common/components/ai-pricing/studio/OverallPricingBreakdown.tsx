// OverallPricingBreakdown.tsx - Bảng giá tổng thể cấu thành thành phần (Vật tư, Nhân công, Vận chuyển, Hao hụt)
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Tooltip } from "antd";
import {
  ChevronDown,
  ChevronUp,
  Layers,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import type { Signboard3DModel } from "../../../services/genaiSignboard.service";
import { formatVND, PRICING_STANDARDS } from "../../../services/aiPricingEngine";
import type { StudioQuoteResult } from "./studioQuote";
import {
  exportStudioQuoteExcel,
  exportStudioQuotePDF,
  type PricingLineItem,
} from "./studioExportUtil";
import { PricingLineItemsList } from "./PricingLineItemsList";
import { LaborTransportPricing } from "./LaborTransportPricing";

interface OverallPricingBreakdownProps {
  model3D: Signboard3DModel | null;
  quoteResult: StudioQuoteResult | null;
  defaultCollapsed?: boolean;
  selectedIron?: string;
  selectedSurface?: string;
  onMaterialChange?: (type: "iron" | "surface", key: string) => void;
  onExportPdf?: () => void;
  selectedMesh?: any;
}

export const OverallPricingBreakdown: React.FC<OverallPricingBreakdownProps> = ({
  model3D,
  quoteResult,
  defaultCollapsed = false,
  selectedIron,
  selectedSurface,
  onMaterialChange,
  onExportPdf,
  selectedMesh,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);

  // Lưu override đơn vị tính, khối lượng, đơn giá, tên & quy cách của người dùng
  const [itemOverrides, setItemOverrides] = useState<
    Record<string, { unit?: string; unitPrice?: number; quantity?: number; name?: string; detail?: string }>
  >(() => {
    try {
      const saved = localStorage.getItem("admake_pricing_item_overrides");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const updateOverride = (id: string, patch: any) => {
    setItemOverrides((prev) => {
      const updated = { ...prev, [id]: { ...(prev[id] || {}), ...patch } };
      try { localStorage.setItem("admake_pricing_item_overrides", JSON.stringify(updated)); } catch {}
      return updated;
    });
  };
  const handleItemNameChange = (id: string, name: string) => updateOverride(id, { name });
  const handleItemDetailChange = (id: string, detail: string) => updateOverride(id, { detail });

  const applyLogistics = (log: any) => {
    if (log.labor_days) setLaborDays(log.labor_days);
    if (log.labor_rate) setLaborUnitPrice(log.labor_rate);
    if (log.transport_km) setTransportKm(log.transport_km);
    if (log.transport_rate) setTransportUnitPrice(log.transport_rate);
    if (log.scrap_percent) setScrapPercent(log.scrap_percent);
  };

  // Lắng nghe sự kiện đồng bộ từ cấu kiện mô hình 3D/Ruby sang Bảng Giá Tổng Thể
  useEffect(() => {
    const handleSync = (e?: Event) => {
      try { localStorage.removeItem("admake_pricing_item_overrides"); } catch {}
      setItemOverrides({}); setItemCheckMap({});
      const log = (e as CustomEvent)?.detail?.logistics || model3D?.logistics;
      if (log) applyLogistics(log);
    };
    window.addEventListener("admake_sync_pricing", handleSync);
    return () => window.removeEventListener("admake_sync_pricing", handleSync);
  }, [model3D]);

  useEffect(() => { if (model3D?.logistics) applyLogistics(model3D.logistics); }, [model3D?.logistics]);

  // Tự động tính khối lượng theo kích thước 3D khi khách chọn m2, m3, mét dài, tấm...
  const calcAutoQty = useCallback((unit: string): number => {
    const w = model3D?.dimensions?.width || 3;
    const h = model3D?.dimensions?.height || 1.2;
    const d = model3D?.dimensions?.depth || 0.12;
    if (unit === "m²") return Math.max(0.1, Number((w * h).toFixed(2)));
    if (unit === "m³") return Math.max(0.01, Number((w * h * d).toFixed(3)));
    if (unit === "mét dài") return Math.max(0.5, Number((2 * (w + h)).toFixed(2)));
    if (unit === "tấm") return Math.max(1, Math.ceil((w * h) / (1.22 * 2.44)));
    if (unit === "cây (6m)") return Math.max(1, Math.ceil((2 * (w + h) * 1.3) / 6));
    return 1;
  }, [model3D]);

  const handleItemUnitChange = (id: string, unit: string) => updateOverride(id, { unit, quantity: calcAutoQty(unit) });
  const handleItemQuantityChange = (id: string, quantity: number) => updateOverride(id, { quantity: Math.max(0.01, quantity) });
  const handleItemUnitPriceChange = (id: string, unitPrice: number) => updateOverride(id, { unitPrice: Math.max(0, unitPrice) });

  // 1. Quản lý trạng thái Check/Uncheck từng mục
  const [itemCheckMap, setItemCheckMap] = useState<Record<string, boolean>>({});

  // 2. Danh sách các thành phần bổ sung do người dùng tự thêm (+)
  const [customItems, setCustomItems] = useState<PricingLineItem[]>(() => {
    try {
      const saved = localStorage.getItem("admake_custom_pricing_items");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 3. Nhân công: số công x đơn giá
  const defaultDays = useMemo(() => {
    const area = (model3D?.dimensions?.width || 0) * (model3D?.dimensions?.height || 0);
    return Math.max(2, Math.ceil(area / 10));
  }, [model3D]);

  const [laborDays, setLaborDays] = useState<number>(() => {
    const saved = localStorage.getItem("admake_quote_labor_days");
    return saved ? Number(saved) : defaultDays;
  });
  const [laborUnitPrice, setLaborUnitPrice] = useState<number>(() => {
    const saved = localStorage.getItem("admake_quote_labor_rate");
    return saved ? Number(saved) : 400000;
  });
  const handleLaborDaysChange = (val: number | null) => { const v = val || 0; setLaborDays(v); localStorage.setItem("admake_quote_labor_days", String(v)); };
  const handleLaborRateChange = (val: number | null) => { const v = val || 0; setLaborUnitPrice(v); localStorage.setItem("admake_quote_labor_rate", String(v)); };
  const laborCost = laborDays * laborUnitPrice;

  // 4. Vận chuyển: số km x đơn giá
  const [transportKm, setTransportKm] = useState<number>(() => {
    const saved = localStorage.getItem("admake_quote_transport_km");
    return saved ? Number(saved) : 15;
  });
  const [transportUnitPrice, setTransportUnitPrice] = useState<number>(() => {
    const saved = localStorage.getItem("admake_quote_transport_rate");
    return saved ? Number(saved) : 15000;
  });
  const handleTransportKmChange = (val: number | null) => { const v = val || 0; setTransportKm(v); localStorage.setItem("admake_quote_transport_km", String(v)); };
  const handleTransportRateChange = (val: number | null) => { const v = val || 0; setTransportUnitPrice(v); localStorage.setItem("admake_quote_transport_rate", String(v)); };
  const transportCost = transportKm * transportUnitPrice;

  // 5. % Hao hụt vật tư (0% đến 100%)
  const [scrapPercent, setScrapPercent] = useState<number>(() => {
    const saved = localStorage.getItem("admake_scrap_percent");
    return saved ? Number(saved) : 5;
  });

  const handleScrapChange = (val: number) => {
    setScrapPercent(val);
    try {
      localStorage.setItem("admake_scrap_percent", String(val));
    } catch {}
  };

  // Tổng hợp danh sách tất cả các mục thành phần
  const allItems: PricingLineItem[] = useMemo(() => {
    if (!quoteResult) return [];

    let base: PricingLineItem[] = [];

    if (model3D?.components && model3D.components.length > 0) {
      base = model3D.components.map((comp, idx) => {
        const id = `comp_${comp.stt || idx + 1}`;
        const unit = itemOverrides[id]?.unit || comp.unit || "bộ";
        const unitPrice = itemOverrides[id]?.unitPrice ?? (comp.unitPrice || 0);
        const quantity = itemOverrides[id]?.quantity ?? comp.quantity;
        const isAlt = (comp.detail || "").toLowerCase().includes("thay the") || comp.name.toLowerCase().includes("thay the");
        const cleanName = comp.name.replace(/^\d+[\.\s\-:]+/, "").trim() || comp.name;
        const name = itemOverrides[id]?.name || cleanName;
        const detail = itemOverrides[id]?.detail !== undefined ? itemOverrides[id]?.detail! : (comp.dimensions || comp.detail || "");
        return {
          id,
          name,
          detail,
          quantity,
          unit,
          unitPrice,
          total: Math.round(quantity * unitPrice),
          checked: itemCheckMap[id] !== undefined ? itemCheckMap[id] : !isAlt,
        };
      });
    } else {
      // 1. Mặt bảng (link selectedSurface)
      const surfStd = PRICING_STANDARDS.surfaces.find((s) => s.key === selectedSurface);
      const surfUnit = itemOverrides["surface"]?.unit || surfStd?.unit || "m²";
      const surfPrice = itemOverrides["surface"]?.unitPrice ?? (surfStd?.unitPrice || quoteResult.materials.surface.unit_price || 0);
      const surfQty = itemOverrides["surface"]?.quantity ?? (quoteResult.materials.surface.quantity || quoteResult.dimensions.area || 1);
      const surfTotal = Math.round(surfQty * surfPrice);

      // 2. Khung sắt (link selectedIron)
      const ironStd = PRICING_STANDARDS.iron_bars.find((i) => i.key === selectedIron);
      const ironUnit = itemOverrides["iron_frame"]?.unit || ironStd?.unit || "cây (6m)";
      const ironPrice = itemOverrides["iron_frame"]?.unitPrice ?? (ironStd?.unitPrice || quoteResult.materials.iron_frame.unit_price || 0);
      const ironQty = itemOverrides["iron_frame"]?.quantity ?? (quoteResult.materials.iron_frame.quantity || 1);
      const ironTotal = Math.round(ironQty * ironPrice);

      base = [
        {
          id: "surface",
          name: surfStd ? surfStd.name : quoteResult.materials.surface.name,
          detail: quoteResult.materials.surface.detail,
          quantity: surfQty,
          unit: surfUnit,
          unitPrice: surfPrice,
          total: surfTotal,
          checked: itemCheckMap["surface"] !== false,
        },
        {
          id: "iron_frame",
          name: ironStd ? ironStd.name : quoteResult.materials.iron_frame.name,
          detail: quoteResult.materials.iron_frame.detail,
          quantity: ironQty, unit: ironUnit, unitPrice: ironPrice, total: ironTotal,
          checked: itemCheckMap["iron_frame"] !== false,
        },
      ];

    if (quoteResult.materials.reinforce_iron?.active) {
      const rfPrice = itemOverrides["reinforce_iron"]?.unitPrice ?? (quoteResult.materials.reinforce_iron.unit_price || 0);
      const rfUnit = itemOverrides["reinforce_iron"]?.unit || "cây (6m)";
      const rfQty = itemOverrides["reinforce_iron"]?.quantity ?? (quoteResult.materials.reinforce_iron?.quantity || 1);
      base.push({
        id: "reinforce_iron", name: quoteResult.materials.reinforce_iron.name, detail: quoteResult.materials.reinforce_iron.detail,
        quantity: rfQty, unit: rfUnit, unitPrice: rfPrice, total: Math.round(rfQty * rfPrice), checked: itemCheckMap["reinforce_iron"] !== false,
      });
    }

    const tbPrice = itemOverrides["trim_backing"]?.unitPrice ?? (
      (quoteResult.materials.sheet_backing?.active ? quoteResult.materials.sheet_backing.total : 0) + quoteResult.materials.aluminum_trim.total
    );
    const tbUnit = itemOverrides["trim_backing"]?.unit || "khoán";
    const tbQty = itemOverrides["trim_backing"]?.quantity ?? 1;
    base.push({
      id: "trim_backing", name: quoteResult.materials.sheet_backing?.active ? "Tôn lót lưng & Nẹp viền" : "V nhôm bọc viền",
      detail: quoteResult.materials.aluminum_trim.detail, quantity: tbQty, unit: tbUnit, unitPrice: tbPrice, total: Math.round(tbQty * tbPrice),
      checked: itemCheckMap["trim_backing"] !== false,
    });

    if (quoteResult.led?.active) {
      const ledPrice = itemOverrides["led"]?.unitPrice ?? (quoteResult.led.unit_price || quoteResult.led.total);
      const ledUnit = itemOverrides["led"]?.unit || "bộ";
      const ledQty = itemOverrides["led"]?.quantity ?? 1;
      base.push({
        id: "led", name: quoteResult.led.name, detail: quoteResult.led.detail, quantity: ledQty, unit: ledUnit, unitPrice: ledPrice,
        total: Math.round(ledQty * ledPrice), checked: itemCheckMap["led"] !== false,
      });
    }

    const accPrice = itemOverrides["accessories"]?.unitPrice ?? quoteResult.materials.accessories.total;
    const accUnit = itemOverrides["accessories"]?.unit || "gói";
    const accQty = itemOverrides["accessories"]?.quantity ?? 1;
    base.push({
      id: "accessories", name: quoteResult.materials.accessories.name, detail: "Keo dán, ốc vít, que hàn",
      quantity: accQty, unit: accUnit, unitPrice: accPrice, total: Math.round(accQty * accPrice), checked: itemCheckMap["accessories"] !== false,
    });
    }

    const parsedCustom = customItems.map((c) => {
      const cQty = itemOverrides[c.id]?.quantity ?? (c.quantity || 1);
      const cPrice = itemOverrides[c.id]?.unitPrice ?? (c.unitPrice || c.total);
      const cUnit = itemOverrides[c.id]?.unit || c.unit || "cái";
      const cName = itemOverrides[c.id]?.name || c.name;
      const cDetail = itemOverrides[c.id]?.detail !== undefined ? itemOverrides[c.id]?.detail! : c.detail;
      return {
        ...c,
        name: cName,
        detail: cDetail,
        quantity: cQty,
        unit: cUnit,
        unitPrice: cPrice,
        total: Math.round(cQty * cPrice),
        checked: itemCheckMap[c.id] !== false,
      };
    });

    return [...base, ...parsedCustom];
  }, [quoteResult, model3D, itemCheckMap, customItems, selectedIron, selectedSurface, itemOverrides]);

  const toggleItemCheck = (id: string) => {
    setItemCheckMap((prev) => {
      const current = prev[id] !== false;
      return { ...prev, [id]: !current };
    });
  };

  const handleAddCustomItem = (name: string, detail: string, total: number, quantity: number = 1, unit: string = "cái", unitPrice: number = total) => {
    const updated = [...customItems, { id: `custom_${Date.now()}`, name, detail, quantity, unit, unitPrice, total, checked: true, isCustom: true }];
    setCustomItems(updated);
    try { localStorage.setItem("admake_custom_pricing_items", JSON.stringify(updated)); } catch {}
  };
  const handleDeleteCustomItem = (id: string) => {
    const updated = customItems.filter((i) => i.id !== id);
    setCustomItems(updated);
    try { localStorage.setItem("admake_custom_pricing_items", JSON.stringify(updated)); } catch {}
  };

  // Khớp đối tượng 3D đang chọn với thành phần cấu thành để highlight
  const highlightedItemId = useMemo(() => {
    if (!selectedMesh) return null;
    const selName = (selectedMesh.name || "").toLowerCase().replace(/^\d+[\.\s\-:]+/, "").trim();
    const elIdx = selectedMesh.elementIndex;

    if (model3D?.components && elIdx !== undefined && model3D.components[elIdx]) {
      const cand = model3D.components[elIdx];
      const candName = (cand.name || "").toLowerCase().replace(/^\d+[\.\s\-:]+/, "").trim();
      if (candName.includes(selName) || selName.includes(candName)) return `comp_${cand.stt || elIdx + 1}`;
    }

    const byName = allItems.find((it) => {
      const itName = it.name.toLowerCase().replace(/^\d+[\.\s\-:]+/, "").trim();
      return itName.includes(selName) || selName.includes(itName);
    });
    if (byName) return byName.id;

    const keywords: [string, string[]][] = [
      ["móng", ["comp_1"]], ["bản mã", ["comp_2"]], ["trụ", ["comp_3"]], ["cột", ["comp_3"]],
      ["khung", ["comp_4", "iron_frame"]], ["xương", ["comp_4", "iron_frame"]],
      ["giằng", ["comp_5", "reinforce_iron"]], ["bạt", ["comp_6", "surface"]],
      ["alu", ["comp_6", "surface"]], ["mặt", ["comp_6", "surface"]],
      ["chữ", ["comp_7", "comp_8"]], ["inox", ["comp_7", "comp_8"]], ["led", ["led"]], ["đèn", ["led"]],
    ];
    for (const [kw, ids] of keywords) {
      if (selName.includes(kw)) {
        const found = allItems.find((it) => ids.includes(it.id));
        if (found) return found.id;
      }
    }
    return (elIdx !== undefined && allItems[elIdx]) ? allItems[elIdx].id : null;
  }, [selectedMesh, allItems, model3D]);

  // Đồng bộ khối lượng khi vật thể 3D scale (3 hướng X, Y, Z)
  useEffect(() => {
    if (!selectedMesh || !highlightedItemId) return;
    const [sx, sy, sz] = selectedMesh.scale || [1, 1, 1];
    const targetItem = allItems.find((it) => it.id === highlightedItemId);
    if (!targetItem) return;

    let baseQty = 1;
    if (model3D?.components) {
      const orig = model3D.components.find((c, idx) => `comp_${c.stt || idx + 1}` === highlightedItemId);
      baseQty = orig?.quantity || targetItem.quantity || 1;
    } else if (targetItem.id === "surface") {
      baseQty = quoteResult?.dimensions?.area || (model3D?.dimensions?.width || 3) * (model3D?.dimensions?.height || 1.2);
    } else if (targetItem.id === "iron_frame") {
      baseQty = Math.max(1, Math.ceil((2 * ((model3D?.dimensions?.width || 3) + (model3D?.dimensions?.height || 1.2)) * 1.3) / 6));
    } else {
      baseQty = targetItem.quantity || 1;
    }

    const u = (targetItem.unit || "").toLowerCase();
    let mult = 1;
    if (u.includes("m²") || u.includes("m2") || u.includes("tấm")) mult = Math.abs(sx * sy);
    else if (u.includes("m³") || u.includes("m3") || u.includes("hố")) mult = Math.abs(sx * sy * sz);
    else mult = Math.max(Math.abs(sx), Math.abs(sy), Math.abs(sz));

    const newQty = Math.abs(mult - 1) > 0.005 ? Number((baseQty * mult).toFixed(2)) : baseQty;
    setItemOverrides((prev) => {
      if (prev[highlightedItemId]?.quantity === newQty) return prev;
      const updated = { ...prev, [highlightedItemId]: { ...(prev[highlightedItemId] || {}), quantity: newQty } };
      try { localStorage.setItem("admake_pricing_item_overrides", JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [selectedMesh?.scale?.[0], selectedMesh?.scale?.[1], selectedMesh?.scale?.[2], selectedMesh?.uuid, highlightedItemId]);

  const materialsCost = useMemo(() => {
    return allItems.reduce((sum, item) => (item.checked ? sum + item.total : sum), 0);
  }, [allItems]);

  const scrapAmount = Math.round((materialsCost * scrapPercent) / 100);
  const totalProductionCost = materialsCost + scrapAmount + laborCost + transportCost;

  const exportData = {
    model3D,
    items: allItems,
    labor: { days: laborDays, unitPrice: laborUnitPrice, total: laborCost },
    transport: { km: transportKm, unitPrice: transportUnitPrice, total: transportCost },
    scrap: { percent: scrapPercent, amount: scrapAmount },
    totalProductionCost,
  };

  return (
    <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 font-medium">
      {/* 1. Header có nút mũi tên Collapse / Expand và các nút xuất Excel / PDF */}
      <div className="flex items-center justify-between pb-1 select-none font-medium">
        <div
          className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#00b4b6] shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-medium text-slate-800 text-xs uppercase tracking-wide block truncate">
              Bảng Giá Tổng Thể
            </span>
            {isCollapsed && (
              <span className="text-[11px] font-medium text-[#00b4b6]">
                {formatVND(totalProductionCost)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 font-medium">
          <Tooltip title="Tải bảng tính Excel (.xls)">
            <button
              type="button"
              onClick={() => exportStudioQuoteExcel(exportData)}
              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 text-[11px] font-medium cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </Tooltip>

          <Tooltip title="In hoặc Lưu PDF (kèm hình render)">
            <button
              type="button"
              onClick={() => {
                if (onExportPdf) {
                  onExportPdf();
                } else {
                  exportStudioQuotePDF(exportData);
                }
              }}
              className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1 text-[11px] font-medium cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </Tooltip>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chi tiết bảng giá (khi không thu gọn) */}
      {!isCollapsed && (
        <>
          <PricingLineItemsList
            items={allItems}
            onToggleCheck={toggleItemCheck}
            onAddCustomItem={handleAddCustomItem}
            onDeleteCustomItem={handleDeleteCustomItem}
            onItemUnitChange={handleItemUnitChange}
            onItemQuantityChange={handleItemQuantityChange}
            onItemUnitPriceChange={handleItemUnitPriceChange}
            onItemNameChange={handleItemNameChange}
            onItemDetailChange={handleItemDetailChange}
            highlightedItemId={highlightedItemId}
          />

          <LaborTransportPricing
            laborDays={laborDays}
            laborUnitPrice={laborUnitPrice}
            onLaborDaysChange={handleLaborDaysChange}
            onLaborRateChange={handleLaborRateChange}
            laborCost={laborCost}
            transportKm={transportKm}
            transportUnitPrice={transportUnitPrice}
            onTransportKmChange={handleTransportKmChange}
            onTransportRateChange={handleTransportRateChange}
            transportCost={transportCost}
            scrapPercent={scrapPercent}
            onScrapChange={handleScrapChange}
            scrapAmount={scrapAmount}
            materialsCost={materialsCost}
            shippingWeightText={model3D?.logistics?.shipping_weight_text}
            packageDimensions={model3D?.logistics?.package_dimensions}
            recommendedVehicle={model3D?.logistics?.recommended_vehicle}
            totalProductionCost={totalProductionCost}
          />
        </>
      )}
    </div>
  );
};
