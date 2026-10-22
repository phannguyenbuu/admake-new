/**
 * CanvasQuoteSheet.tsx - Xem trước Bảng Báo Giá Trang 2 trực tiếp trên Canvas
 * Cho phép kéo thả Logo và Text 2D của Trang 2 lên trên bản xem trước này
 */

import React from "react";
import { formatVND } from "../../../services/aiPricingEngine";
import type { Signboard3DModel } from "../../../services/genaiSignboard.service";
import type { StudioQuoteResult } from "./studioQuote";

interface CanvasQuoteSheetProps {
  model3D: Signboard3DModel | null;
  quoteResult: StudioQuoteResult | null;
  profitMargin: number;
  orientation?: "landscape" | "portrait";
}

export const CanvasQuoteSheet: React.FC<CanvasQuoteSheetProps> = ({
  model3D,
  quoteResult,
  profitMargin,
  orientation = "landscape",
}) => {
  const isPortrait = orientation === "portrait";
  const w = model3D?.dimensions?.width || 3;
  const h = model3D?.dimensions?.height || 1.2;
  const d = model3D?.dimensions?.depth || 0.12;
  const area = (w * h).toFixed(2);
  const now = new Date().toLocaleDateString("vi-VN");

  // Đọc dữ liệu override từ localStorage nếu có
  let itemOverrides: Record<string, any> = {};
  let customItems: any[] = [];
  let laborDays = Math.max(2, Math.ceil(Number(area) / 10));
  let laborRate = 400000;
  let transportKm = 15;
  let transportRate = 15000;
  let scrapPercent = 5;

  try {
    itemOverrides = JSON.parse(localStorage.getItem("admake_pricing_item_overrides") || "{}");
    customItems = JSON.parse(localStorage.getItem("admake_custom_pricing_items") || "[]");
    laborDays = Number(localStorage.getItem("admake_quote_labor_days")) || laborDays;
    laborRate = Number(localStorage.getItem("admake_quote_labor_rate")) || 400000;
    transportKm = Number(localStorage.getItem("admake_quote_transport_km")) || 15;
    transportRate = Number(localStorage.getItem("admake_quote_transport_rate")) || 15000;
    scrapPercent = Number(localStorage.getItem("admake_scrap_percent")) || 5;
  } catch {}

  const laborTotal = laborDays * laborRate;
  const transportTotal = transportKm * transportRate;

  let rawMaterials = 0;
  const items: Array<{ stt: number; name: string; detail: string; unit: string; qty: number; unitPrice: number; total: number }> = [];

  if (model3D?.components && model3D.components.length > 0) {
    model3D.components.forEach((comp, idx) => {
      const cQty = itemOverrides[`comp_${comp.stt || idx}`]?.quantity ?? comp.quantity;
      const cPrice = itemOverrides[`comp_${comp.stt || idx}`]?.unitPrice ?? (comp.unitPrice || 0);
      const cTotal = Math.round(cQty * cPrice);
      rawMaterials += cTotal;
      items.push({
        stt: idx + 1,
        name: comp.name,
        detail: comp.dimensions || comp.detail || "Quy cách kỹ thuật thi công",
        unit: comp.unit || "bộ",
        qty: cQty,
        unitPrice: cPrice,
        total: cTotal,
      });
    });
  } else if (quoteResult?.materials) {
    const m = quoteResult.materials;
    const surfPrice = itemOverrides["surface"]?.unitPrice ?? (m.surface?.unit_price || 0);
    const surfQty = itemOverrides["surface"]?.quantity ?? (m.surface?.quantity || Number(area) || 1);
    const surfTotal = Math.round(surfPrice * surfQty);
    rawMaterials += surfTotal;
    items.push({
      stt: items.length + 1,
      name: m.surface?.name || "Mặt bảng Alu/Bạt",
      detail: m.surface?.detail || "Gia công mặt phẳng thẩm mỹ",
      unit: "m²",
      qty: surfQty,
      unitPrice: surfPrice,
      total: surfTotal,
    });

    const ironPrice = itemOverrides["iron_frame"]?.unitPrice ?? (m.iron_frame?.unit_price || 0);
    const ironQty = itemOverrides["iron_frame"]?.quantity ?? (m.iron_frame?.quantity || 1);
    const ironTotal = Math.round(ironPrice * ironQty);
    rawMaterials += ironTotal;
    items.push({
      stt: items.length + 1,
      name: m.iron_frame?.name || "Khung sắt chịu lực",
      detail: m.iron_frame?.detail || "Hàn khung xương mạ kẽm",
      unit: "cây (6m)",
      qty: ironQty,
      unitPrice: ironPrice,
      total: ironTotal,
    });

    if (m.reinforce_iron?.active) {
      const rfPrice = itemOverrides["reinforce_iron"]?.unitPrice ?? (m.reinforce_iron.unit_price || 0);
      const rfQty = itemOverrides["reinforce_iron"]?.quantity ?? (m.reinforce_iron.quantity || 1);
      const rfTotal = Math.round(rfPrice * rfQty);
      rawMaterials += rfTotal;
      items.push({
        stt: items.length + 1,
        name: m.reinforce_iron.name,
        detail: m.reinforce_iron.detail || "Sắt chống tăng cứng chống rung",
        unit: "cây (6m)",
        qty: rfQty,
        unitPrice: rfPrice,
        total: rfTotal,
      });
    }

    if (m.sheet_backing?.active) {
      const sbPrice = itemOverrides["sheet_backing"]?.unitPrice ?? (m.sheet_backing.unit_price || 95000);
      const sbQty = itemOverrides["sheet_backing"]?.quantity ?? (m.sheet_backing.quantity || Number(area) || 1);
      const sbTotal = Math.round(sbPrice * sbQty);
      rawMaterials += sbTotal;
      items.push({
        stt: items.length + 1,
        name: m.sheet_backing.name,
        detail: m.sheet_backing.detail || "Tôn kẽm mạ màu chống dột mặt sau",
        unit: "m²",
        qty: sbQty,
        unitPrice: sbPrice,
        total: sbTotal,
      });
    }

    if (m.aluminum_trim) {
      const atPrice = itemOverrides["aluminum_trim"]?.unitPrice ?? (m.aluminum_trim.unit_price || 45000);
      const atQty = itemOverrides["aluminum_trim"]?.quantity ?? (m.aluminum_trim.quantity || Math.ceil((2 * (w + h)) / 3));
      const atTotal = Math.round(atPrice * atQty);
      rawMaterials += atTotal;
      items.push({
        stt: items.length + 1,
        name: m.aluminum_trim.name,
        detail: m.aluminum_trim.detail || "Nẹp viền V nhôm bo quanh 4 cạnh",
        unit: "cây (3m)",
        qty: atQty,
        unitPrice: atPrice,
        total: atTotal,
      });
    }

    if (quoteResult.led?.active) {
      const ledPrice = itemOverrides["led"]?.unitPrice ?? (quoteResult.led.unit_price || quoteResult.led.total);
      const ledQty = itemOverrides["led"]?.quantity ?? 1;
      const ledTotal = Math.round(ledPrice * ledQty);
      rawMaterials += ledTotal;
      items.push({
        stt: items.length + 1,
        name: quoteResult.led.name,
        detail: quoteResult.led.detail || "Hệ thống chiếu sáng LED hắt sáng cao cấp",
        unit: "bộ",
        qty: ledQty,
        unitPrice: ledPrice,
        total: ledTotal,
      });
    }

    if (m.accessories) {
      const accPrice = itemOverrides["accessories"]?.unitPrice ?? (m.accessories.unit_price || m.accessories.total || 400000);
      const accQty = itemOverrides["accessories"]?.quantity ?? 1;
      const accTotal = Math.round(accPrice * accQty);
      rawMaterials += accTotal;
      items.push({
        stt: items.length + 1,
        name: m.accessories.name,
        detail: m.accessories.detail || "Que hàn, ốc vít tự khoan, silicone A500 chống dột",
        unit: "gói",
        qty: accQty,
        unitPrice: accPrice,
        total: accTotal,
      });
    }
  }

  customItems.forEach((ci: any, idx: number) => {
    if (ci.checked !== false) {
      const cQty = itemOverrides[ci.id]?.quantity ?? (ci.quantity || 1);
      const cPrice = itemOverrides[ci.id]?.unitPrice ?? (ci.unitPrice || ci.total);
      const cTotal = cQty * cPrice;
      rawMaterials += cTotal;
      items.push({
        stt: items.length + 1,
        name: ci.name,
        detail: ci.detail || "Hạng mục bổ sung",
        unit: ci.unit || "cái",
        qty: cQty,
        unitPrice: cPrice,
        total: cTotal,
      });
    }
  });

  const scrapAmount = Math.round((rawMaterials * scrapPercent) / 100);
  const costPrice = rawMaterials + scrapAmount + laborTotal + transportTotal;
  const profitAmount = Math.round((costPrice * profitMargin) / 100);
  const quotePrice = costPrice + profitAmount;
  const vatAmount = Math.round(quotePrice * 0.08);
  const grandTotal = quotePrice + vatAmount;

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-900/90 p-4 sm:p-6 flex items-center justify-center select-none">
      <div className={`w-full ${isPortrait ? "max-w-[700px]" : "max-w-[920px]"} bg-white rounded-xl shadow-2xl p-5 sm:p-7 border border-slate-200 text-slate-800 text-xs transition-all`}>
        {/* Header Trang 2 */}
        <div className="flex justify-between items-start border-b-2 border-[#00b4b6] pb-3 mb-3">
          <div>
            <div className="text-xl font-black text-[#00b4b6] tracking-tight">ADMAKE</div>
            <div className="text-sm font-bold text-slate-900 uppercase">
              BẢNG DỰ TOÁN BÁO GIÁ THI CÔNG BIỂN HIỆU ({isPortrait ? "KHỔ ĐỨNG" : "KHỔ NẰM"})
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Công trình: <strong className="text-slate-700">{model3D?.name || "Biển Hiệu Quảng Cáo"}</strong> • Kích thước:{" "}
              <strong>
                {w}m × {h}m × {d}m ({area} m²)
              </strong>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 font-bold text-[10px]">
              TRANG 2 ({isPortrait ? "ĐỨNG" : "NẰM"})
            </span>
            <div className="mt-1">Ngày lập: {now}</div>
          </div>
        </div>

        {/* Bảng chi tiết */}
        <div className="overflow-x-auto mb-3">
          <table className="w-full border-collapse border border-slate-200 text-[11px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="border border-slate-200 p-1.5 text-center w-8">STT</th>
                <th className="border border-slate-200 p-1.5 text-left">Hạng mục</th>
                <th className="border border-slate-200 p-1.5 text-left">Quy cách</th>
                <th className="border border-slate-200 p-1.5 text-center w-14">ĐVT</th>
                <th className="border border-slate-200 p-1.5 text-center w-12">SL</th>
                <th className="border border-slate-200 p-1.5 text-right w-24">Đơn giá</th>
                <th className="border border-slate-200 p-1.5 text-right w-28">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.stt} className="hover:bg-slate-50">
                  <td className="border border-slate-200 p-1.5 text-center">{it.stt}</td>
                  <td className="border border-slate-200 p-1.5 font-semibold text-slate-800">{it.name}</td>
                  <td className="border border-slate-200 p-1.5 text-slate-600">{it.detail}</td>
                  <td className="border border-slate-200 p-1.5 text-center">{it.unit}</td>
                  <td className="border border-slate-200 p-1.5 text-center">{it.qty}</td>
                  <td className="border border-slate-200 p-1.5 text-right font-mono">{formatVND(it.unitPrice)}</td>
                  <td className="border border-slate-200 p-1.5 text-right font-mono font-bold text-slate-800">
                    {formatVND(it.total)}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="border border-slate-200 p-1.5 text-center">•</td>
                <td className="border border-slate-200 p-1.5 font-semibold">Nhân công sản xuất & lắp đặt</td>
                <td className="border border-slate-200 p-1.5 text-slate-600">Thợ cơ khí + thợ căng mặt + kỹ thuật treo</td>
                <td className="border border-slate-200 p-1.5 text-center">công</td>
                <td className="border border-slate-200 p-1.5 text-center">{laborDays}</td>
                <td className="border border-slate-200 p-1.5 text-right font-mono">{formatVND(laborRate)}</td>
                <td className="border border-slate-200 p-1.5 text-right font-mono font-bold">{formatVND(laborTotal)}</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-1.5 text-center">•</td>
                <td className="border border-slate-200 p-1.5 font-semibold">Vận chuyển công trình</td>
                <td className="border border-slate-200 p-1.5 text-slate-600">Xe chuyên dụng vận chuyển đến địa điểm</td>
                <td className="border border-slate-200 p-1.5 text-center">km</td>
                <td className="border border-slate-200 p-1.5 text-center">{transportKm}</td>
                <td className="border border-slate-200 p-1.5 text-right font-mono">{formatVND(transportRate)}</td>
                <td className="border border-slate-200 p-1.5 text-right font-mono font-bold">{formatVND(transportTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tổng kết tài chính */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-700 uppercase border-b border-slate-200 pb-1">Điều khoản & Bảo hành</div>
            <div>• Tạm ứng 50% khi duyệt mẫu thiết kế (Trang 1).</div>
            <div>• Thanh toán 50% sau khi nghiệm thu bàn giao biển hiệu.</div>
            <div>• Bảo hành kết cấu khung 24 tháng, nguồn LED 12 tháng.</div>
          </div>

          <div className="p-2.5 rounded-lg border border-teal-200 bg-teal-50/60 text-xs space-y-1 font-medium">
            <div className="flex justify-between text-slate-600">
              <span>Giá vốn sản xuất (A):</span>
              <span className="font-mono">{formatVND(costPrice)}</span>
            </div>
            <div className="flex justify-between text-amber-600">
              <span>Lợi nhuận ({profitMargin}%):</span>
              <span className="font-mono">+{formatVND(profitAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-700 font-bold border-t border-teal-200 pt-1">
              <span>Giá bán trước thuế:</span>
              <span className="font-mono">{formatVND(quotePrice)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>VAT (8%):</span>
              <span className="font-mono">{formatVND(vatAmount)}</span>
            </div>
            <div className="flex justify-between text-[#00b4b6] font-extrabold text-sm border-t border-teal-300 pt-1">
              <span>TỔNG THANH TOÁN:</span>
              <span className="font-mono">{formatVND(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Chữ ký */}
        <div className="flex justify-between text-center pt-2 text-[11px] text-slate-500">
          <div>
            <div className="font-bold text-slate-700 uppercase">ĐẠI DIỆN KHÁCH HÀNG</div>
            <div className="italic text-[10px]">(Ký & ghi rõ họ tên)</div>
          </div>
          <div>
            <div className="font-bold text-[#00b4b6] uppercase">ĐẠI DIỆN CÔNG TY ADMAKE</div>
            <div className="italic text-[10px]">(Ký tên & đóng dấu)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
