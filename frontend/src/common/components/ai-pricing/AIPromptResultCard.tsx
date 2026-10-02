import React, { useState } from "react";
import { Tooltip, Tag, message } from "antd";
import {
  RobotOutlined,
  CopyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  DollarCircleOutlined,
  AppstoreOutlined,
  CalculatorOutlined,
  FileTextOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  CarOutlined,
  SettingOutlined,
  ApiOutlined
} from "@ant-design/icons";
import {
  formatVND,
  type SignboardQuoteResult,
  type AIVariantQuoteResult,
  type SignboardInput,
  COMPANY_INFO
} from "../../services/aiPricingEngine";

interface AIPromptResultCardProps {
  result: SignboardQuoteResult | AIVariantQuoteResult;
  rawAiText: string;
  aiSource: "gemini" | "openai" | "expert_engine";
  onCopyZalo: () => void;
  onCopyPrompt: () => void;
  onOpenConfigModal: () => void;
}

export const AIPromptResultCard: React.FC<AIPromptResultCardProps> = ({
  result,
  rawAiText,
  aiSource,
  onCopyZalo,
  onCopyPrompt,
  onOpenConfigModal
}) => {
  const { dimensions, materials, operations, summary, warnings } = result;
  const isVariant = "ai_variance_percent" in result && Boolean(result.ai_variance_percent);
  const variantData = isVariant ? (result as AIVariantQuoteResult) : null;
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  const handleCopyAiAnalysis = () => {
    navigator.clipboard.writeText(rawAiText);
    message.success("Đã sao chép toàn bộ bài phân tích của AI vào clipboard!");
  };

  return (
    <div className="space-y-5 text-slate-800 font-sans">
      {/* 1. TOP BANNER: AI EXPERT QUOTATION */}
      <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs">
                <RobotOutlined className="text-amber-300" />
                CHUYÊN GIA BÓC TÁCH & BÁO GIÁ AI
              </span>

              {aiSource === "gemini" ? (
                <Tag color="success" className="!rounded-full !font-bold !text-[11px] !border-none !px-2.5">
                  ⚡ Google Gemini Live
                </Tag>
              ) : aiSource === "openai" ? (
                <Tag color="processing" className="!rounded-full !font-bold !text-[11px] !border-none !px-2.5">
                  ⚡ OpenAI Live
                </Tag>
              ) : (
                <Tag color="cyan" className="!rounded-full !font-bold !text-[11px] !border-none !px-2.5">
                  🛡️ AI Xưởng Chuyên Gia (100% Chuẩn xác)
                </Tag>
              )}

              {variantData && (
                <Tag color="gold" className="!rounded-full !font-black !text-[11px] !border-none !px-2.5 !bg-amber-400 !text-slate-950 shadow-2xs">
                  Chênh lệch khách quan: +{variantData.ai_variance_percent}%
                </Tag>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl md:text-3xl font-black m-0 text-white tracking-tight">
                {formatVND(summary.quote_price)}
              </h2>
              <span className="text-xs text-cyan-200 font-medium">(Giá báo khách chưa VAT)</span>
            </div>

            <div className="text-xs text-cyan-100 mt-1.5 flex flex-wrap items-center gap-2">
              <span>Đơn giá: <b className="text-white font-bold">{formatVND(summary.price_per_sqm)} / m²</b></span>
              <span>•</span>
              <span>Quy cách: <b className="text-white font-bold">{dimensions.width}m x {dimensions.height}m ({dimensions.area} m²)</b></span>
              <span>•</span>
              <span>Lợi nhuận: <b className="text-emerald-200">+{summary.profit_margin_percent}% (+{formatVND(summary.profit_amount)})</b></span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowRawMarkdown(!showRawMarkdown)}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition-all border border-white/30 flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
            >
              {showRawMarkdown ? <CalculatorOutlined /> : <FileTextOutlined />}
              <span>{showRawMarkdown ? "Xem dạng thẻ & bảng" : "Xem văn bản Markdown AI"}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyAiAnalysis}
              className="px-3 py-1.5 rounded-xl bg-white text-cyan-900 font-bold text-xs hover:bg-cyan-50 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border-none"
            >
              <CopyOutlined /> Sao chép lời AI
            </button>
          </div>
        </div>
      </div>

      {/* 2. KHỐI THẨM ĐỊNH KHÁCH QUAN & CHÊNH LỆCH SO VỚI CỘT 1 (0 - 6%) */}
      {variantData && (
        <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-cyan-50/50 p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs mt-0.5">
                ±%
              </div>
              <div>
                <div className="font-extrabold text-slate-900 text-xs flex flex-wrap items-center gap-2">
                  <span>Thẩm định độc lập từ AI (Chênh lệch khách quan):</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-[11px] shadow-2xs">
                    +{variantData.ai_variance_percent}% (+{formatVND(variantData.ai_variance_amount)})
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  💡 <b>Cơ sở khách quan:</b> {variantData.ai_variance_reason}. Mức chênh lệch được AI tính toán tự động trong biên độ an toàn (0 - 6%) để phản ánh đúng thực tế thi công ngoài hiện trường.
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 border-t sm:border-t-0 sm:border-l border-amber-200/80 pt-2 sm:pt-0 sm:pl-4 text-[11px] space-y-0.5">
              <div className="text-slate-500">
                Định mức xưởng (Cột 1): <b className="text-slate-800 font-mono">{formatVND(variantData.base_quote_price)}</b>
              </div>
              <div className="text-cyan-800 font-bold">
                Báo giá AI (Cột 2): <b className="text-cyan-900 font-mono font-black">{formatVND(summary.quote_price)}</b>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NẾU ĐANG CHỌN XEM DẠNG RAW MARKDOWN THÔ */}
      {showRawMarkdown ? (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase">
              <FileTextOutlined className="text-cyan-600" />
              <span>Toàn văn bài phân tích do AI sinh ra (Markdown):</span>
            </div>
            <button
              type="button"
              onClick={onCopyPrompt}
              className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold cursor-pointer border-none bg-transparent flex items-center gap-1"
            >
              <CopyOutlined /> Copy Prompt gốc
            </button>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto border border-slate-200">
            {rawAiText}
          </div>
        </div>
      ) : (
        /* GIAO DIỆN CHỈN CHU THEO THẺ & BẢNG (TƯƠNG TỰ CỘT 1 NHƯNG THEO VĂN PHONG CHUYÊN GIA AI) */
        <>
          {/* 2. ⚠️ HỆ THỐNG CẢNH BÁO TƯ VẤN (BẮT BUỘC IN ĐẬM) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <WarningOutlined className="text-amber-500 text-base" />
                <h4 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wide m-0">
                  4. CẢNH BÁO TƯ VẤN (BẮT BUỘC IN ĐẬM)
                </h4>
              </div>
              <Tag color="warning" className="!rounded-full !font-bold !text-[10px] !m-0">
                Tuân thủ Hình 1, 2, 3
              </Tag>
            </div>

            <div className="space-y-2">
              {warnings && warnings.length > 0 ? (
                warnings.map((w, idx) => {
                  const isDanger = w.level === "danger";
                  const isWarning = w.level === "warning";
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                        isDanger
                          ? "bg-rose-50/80 border-rose-300 text-rose-950 shadow-2xs"
                          : isWarning
                          ? "bg-amber-50/80 border-amber-300 text-amber-950 shadow-2xs"
                          : "bg-blue-50/80 border-blue-200 text-blue-950"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isDanger ? (
                          <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center font-black shadow-xs">
                            ✕
                          </span>
                        ) : isWarning ? (
                          <WarningOutlined className="text-amber-600 text-base" />
                        ) : (
                          <InfoCircleOutlined className="text-blue-500 text-base" />
                        )}
                      </div>
                      <div className="text-xs leading-relaxed">
                        <strong className="block font-black uppercase tracking-wide text-slate-900 mb-0.5">
                          {w.title}:
                        </strong>
                        <span className="font-bold">{w.message}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircleOutlined className="text-emerald-600 text-sm" />
                  <span className="font-semibold">
                    Không phát hiện vi phạm quy cách kỹ thuật hoặc điều khoản từ chối bảo hành đối với kích thước này.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3. DIỄN GIẢI PHÉP TÍNH BÓC TÁCH (THẺ STEP CARDS) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <CalculatorOutlined className="text-cyan-600 text-base" />
                <h4 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wide m-0">
                  1. DIỄN GIẢI PHÉP TÍNH BÓC TÁCH
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">Công thức xưởng ADMAKE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Sắt khung */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ToolOutlined className="text-cyan-600" />
                  <span>Khung sắt hộp & Xương đan</span>
                </div>
                <div className="text-slate-600 leading-relaxed text-[11px]">
                  Bảng {dimensions.width}m x {dimensions.height}m (Chu vi {dimensions.perimeter}m). Đan xương ô vuông nhịp 1m-1.2m.
                </div>
                <div className="pt-1 text-slate-800 font-bold text-xs flex justify-between items-center border-t border-slate-200/60 mt-1">
                  <span className="text-cyan-700">{materials.iron_frame.quantity} cây 6m</span>
                  <span className="text-slate-900">{formatVND(materials.iron_frame.total)}</span>
                </div>
              </div>

              {/* Mặt bảng */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileTextOutlined className="text-teal-600" />
                  <span>Mặt bảng ({materials.surface.name})</span>
                </div>
                <div className="text-slate-600 leading-relaxed text-[11px]">
                  {materials.surface.detail}
                </div>
                <div className="pt-1 text-slate-800 font-bold text-xs flex justify-between items-center border-t border-slate-200/60 mt-1">
                  <span className="text-teal-700">Đơn giá: {formatVND(materials.surface.unit_price || 0)}</span>
                  <span className="text-slate-900">{formatVND(materials.surface.total)}</span>
                </div>
              </div>

              {/* Tôn lót */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <AppstoreOutlined className="text-indigo-600" />
                  <span>Tôn lót mặt sau (Khổ 1.2m)</span>
                </div>
                <div className="text-slate-600 leading-relaxed text-[11px]">
                  {materials.sheet_backing.active
                    ? `Bằng diện tích lọt lòng ${dimensions.area} m², tính theo khổ 1.2m = ${materials.sheet_backing.quantity} mét tới`
                    : "Không lót tôn (Lưu ý: Không bảo hành rách bạt do gió bão)"}
                </div>
                <div className="pt-1 text-slate-800 font-bold text-xs flex justify-between items-center border-t border-slate-200/60 mt-1">
                  <span className={materials.sheet_backing.active ? "text-indigo-700" : "text-slate-400"}>
                    {materials.sheet_backing.active ? `${materials.sheet_backing.quantity} mét tới` : "0 m"}
                  </span>
                  <span className="text-slate-900">{formatVND(materials.sheet_backing.total)}</span>
                </div>
              </div>

              {/* V viền & Phụ kiện */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircleOutlined className="text-amber-600" />
                  <span>V nhôm viền & Vật tư phụ</span>
                </div>
                <div className="text-slate-600 leading-relaxed text-[11px]">
                  V viền chu vi chia 3m ({materials.aluminum_trim.quantity} cây) + Keo, vít, que hàn khoán 100k.
                </div>
                <div className="pt-1 text-slate-800 font-bold text-xs flex justify-between items-center border-t border-slate-200/60 mt-1">
                  <span className="text-amber-700">Trọn gói phụ kiện</span>
                  <span className="text-slate-900">
                    {formatVND(materials.aluminum_trim.total + materials.accessories.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Chi phí vận hành summary */}
            <div className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-200 text-xs text-cyan-900 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CarOutlined className="text-cyan-600 text-base" />
                <span>
                  <b>Chi phí vận hành:</b> Nhân công ({dimensions.area} m² x 120k = {formatVND(operations.labor.total)}) + Xe ({formatVND(operations.transport.total)})
                  {operations.scaffolding.active ? ` + Dàn giáo (${formatVND(operations.scaffolding.total)})` : ""}
                  {operations.canvas_seam.active ? ` + Nối bạt (${formatVND(operations.canvas_seam.total)})` : ""}
                </span>
              </div>
              <span className="font-black text-cyan-800 text-sm">
                = {formatVND(operations.total_operations_cost)}
              </span>
            </div>
          </div>

          {/* 4. BẢNG CHI TIẾT GIÁ VỐN (COST PRICE TABLE) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <AppstoreOutlined className="text-slate-700 text-base" />
                <h4 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wide m-0">
                  2. BẢNG CHI TIẾT GIÁ VỐN (COST PRICE)
                </h4>
              </div>
              <span className="text-xs font-bold text-slate-800">
                Tổng giá vốn: <b className="text-cyan-700 text-sm">{formatVND(summary.cost_price)}</b>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200">
                    <th className="p-2.5 font-bold rounded-l-lg">Hạng mục</th>
                    <th className="p-2.5 font-bold">Quy cách / Định mức</th>
                    <th className="p-2.5 font-bold text-right">Khối lượng</th>
                    <th className="p-2.5 font-bold text-right">Đơn giá</th>
                    <th className="p-2.5 font-bold text-right rounded-r-lg">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Nhóm A */}
                  <tr className="bg-cyan-50/60 text-cyan-950 font-black">
                    <td colSpan={5} className="p-2 text-[11px] uppercase tracking-wider">
                      A. VẬT TƯ ĐẦU VÀO (Tổng: {formatVND(materials.total_materials_cost)})
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-800">1. Sắt hộp khung chính</td>
                    <td className="p-2.5 text-slate-500">{materials.iron_frame.name}</td>
                    <td className="p-2.5 text-right font-medium">{materials.iron_frame.quantity} cây 6m</td>
                    <td className="p-2.5 text-right text-slate-500">{formatVND(materials.iron_frame.unit_price || 0)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(materials.iron_frame.total)}</td>
                  </tr>
                  {materials.reinforce_iron.active && (
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800">2. Sắt gia cố chống</td>
                      <td className="p-2.5 text-slate-500">{materials.reinforce_iron.name}</td>
                      <td className="p-2.5 text-right font-medium">{materials.reinforce_iron.quantity} cây 6m</td>
                      <td className="p-2.5 text-right text-slate-500">{formatVND(materials.reinforce_iron.unit_price || 0)}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(materials.reinforce_iron.total)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-800">3. Mặt bảng quảng cáo</td>
                    <td className="p-2.5 text-slate-500">{materials.surface.name}</td>
                    <td className="p-2.5 text-right font-medium">-</td>
                    <td className="p-2.5 text-right text-slate-500">{formatVND(materials.surface.unit_price || 0)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(materials.surface.total)}</td>
                  </tr>
                  {materials.sheet_backing.active && (
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800">4. Tôn lót mặt sau</td>
                      <td className="p-2.5 text-slate-500">Khổ tôn 1.2m</td>
                      <td className="p-2.5 text-right font-medium">{materials.sheet_backing.quantity} mét tới</td>
                      <td className="p-2.5 text-right text-slate-500">{formatVND(materials.sheet_backing.unit_price || 0)}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(materials.sheet_backing.total)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-800">5. V nhôm bọc viền</td>
                    <td className="p-2.5 text-slate-500">Cây dài 3m</td>
                    <td className="p-2.5 text-right font-medium">{materials.aluminum_trim.quantity} cây</td>
                    <td className="p-2.5 text-right text-slate-500">{formatVND(materials.aluminum_trim.unit_price || 0)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(materials.aluminum_trim.total)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-800">6. Vật tư phụ</td>
                    <td className="p-2.5 text-slate-500">Keo, vít, que hàn...</td>
                    <td className="p-2.5 text-right font-medium">1 khoán</td>
                    <td className="p-2.5 text-right text-slate-500">{formatVND(materials.accessories.unit_price || 0)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(materials.accessories.total)}</td>
                  </tr>

                  {/* Nhóm B */}
                  <tr className="bg-teal-50/60 text-teal-950 font-black">
                    <td colSpan={5} className="p-2 text-[11px] uppercase tracking-wider">
                      B. CHI PHÍ VẬN HÀNH & THI CÔNG (Tổng: {formatVND(operations.total_operations_cost)})
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-800">1. Nhân công thi công</td>
                    <td className="p-2.5 text-slate-500">120.000 đ/m²</td>
                    <td className="p-2.5 text-right font-medium">{operations.labor.quantity} m²</td>
                    <td className="p-2.5 text-right text-slate-500">120.000 đ</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(operations.labor.total)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-800">2. Xe vận chuyển</td>
                    <td className="p-2.5 text-slate-500">Trọn gói chuyến</td>
                    <td className="p-2.5 text-right font-medium">1 chuyến</td>
                    <td className="p-2.5 text-right text-slate-500">200.000 đ</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(operations.transport.total)}</td>
                  </tr>
                  {operations.scaffolding.active && (
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800">3. Dàn giáo thi công</td>
                      <td className="p-2.5 text-slate-500">50.000 đ/bộ/ngày</td>
                      <td className="p-2.5 text-right font-medium">{operations.scaffolding.quantity} bộ.ngày</td>
                      <td className="p-2.5 text-right text-slate-500">50.000 đ</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(operations.scaffolding.total)}</td>
                    </tr>
                  )}
                  {operations.canvas_seam.active && (
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800">4. Nhân công nối bạt</td>
                      <td className="p-2.5 text-slate-500">15.000 đ/m dài (Cả 2 chiều &gt; 3.1m)</td>
                      <td className="p-2.5 text-right font-medium">{operations.canvas_seam.quantity} m</td>
                      <td className="p-2.5 text-right text-slate-500">15.000 đ</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(operations.canvas_seam.total)}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-xs border-t-2 border-slate-300">
                    <td colSpan={4} className="p-2.5 text-right uppercase text-slate-900">
                      TỔNG GIÁ VỐN TOÀN BỘ (A + B):
                    </td>
                    <td className="p-2.5 text-right text-cyan-800 text-sm font-black">
                      {formatVND(summary.cost_price)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 5. BẢNG BÁO GIÁ KHÁCH HÀNG (QUOTATION BREAKDOWN) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <DollarCircleOutlined className="text-emerald-600 text-base" />
                <h4 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wide m-0">
                  3. BẢNG BÁO GIÁ KHÁCH HÀNG (QUOTATION)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">Kỳ vọng lợi nhuận xưởng</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500">Tổng giá vốn</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">{formatVND(summary.cost_price)}</div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-[11px] text-emerald-700">Lãi kỳ vọng (+{summary.profit_margin_percent}%)</div>
                <div className="text-sm font-bold text-emerald-800 mt-0.5">+{formatVND(summary.profit_amount)}</div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-300 md:col-span-2">
                <div className="text-[11px] text-cyan-700 font-bold uppercase">👉 GIÁ BÁO KHÁCH (CHƯA VAT)</div>
                <div className="text-base md:text-lg font-black text-cyan-900 mt-0.5">
                  {formatVND(summary.quote_price)}
                  <span className="text-xs font-normal text-slate-600 block md:inline md:ml-2">
                    ({formatVND(summary.price_per_sqm)} / m²)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
