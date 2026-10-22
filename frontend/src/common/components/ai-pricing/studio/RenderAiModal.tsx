/**
 * RenderAiModal.tsx - Modal Render AI Phối Cảnh Thực Tế (Phong cách MzPic Action Single Prompt)
 * Tích hợp 3 Combobox (Thời điểm, Hướng, Môi trường), Hình chụp 3D Screen và Single Prompt chuẩn Toolxprint GenAI
 */

import React, { useState, useEffect } from "react";
import { Modal, Tooltip } from "antd";
import { Sparkles, Camera, RotateCcw, X, Clock, SunMedium, Compass, Trees, Image as ImageIcon } from "lucide-react";
import type { Signboard3DModel } from "../../../services/genaiSignboard.service";

const TIME_OF_DAY_OPTIONS = [
  { value: "bình minh", label: "Bình minh (Nắng ấm nhẹ)" },
  { value: "buổi sáng", label: "Buổi sáng (Trong trẻo rực rỡ)" },
  { value: "buổi trưa", label: "Buổi trưa (Nắng gắt đỉnh đầu)" },
  { value: "buổi chiều", label: "Buổi chiều (Nắng hoàng kim)" },
  { value: "hoàng hôn", label: "Hoàng hôn (Tím đỏ lãng mạn)" },
  { value: "buổi tối", label: "Buổi tối (Đêm lên đèn rực rỡ)" },
  { value: "buổi tối có trăng", label: "Buổi tối có trăng huyền ảo" },
];

const DIRECTION_OPTIONS = [
  { value: "tây nam", label: "Hướng Tây Nam (Mặc định)" },
  { value: "đông nam", label: "Hướng Đông Nam" },
  { value: "tây bắc", label: "Hướng Tây Bắc" },
  { value: "đông bắc", label: "Hướng Đông Bắc" },
  { value: "đông", label: "Hướng Đông" },
  { value: "tây", label: "Hướng Tây" },
  { value: "nam", label: "Hướng Nam" },
  { value: "bắc", label: "Hướng Bắc" },
];

const ENVIRONMENT_OPTIONS = [
  { value: "đô thị lớn", label: "Đô thị lớn sầm uất" },
  { value: "đô thị nhỏ", label: "Đô thị nhỏ / Thị trấn" },
  { value: "gần tòa nhà văn phòng", label: "Gần tòa nhà văn phòng" },
  { value: "gần chung cư", label: "Gần chung cư cao cấp" },
  { value: "quốc lộ", label: "Mặt tiền Quốc lộ" },
  { value: "xa lộ", label: "Xa lộ (Cao tốc thoáng đãng)" },
  { value: "đồng lúa", label: "Đồng lúa xanh mát" },
  { value: "đồng cỏ", label: "Đồng cỏ rộng mở" },
  { value: "rừng", label: "Rừng cây xanh mát" },
];

const PROMPT_SUGGESTIONS = [
  { label: "🌟 Khai trương đông đúc", text: "Khai trương sầm uất, hoa tươi trang trí, khách hàng tấp nập vào ra, không khí lễ hội vui tươi rực rỡ" },
  { label: "🏙️ Mặt tiền phố lớn", text: "Mặt tiền nhà phố kinh doanh hiện đại tại trung tâm thương mại sầm uất, vỉa hè lát đá sạch sẽ, ô tô và người đi bộ" },
  { label: "🌆 Đêm đèn rực rỡ", text: "Thời điểm ban đêm, hiệu ứng ánh sáng đèn LED biển hiệu hắt sáng lung linh, đèn đường và ánh đèn ấm áp thu hút" },
  { label: "🛣️ Pano tấm lớn cao tốc", text: "Bảng hiệu quảng cáo tấm lớn đặt ven xa lộ cao tốc thoáng đãng, bầu trời rộng mở, tầm nhìn từ xa hoành tráng" },
  { label: "☕ Cafe / Showroom mộc", text: "Không gian ấm cúng sang trọng, cây xanh và kiến trúc hài hòa, vật liệu biển hiệu chân thực" },
];

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 Ngang", desc: "Phối cảnh rộng" },
  { value: "4:3", label: "4:3 Chuẩn", desc: "Tiêu chuẩn ảnh" },
  { value: "1:1", label: "1:1 Vuông", desc: "Mạng xã hội" },
  { value: "9:16", label: "9:16 Dọc", desc: "Story / Mobile" },
];

interface RenderAiModalProps {
  open: boolean;
  onClose: () => void;
  model3D: Signboard3DModel | null;
  timeOfDay: string;
  setTimeOfDay: (v: string) => void;
  direction: string;
  setDirection: (v: string) => void;
  environment: string;
  setEnvironment: (v: string) => void;
  onCaptureSnapshot: () => string | null;
  onStartRender: (params: { prompt: string; aspectRatio: string; snapshot: string | null }) => void;
  isRendering?: boolean;
}

export const RenderAiModal: React.FC<RenderAiModalProps> = ({
  open,
  onClose,
  model3D,
  timeOfDay,
  setTimeOfDay,
  direction,
  setDirection,
  environment,
  setEnvironment,
  onCaptureSnapshot,
  onStartRender,
  isRendering = false,
}) => {
  const [prompt, setPrompt] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  // Khi modal mở: tự động chụp 3D screen hiện tại và nạp prompt ban đầu
  useEffect(() => {
    if (open) {
      const snap = onCaptureSnapshot();
      setSnapshotUrl(snap);
      if (model3D?.render_prompt) {
        setPrompt(model3D.render_prompt);
      } else if (!prompt) {
        setPrompt("Phối cảnh thực tế mặt tiền kinh doanh ngoài trời, góc nhìn người đi đường, chi tiết kiến trúc chân thực, ánh sáng tự nhiên");
      }
    }
  }, [open, model3D]);

  const handleRetakeSnapshot = () => {
    const snap = onCaptureSnapshot();
    setSnapshotUrl(snap);
  };

  const handleApplySuggestion = (text: string) => {
    setPrompt(text);
  };

  const handleConfirmRender = () => {
    // Gom toàn bộ yêu cầu: Single Prompt + Thời điểm + Hướng + Môi trường + Kích thước + Chuẩn in ấn mzpic
    const parts = [
      prompt.trim(),
      `thời điểm ${timeOfDay}`,
      `hướng ánh sáng ${direction}`,
      `bối cảnh môi trường ${environment}`,
      model3D?.dimensions ? `kích thước bảng hiệu ${model3D.dimensions.width}m × ${model3D.dimensions.height}m × ${model3D.dimensions.depth || 0.12}m` : "",
      model3D?.materials_spec ? `kết cấu mặt biển ${model3D.materials_spec.surface_type || "Alu"}, khung ${model3D.materials_spec.iron_type || "sắt"}${model3D.materials_spec.has_led ? ", đèn LED hắt sáng" : ""}` : "",
      // mzpic hidden prompt standard for photorealistic print render:
      "chụp ảnh thực tế photorealistic 4k, chi tiết vật liệu biển hiệu quảng cáo chính xác theo khối 3D, tỉ lệ thực tế, góc nhìn góc phối cảnh camera 3D chuẩn xác, ánh sáng đổ bóng tự nhiên, không biến dạng kết cấu kiến trúc",
    ].filter(Boolean);

    const combinedPrompt = parts.join(", ");
    onStartRender({ prompt: combinedPrompt, aspectRatio, snapshot: snapshotUrl });
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={780}
      centered
      destroyOnClose
      closeIcon={<X className="w-4 h-4 text-slate-400 hover:text-slate-700" />}
      className="p-0 [&_.ant-modal-content]:rounded-3xl [&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:p-0 [&_.ant-modal-content]:border [&_.ant-modal-content]:border-slate-200 [&_.ant-modal-content]:shadow-2xl"
    >
      <div className="flex flex-col bg-white">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50/60 to-sky-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#00b4b6] to-[#0284c7] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 m-0 leading-tight">Render AI Phối Cảnh Thực Tế</h3>
              <p className="text-xs text-slate-500 m-0">Sinh ảnh phối cảnh thực tế từ mô hình 3D bằng GenAI</p>
            </div>
          </div>
          {model3D?.dimensions && (
            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              📐 {model3D.dimensions.width}m × {model3D.dimensions.height}m
            </span>
          )}
        </div>

        {/* Body Modal */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* 1. Hình chụp 3D Screen hiện tại & Khổ ảnh */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
            {/* Thumbnail 3D Screen */}
            <div className="sm:col-span-2 relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 min-h-[140px] flex items-center justify-center group shadow-xs">
              {snapshotUrl ? (
                <img src={snapshotUrl} alt="3D Snapshot" className="w-full h-full max-h-[160px] object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-1 p-4">
                  <ImageIcon className="w-6 h-6 opacity-60" />
                  <span className="text-xs">Đang chụp 3D screen...</span>
                </div>
              )}
              <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                <Camera className="w-3 h-3 text-teal-400" />
                <span>3D Screen Hiện Tại</span>
              </div>
              <button
                type="button"
                onClick={handleRetakeSnapshot}
                className="absolute bottom-2 right-2 px-2.5 py-1 rounded-xl bg-white/90 hover:bg-white text-slate-700 text-[11px] font-semibold flex items-center gap-1 shadow-md cursor-pointer transition-all border border-slate-200"
                title="Chụp lại góc camera hiện tại trên canvas 3D"
              >
                <Camera className="w-3 h-3 text-[#00b4b6]" />
                <span>Chụp lại góc 3D</span>
              </button>
            </div>

            {/* Bộ chọn Tỷ lệ Khung hình */}
            <div className="flex flex-col justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/70 gap-2">
              <span className="text-xs font-bold text-slate-700">Tỷ lệ khung hình</span>
              <div className="grid grid-cols-2 gap-1.5 flex-1">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setAspectRatio(r.value)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      aspectRatio === r.value
                        ? "bg-teal-50 border-[#00b4b6] text-[#00b4b6] shadow-xs font-bold"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span>{r.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. 3 Comboboxes: Thời điểm, Hướng, Môi trường */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Thời điểm ánh sáng</span>
              </label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 hover:bg-white text-slate-800 border border-slate-200 text-xs font-semibold cursor-pointer transition-all appearance-none outline-none focus:border-[#00b4b6] focus:bg-white"
              >
                {TIME_OF_DAY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-sky-500" />
                <span>Hướng ánh sáng</span>
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 hover:bg-white text-slate-800 border border-slate-200 text-xs font-semibold cursor-pointer transition-all appearance-none outline-none focus:border-[#00b4b6] focus:bg-white"
              >
                {DIRECTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Trees className="w-3.5 h-3.5 text-emerald-600" />
                <span>Môi trường xung quanh</span>
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 hover:bg-white text-slate-800 border border-slate-200 text-xs font-semibold cursor-pointer transition-all appearance-none outline-none focus:border-[#00b4b6] focus:bg-white"
              >
                {ENVIRONMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Action Single Prompt (phong cách mzpic.com) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00b4b6]" />
                <span>Nội dung mô tả (Single Prompt)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">{prompt.length} ký tự</span>
                <button
                  type="button"
                  onClick={() => setPrompt("")}
                  className="text-[11px] text-slate-400 hover:text-rose-500 cursor-pointer flex items-center gap-0.5"
                  title="Xóa nội dung"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Nhập mô tả bối cảnh phối cảnh thực tế (VD: Mặt tiền cửa hàng phố đi bộ sầm uất, khách hàng qua lại tấp nập, ánh sáng ấm cúng chân thực...)"
              className="w-full bg-slate-50 hover:bg-white focus:bg-white text-slate-800 placeholder-slate-400 text-xs rounded-2xl p-3 border border-slate-200 focus:border-[#00b4b6] focus:outline-hidden resize-none leading-relaxed transition-colors shadow-inner"
            />

            {/* Chips gợi ý nhanh 1-click phong cách MzPic */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[11px] text-slate-400 font-semibold shrink-0">Gợi ý nhanh:</span>
              {PROMPT_SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleApplySuggestion(s.text)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-teal-50 hover:text-[#00b4b6] hover:border-teal-200 text-slate-600 border border-slate-200 cursor-pointer transition-all shadow-2xs"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-semibold text-xs cursor-pointer transition-colors"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleConfirmRender}
            disabled={isRendering || !prompt.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4b6] to-[#0284c7] hover:from-[#00a2a4] hover:to-[#0275b0] text-white text-xs font-bold shadow-md cursor-pointer transition-all hover:scale-102 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
            <span>Render AI</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
