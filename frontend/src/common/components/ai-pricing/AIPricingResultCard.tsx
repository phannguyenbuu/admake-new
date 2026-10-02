import React from "react";
import { message, Tooltip } from "antd";
import {
  CopyOutlined,
  PrinterOutlined,
  RedoOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  DollarCircleOutlined,
  AppstoreOutlined,
  ToolOutlined
} from "@ant-design/icons";
import {
  formatVND,
  generateFullPrompt,
  type SignboardQuoteResult
} from "../../services/aiPricingEngine";

interface AIPricingResultCardProps {
  result: SignboardQuoteResult;
  onReset?: () => void;
}

export const AIPricingResultCard: React.FC<AIPricingResultCardProps> = ({
  result,
  onReset
}) => {
  const { dimensions, materials, operations, summary, warnings } = result;

  const handleCopyClientQuote = () => {
    const text = `📋 BÁO GIÁ BẢNG HIỆU QUẢNG CÁO
- Quy cách: ${dimensions.width}m x ${dimensions.height}m (Diện tích: ${dimensions.area} m²)
- Chất liệu mặt: ${materials.surface.name}
- Khung chịu lực: ${materials.iron_frame.name}
- Tôn lót mặt sau: ${materials.sheet_backing.active ? "Có lót tôn bảo vệ" : "Không lót tôn"}
- V viền bảo vệ: ${materials.aluminum_trim.name}
${materials.reinforce_iron.active ? `- Chân chống/Gia cố: Có (${materials.reinforce_iron.detail})\n` : ""}- Vận chuyển & Lắp đặt hoàn thiện: Trọn gói

👉 TỔNG GIÁ TRỊ: ${formatVND(summary.quote_price)}
(Đơn giá tương đương: ${formatVND(summary.price_per_sqm)} / m²)
* Báo giá chưa bao gồm thuế VAT.
${warnings.filter(w => w.level === "danger").map(w => `\n⚠️ Lưu ý: ${w.message}`).join("")}`;

    navigator.clipboard.writeText(text);
    message.success("Đã sao chép nội dung báo giá cho khách (gửi Zalo)!");
  };

  const handleCopyPrompt = () => {
    const prompt = generateFullPrompt(result.input_echo);
    navigator.clipboard.writeText(prompt);
    message.success("Đã sao chép prompt chuẩn đầy đủ vào clipboard!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden text-slate-800 space-y-6 p-4 md:p-6 print:border-none print:shadow-none">
      {/* Top Banner: Báo giá khách hàng */}
      <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs mb-2">
              <DollarCircleOutlined /> BẢNG BÁO GIÁ KHÁCH HÀNG (ĐỀ XUẤT)
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold m-0 text-white tracking-tight">
              {formatVND(summary.quote_price)}
            </h2>
            <div className="text-xs md:text-sm text-cyan-100 mt-1 flex flex-wrap items-center gap-2">
              <span>Đơn giá: <b className="text-white font-bold">{formatVND(summary.price_per_sqm)} / m²</b></span>
              <span>•</span>
              <span>Kích thước: <b className="text-white font-bold">{dimensions.width}m x {dimensions.height}m ({dimensions.area} m²)</b></span>
              <span>•</span>
              <span>Lãi kỳ vọng: <b className="text-emerald-200">+{summary.profit_margin_percent}% ({formatVND(summary.profit_amount)})</b></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyClientQuote}
              className="px-3.5 py-2 rounded-xl bg-white text-cyan-800 font-bold text-xs hover:bg-cyan-50 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border-none"
            >
              <CopyOutlined /> Sao chép gửi Zalo
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-xs transition-all border border-white/30 flex items-center gap-1 cursor-pointer"
            >
              <PrinterOutlined /> In
            </button>
          </div>
        </div>
      </div>

      {/* ⚠️ HỆ THỐNG CẢNH BÁO TƯ VẤN (IN ĐẬM VÀ NỔI BẬT NẾU CÓ) */}
      {warnings && warnings.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <WarningOutlined className="text-amber-500 text-base" />
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide m-0">
              Hệ thống Cảnh báo & Tư vấn (Bắt buộc phân tích)
            </h4>
          </div>

          <div className="space-y-2">
            {warnings.map((w, idx) => {
              const isDanger = w.level === "danger";
              const isWarning = w.level === "warning";
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                    isDanger
                      ? "bg-rose-50 border-rose-300 text-rose-900 shadow-2xs"
                      : isWarning
                      ? "bg-amber-50 border-amber-300 text-amber-900 shadow-2xs"
                      : "bg-blue-50 border-blue-200 text-blue-900"
                  }`}
                >
                  <div className="mt-0.5">
                    {isDanger ? (
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold">✕</span>
                    ) : isWarning ? (
                      <WarningOutlined className="text-amber-600 text-base" />
                    ) : (
                      <InfoCircleOutlined className="text-blue-500 text-base" />
                    )}
                  </div>
                  <div className="text-xs leading-relaxed">
                    <strong className="block font-extrabold uppercase tracking-wide mb-0.5">
                      {w.title}:
                    </strong>
                    <span className="font-semibold">{w.message}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📊 BẢNG CHI TIẾT GIÁ VỐN */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <AppstoreOutlined className="text-cyan-600 text-base" />
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide m-0">
              1. Bảng chi tiết Giá vốn (Định mức vật tư & Vận hành)
            </h4>
          </div>
          <div className="text-xs text-slate-500">
            Tổng giá vốn: <b className="text-slate-800 font-bold text-sm">{formatVND(summary.cost_price)}</b>
          </div>
        </div>

        {/* Bảng vật tư */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200">
                <th className="p-2.5 rounded-l-lg font-semibold">Hạng mục</th>
                <th className="p-2.5 font-semibold">Diễn giải định mức</th>
                <th className="p-2.5 font-semibold text-right">Khối lượng</th>
                <th className="p-2.5 font-semibold text-right">Đơn giá</th>
                <th className="p-2.5 rounded-r-lg font-semibold text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Vật tư đầu vào */}
              <tr className="bg-cyan-50/40 text-cyan-900 font-bold">
                <td colSpan={5} className="p-2 text-[11px] uppercase tracking-wider">
                  A. Vật tư đầu vào cố định (Tổng: {formatVND(materials.total_materials_cost)})
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-800">{materials.iron_frame.name}</td>
                <td className="p-2.5 text-slate-500">{materials.iron_frame.detail}</td>
                <td className="p-2.5 text-right font-medium">{materials.iron_frame.quantity} {materials.iron_frame.unit}</td>
                <td className="p-2.5 text-right text-slate-500">{formatVND(materials.iron_frame.unit_price || 0)}</td>
                <td className="p-2.5 text-right font-bold text-slate-800">{formatVND(materials.iron_frame.total)}</td>
              </tr>

              {materials.reinforce_iron.active && (
                <tr>
                  <td className="p-2.5 font-semibold text-slate-800">{materials.reinforce_iron.name}</td>
                  <td className="p-2.5 text-slate-500">{materials.reinforce_iron.detail}</td>
                  <td className="p-2.5 text-right font-medium">{materials.reinforce_iron.quantity} {materials.reinforce_iron.unit}</td>
                  <td className="p-2.5 text-right text-slate-500">{formatVND(materials.reinforce_iron.unit_price || 0)}</td>
                  <td className="p-2.5 text-right font-bold text-slate-800">{formatVND(materials.reinforce_iron.total)}</td>
                </tr>
              )}

              <tr>
                <td className="p-2.5 font-semibold text-slate-800">{materials.surface.name}</td>
                <td className="p-2.5 text-slate-500">{materials.surface.detail}</td>
                <td className="p-2.5 text-right font-medium">-</td>
                <td className="p-2.5 text-right text-slate-500">{formatVND(materials.surface.unit_price || 0)}</td>
                <td className="p-2.5 text-right font-bold text-slate-800">{formatVND(materials.surface.total)}</td>
              </tr>

              {materials.sheet_backing.active && (
                <tr>
                  <td className="p-2.5 font-semibold text-slate-800">{materials.sheet_backing.name}</td>
                  <td className="p-2.5 text-slate-500">{materials.sheet_backing.detail}</td>
                  <td className="p-2.5 text-right font-medium">{materials.sheet_backing.quantity} {materials.sheet_backing.unit}</td>
                  <td className="p-2.5 text-right text-slate-500">{formatVND(materials.sheet_backing.unit_price || 0)}</td>
                  <td className="p-2.5 text-right font-bold text-slate-800">{formatVND(materials.sheet_backing.total)}</td>
                </tr>
              )}

              <tr>
                <td className="p-2.5 font-semibold text-slate-800">{materials.aluminum_trim.name}</td>
                <td className="p-2.5 text-slate-500">{materials.aluminum_trim.detail}</td>
                <td className="p-2.5 text-right font-medium">{materials.aluminum_trim.quantity} {materials.aluminum_trim.unit}</td>
                <td className="p-2.5 text-right text-slate-500">{formatVND(materials.aluminum_trim.unit_price || 0)}</td>
                <td className="p-2.5 text-right font-bold text-slate-800">{formatVND(materials.aluminum_trim.total)}</td>
              </tr>

              <tr>
                <td className="p-2.5 font-semibold text-slate-800">{materials.accessories.name}</td>
                <td className="p-2.5 text-slate-500">{materials.accessories.detail}</td>
                <td className="p-2.5 text-right font-medium">1 khoán</td>
                <td className="p-2.5 text-right text-slate-500">{formatVND(materials.accessories.unit_price || 0)}</td>
                <td className="p-2.5 text-right font-bold text-slate-800">{formatVND(materials.accessories.total)}</td>
              </tr>

              {/* Chi phí vận hành */}
              <tr className="bg-teal-50/40 text-teal-900 font-bold">
                <td colSpan={5} className="p-2 text-[11px] uppercase tracking-wider">
                  B. Chi phí vận hành & thi công (Tổng: {formatVND(operations.total_operations_cost)})
                </td>
              </tr>

              <tr>
                <td className="p-2.5 font-semibold text-slate-800">{operations.labor.name}</td>
                <td className="p-2.5 text-slate-500">{operations.labor.detail}</td>
                <td className="p-2.5 text-right font-medium">{operations.labor.quantity} {operations.labor.unit}</td>
                <td className="p-2.5 text-right text-slate-500">{formatVND(operations.labor.unit_price || 0)}</td>
                <td className="p-2.5 text-right font-bold text-slate-800">{formatVND(operations.labor.total)}</td>
              </tr>

              <tr>
                <td className="p-2.5 font-semibold text-slate-800">{operations.transport.name}</td>
                <td className="p-2.5 text-slate-500">{operations.transport.detail}</td>
                <td className="p-2.5 text-right font-medium">1 chuyến</td>
                <td className="p-2.5 text-right text-slate-500">{formatVND(operations.transport.unit_price || 0)}</td>
                <td className="p-2.5 text-right font-bold text-slate-800">{formatVND(operations.transport.total)}</td>
              </tr>

              {operations.scaffolding.active && (
                <tr>
                  <td className="p-2.5 font-semibold text-slate-800">{operations.scaffolding.name}</td>
                  <td className="p-2.5 text-slate-500">{operations.scaffolding.detail}</td>
                  <td className="p-2.5 text-right font-medium">{operations.scaffolding.quantity} {operations.scaffolding.unit}</td>
                  <td className="p-2.5 text-right text-slate-500">{formatVND(operations.scaffolding.unit_price || 0)}</td>
                  <td className="p-2.5 text-right font-bold text-slate-800">{formatVND(operations.scaffolding.total)}</td>
                </tr>
              )}

              {operations.canvas_seam.active && (
                <tr className="bg-amber-50/50">
                  <td className="p-2.5 font-bold text-amber-800">{operations.canvas_seam.name}</td>
                  <td className="p-2.5 text-amber-700">{operations.canvas_seam.detail}</td>
                  <td className="p-2.5 text-right font-bold text-amber-800">{operations.canvas_seam.quantity} {operations.canvas_seam.unit}</td>
                  <td className="p-2.5 text-right text-slate-500">{formatVND(operations.canvas_seam.unit_price || 0)}</td>
                  <td className="p-2.5 text-right font-bold text-amber-800">{formatVND(operations.canvas_seam.total)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 font-extrabold text-sm bg-slate-50">
                <td colSpan={4} className="p-2.5 text-right text-slate-700">TỔNG GIÁ VỐN TOÀN BỘ:</td>
                <td className="p-2.5 text-right text-slate-900">{formatVND(summary.cost_price)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 print:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CopyOutlined /> Sao chép Prompt đầy đủ (ChatGPT)
          </button>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <RedoOutlined /> Tính lại / Chọn bảng khác
          </button>
        )}
      </div>
    </div>
  );
};
