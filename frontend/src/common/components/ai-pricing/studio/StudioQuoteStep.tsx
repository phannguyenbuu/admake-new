import React from "react";
import { Button, Tag, Slider } from "antd";
import { FileSpreadsheet } from "lucide-react";
import { formatVND } from "../../../services/aiPricingEngine";
import type { StudioQuoteResult } from "./studioQuote";

interface StudioQuoteStepProps {
  setCurrentStep: (step: number) => void;
  profitMargin: number;
  setProfitMargin: (val: number) => void;
  quoteResult: StudioQuoteResult | null;
  handleCopyZaloQuote: () => void;
  handlePrintQuote: () => void;
}

export const StudioQuoteStep: React.FC<StudioQuoteStepProps> = ({
  setCurrentStep,
  profitMargin,
  setProfitMargin,
  quoteResult,
  handleCopyZaloQuote,
  handlePrintQuote,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#00b4b6] uppercase tracking-wider flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4" /> 3. Báo Giá & Điều Chỉnh Lợi Nhuận
        </span>
        <Tag color="green">Dự Toán AI</Tag>
      </div>

      {/* Điều chỉnh Tỷ Lệ Lợi Nhuận (giá tự tính lại) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="text-slate-600 font-semibold">Tỷ lệ lợi nhuận kỳ vọng:</span>
          <span className="font-bold text-amber-600">{profitMargin}%</span>
        </div>
        <Slider min={10} max={60} value={profitMargin} onChange={(val) => setProfitMargin(val)} />
      </div>

      {!quoteResult && (
        <div className="p-3 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 text-center">
          Chưa có mô hình 3D để dự toán. Anh chọn mẫu hoặc phân tích yêu cầu ở bước Khảo sát trước.
        </div>
      )}

      {/* Tóm Tắt Chi Phí */}
      {quoteResult && (
        <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 text-xs shadow-xs text-slate-700">
          <div className="flex justify-between text-slate-600">
            <span>Tổng Chi Phí Vật Tư (A):</span>
            <span className="font-mono font-semibold">{formatVND(quoteResult.materials.total_materials_cost)}</span>
          </div>
          {quoteResult.led.active && (
            <div className="flex justify-between text-slate-500 pl-3">
              <span>↳ gồm {quoteResult.led.name}:</span>
              <span className="font-mono">{formatVND(quoteResult.led.total)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Tổng Chi Phí Nhân Công (B):</span>
            <span className="font-mono font-semibold">{formatVND(quoteResult.operations.total_operations_cost)}</span>
          </div>
          <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1.5">
            <span>Giá Vốn Sản Xuất (A + B):</span>
            <span className="font-mono font-bold text-slate-800">{formatVND(quoteResult.summary.cost_price)}</span>
          </div>
          <div className="flex justify-between text-amber-600 font-bold">
            <span>Lợi Nhuận Kỳ Vọng ({profitMargin}%):</span>
            <span className="font-mono">+{formatVND(quoteResult.summary.profit_amount)}</span>
          </div>
          <div className="flex justify-between text-blue-700 font-extrabold text-base border-t border-slate-200 pt-2">
            <span>Tổng Giá Báo Khách:</span>
            <span className="font-mono text-base">{formatVND(quoteResult.summary.quote_price)}</span>
          </div>
        </div>
      )}

      {/* Thao Tác Báo Giá */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Button
          onClick={handleCopyZaloQuote}
          disabled={!quoteResult}
          className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-blue-500 hover:text-blue-600 font-bold rounded-xl h-10 shadow-2xs"
        >
          📋 Sao Chép Báo Giá
        </Button>
        <Button
          type="primary"
          onClick={handlePrintQuote}
          disabled={!quoteResult}
          className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl h-10 text-white shadow-xs"
        >
          🖨️ In Bảng Dự Toán
        </Button>
      </div>

      <div className="text-center pt-2">
        <Button onClick={() => setCurrentStep(2)} type="link" className="text-xs text-[#00b4b6] hover:text-[#008f91]">
          ← Quay lại 3D Editor & Vật Liệu (Bước 2)
        </Button>
      </div>
    </div>
  );
};
