import React from "react";
import { Button, Tag, Input, Progress, Tooltip, Slider } from "antd";
import { Edit3, Image as ImageIcon, Square, FileSpreadsheet, Printer, FileText, CheckCircle2 } from "lucide-react";
import type { GenAIJob, InpaintPin, Signboard3DModel } from "../../../services/genaiSignboard.service";
import { sanitizeBrand } from "./aiText";
import { OverallPricingBreakdown } from "./OverallPricingBreakdown";
import { formatVND } from "../../../services/aiPricingEngine";
import type { StudioQuoteResult } from "./studioQuote";

interface StudioRenderStepsProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  aspectRatio: string;
  setAspectRatio: (val: string) => void;
  renderStyle: string;
  setRenderStyle: (val: string) => void;
  customEditPrompt: string;
  setCustomEditPrompt: (val: string) => void;
  pins: InpaintPin[];
  setPins: (pins: InpaintPin[]) => void;
  isPinMode: boolean;
  setIsPinMode: (val: boolean) => void;
  isEditing: boolean;
  isRendering: boolean;
  activeRenderUrl: string | null;
  handleContinuousEdit: () => Promise<void>;
  handleRenderGenAI: () => Promise<void>;
  genAiJob: GenAIJob | null;
  cancelRender: () => void;
  // Các props bổ sung cho Bảng giá tổng hợp & Báo giá cuối cùng
  model3D?: Signboard3DModel | null;
  quoteResult?: StudioQuoteResult | null;
  selectedIron?: string;
  selectedSurface?: string;
  onMaterialChange?: (type: "iron" | "surface", key: string) => void;
  profitMargin?: number;
  setProfitMargin?: (val: number) => void;
  handleCopyZaloQuote?: () => void;
  handlePrintQuote?: () => void;
  onExportTwoPagePdf?: () => void;
}

export const StudioRenderSteps: React.FC<StudioRenderStepsProps> = ({
  currentStep,
  setCurrentStep,
  aspectRatio,
  setAspectRatio,
  renderStyle,
  setRenderStyle,
  customEditPrompt,
  setCustomEditPrompt,
  pins,
  setPins,
  isPinMode,
  setIsPinMode,
  isEditing,
  isRendering,
  activeRenderUrl,
  handleContinuousEdit,
  handleRenderGenAI,
  genAiJob,
  cancelRender,
  model3D,
  quoteResult,
  selectedIron,
  selectedSurface,
  onMaterialChange,
  profitMargin = 30,
  setProfitMargin,
  handleCopyZaloQuote,
  handlePrintQuote,
  onExportTwoPagePdf,
}) => {
  return (
    <>
      {/* STEP 4: CHỈNH SỬA PHỐI CẢNH & CHI TIẾT */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <Edit3 className="w-4 h-4" /> 4. Chỉnh Sửa Phối Cảnh & Chi Tiết
            </span>
            <Tag color={isPinMode ? "orange" : "blue"}>{isPinMode ? "Đang Cắm Mốc (Pins)" : "Sửa Toàn Bộ"}</Tag>
          </div>

          {/* Tùy chọn Tỷ lệ & Phong cách */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-slate-600 mb-1 block font-semibold">Tỷ lệ khung hình:</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-700 focus:border-blue-500 font-medium"
              >
                <option value="16:9">16:9 (Toàn cảnh rộng)</option>
                <option value="4:3">4:3 (Tiêu chuẩn)</option>
                <option value="1:1">1:1 (Vuông)</option>
                <option value="9:16">9:16 (Dọc Story/TikTok)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600 mb-1 block font-semibold">Ánh sáng / Phối cảnh:</label>
              <select
                value={renderStyle}
                onChange={(e) => setRenderStyle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-700 focus:border-blue-500 font-medium"
              >
                <option value="Photorealistic Architectural">Kiến trúc chân thực ban ngày</option>
                <option value="Night Lights Neon">Đêm rực rỡ đèn LED</option>
                <option value="Golden Hour Sunset">Hoàng hôn nắng vàng</option>
                <option value="Commercial High-end">Thương mại cao cấp sang trọng</option>
              </select>
            </div>
          </div>

          {/* Input Chỉnh Sửa Tiếp */}
          <div>
            <label className="text-xs text-slate-700 font-semibold mb-1 block">
              Nhập yêu cầu sửa ảnh (Prompt Update):
            </label>
            <Input.TextArea
              rows={3}
              value={customEditPrompt}
              onChange={(e) => setCustomEditPrompt(e.target.value)}
              placeholder="VD: Đổi chữ nổi sang màu vàng gold sáng bóng, led hắt chân màu vàng ấm, thêm cây xanh trang trí mặt tiền..."
              className="bg-white border-slate-300 text-slate-800 rounded-xl focus:border-blue-500 text-xs"
            />
          </div>

          {/* Nút bật chế độ Cắm mốc (Inpainting Pins) */}
          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-700">
              Cắm mốc sửa cục bộ: <span className="font-bold text-amber-600">{pins.length} điểm</span>
            </span>
            <div className="flex gap-2">
              {pins.length > 0 && (
                <Button size="small" danger onClick={() => setPins([])}>
                  Xóa mốc
                </Button>
              )}
              <Button
                size="small"
                type={isPinMode ? "primary" : "default"}
                onClick={() => setIsPinMode(!isPinMode)}
              >
                {isPinMode ? "Tắt cắm mốc" : "Bật cắm mốc (Pins)"}
              </Button>
            </div>
          </div>

          {/* Nút Render Phối Cảnh sang Bước 5 */}
          <Button
            type="primary"
            size="large"
            loading={isEditing || isRendering}
            onClick={async () => {
              if (activeRenderUrl && (customEditPrompt.trim() || pins.length > 0)) {
                await handleContinuousEdit();
              } else {
                await handleRenderGenAI();
              }
            }}
            className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 font-bold h-11 rounded-xl shadow-xs text-white border-none cursor-pointer"
          >
            🎨 Tiến Hành Render Phối Cảnh Thực Tế (Bước 5) →
          </Button>

          <div className="flex justify-between items-center pt-1 text-xs">
            <Button onClick={() => setCurrentStep(3)} className="text-slate-600">
              ← Quay lại Chọn Vật Liệu (Bước 3)
            </Button>
            {activeRenderUrl && (
              <Button onClick={() => setCurrentStep(5)} type="link" className="text-blue-600 font-semibold p-0">
                Xem kết quả Render gần nhất →
              </Button>
            )}
          </div>
        </div>
      )}

      {/* STEP 5: BẢNG GIÁ TỔNG HỢP (KÈM NÚT PDF XUẤT HÌNH RENDER) */}
      {currentStep === 5 && (
        <div className="space-y-3">
          {/* Trạng thái công việc render (chỉ hiện khi đang xử lý) */}
          {genAiJob && (isRendering || isEditing) && (
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2 shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-semibold">Trạng thái:</span>
                <strong className={genAiJob.status === "failed" ? "text-rose-600" : "text-blue-600"}>
                  {sanitizeBrand(genAiJob.current_step || (genAiJob as any).error || "Đang xử lý")}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <Progress
                    percent={genAiJob.progress || 20}
                    status={genAiJob.status === "completed" ? "success" : genAiJob.status === "failed" ? "exception" : "active"}
                    strokeColor={{ "0%": "#2563eb", "100%": "#10b981" }}
                    className="mb-0!"
                  />
                </div>
                <Tooltip title="Dừng render">
                  <button
                    type="button"
                    onClick={cancelRender}
                    className="w-7 h-7 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-2xs"
                  >
                    <Square className="w-3 h-3 fill-current" />
                  </button>
                </Tooltip>
              </div>
            </div>
          )}

          {/* BẢNG GIÁ TỔNG THỂ DUY NHẤT (NÚT PDF XUẤT RA HÌNH RENDER LUÔN) */}
          <OverallPricingBreakdown
            model3D={model3D || null}
            quoteResult={quoteResult || null}
            selectedIron={selectedIron}
            selectedSurface={selectedSurface}
            onMaterialChange={onMaterialChange}
            defaultCollapsed={false}
            onExportPdf={onExportTwoPagePdf}
          />
        </div>
      )}
    </>
  );
};
