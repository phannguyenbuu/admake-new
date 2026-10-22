import React from "react";
import { Input, Tooltip, Spin } from "antd";
import { Send, Paperclip, X } from "lucide-react";
import type { SignSampleItem, AttachedImage } from "./types";
import { encodeStaticPath } from "./aiText";

interface StudioSurveyStepProps {
  attachedImage: AttachedImage | null;
  setAttachedImage: (img: AttachedImage | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  processImageFile: (file: File) => void;
  clientPrompt: string;
  setClientPrompt: (val: string) => void;
  isGenerating3D: boolean;
  isAnalyzingVision: boolean;
  handleAnalyze: () => void;
  cancelAnalyze: () => void;
  signSamples: SignSampleItem[];
  selectedSampleId: string;
  selectedSample: SignSampleItem | null;
  attachSampleImage: (url: string, name: string) => Promise<void>;
  sampleCategoryFilter: string;
  setSampleCategoryFilter: (cat: string) => void;
  handleSelectSignSample: (sample: SignSampleItem) => void;
}

export const StudioSurveyStep: React.FC<StudioSurveyStepProps> = ({
  attachedImage,
  setAttachedImage,
  fileInputRef,
  processImageFile,
  clientPrompt,
  setClientPrompt,
  isGenerating3D,
  isAnalyzingVision,
  handleAnalyze,
  cancelAnalyze,
  signSamples,
  selectedSampleId,
  selectedSample,
  attachSampleImage,
  sampleCategoryFilter,
  setSampleCategoryFilter,
  handleSelectSignSample,
}) => {
  const busy = isGenerating3D || isAnalyzingVision;
  return (
    <div className="flex flex-col space-y-4">
      {/* KHỐI 1: KHẢO SÁT & NHẬP YÊU CẦU (Khung ảnh Ctrl+V + Textarea + Nút CTA hình tròn) */}
      <div className="flex flex-col h-[270px] md:h-[280px] bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 space-y-2.5 justify-between">
        {/* 1. KHU VỰC HÌNH ẢNH (IMAGES / ATTACH / CTRL+V) */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-1 shrink-0">
            <label className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
              <span>Hình ảnh đính kèm / Khảo sát hiện trạng</span>
              <span className="text-[11px] text-slate-400 font-normal">(Ctrl+V để dán, tối đa 1 hình)</span>
            </label>
            {attachedImage && (
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="text-[11px] text-red-500 hover:text-red-700 font-semibold cursor-pointer flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Bỏ ảnh
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                processImageFile(file);
              }
              e.target.value = "";
            }}
          />

          {attachedImage ? (
            <div className="relative flex-1 min-h-0 rounded-xl border border-blue-200 bg-blue-50/50 p-2 flex items-center gap-3 overflow-hidden">
              <div className="relative h-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-900/5 border border-slate-200 shrink-0">
                <img
                  src={attachedImage.dataUrl}
                  alt="Đính kèm"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0 text-xs flex flex-col justify-center">
                <div className="font-bold text-slate-800 truncate" title={attachedImage.name}>
                  {attachedImage.name}
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  {(attachedImage.size / 1024).toFixed(0)} KB • Đã sẵn sàng phân tích
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                title="Bỏ ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex gap-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 min-h-0 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl p-2.5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 text-xs text-slate-500 select-none group"
              >
                <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 flex items-center justify-center transition-colors">
                  <Paperclip className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-slate-700 group-hover:text-blue-600">Nhấn chọn ảnh</span>
                  <span> hoặc dán </span>
                  <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono text-slate-600">Ctrl + V</kbd>
                </div>
                <span className="text-[10px] text-slate-400">Không có ảnh: AI dựng 3D từ mô tả bên dưới</span>
              </div>

              {selectedSample && (
                <div className="w-[38%] min-h-0 rounded-xl border border-slate-200 bg-slate-50 p-1.5 flex flex-col gap-1 text-[10px]">
                  <img
                    src={selectedSample.image_url}
                    alt={selectedSample.title}
                    className="w-full flex-1 min-h-0 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => attachSampleImage(selectedSample.image_url, selectedSample.image_filename)}
                    className="w-full py-1 rounded-md bg-white border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 cursor-pointer"
                    title="Gửi ảnh mẫu này cho AI Vision phân tích"
                  >
                    Dùng ảnh mẫu này
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. CỤM TEXTAREA PROMPT VÀ NÚT CTA HÌNH TRÒN ICON ARROW PLANE BÊN PHẢI */}
        <div className="shrink-0 space-y-1">
          <label className="text-xs text-slate-700 font-bold block">
            Yêu cầu thiết kế / Ghi chú khách hàng:
          </label>
          <div className="relative flex items-end gap-2 bg-slate-50 hover:bg-slate-100/70 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 border border-slate-200 rounded-2xl p-1.5 transition-all">
            <Input.TextArea
              rows={2}
              value={clientPrompt}
              onChange={(e) => setClientPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!busy) handleAnalyze();
                }
              }}
              placeholder="Nhập mô tả yêu cầu hoặc nhấn icon gửi bên phải..."
              className="border-none! bg-transparent! shadow-none! resize-none! text-slate-800 text-xs md:text-sm leading-relaxed p-1 focus:ring-0!"
            />

            <Tooltip
              title={
                isAnalyzingVision
                  ? "Đang phân tích ảnh... bấm để hủy"
                  : isGenerating3D
                  ? "Đang dựng 3D..."
                  : attachedImage
                  ? "Phân tích ảnh khảo sát bằng AI Vision (Enter)"
                  : "Dựng 3D từ mô tả (Enter)"
              }
            >
              <button
                type="button"
                disabled={isGenerating3D}
                onClick={isAnalyzingVision ? cancelAnalyze : handleAnalyze}
                className={`group/cta w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all duration-200 cursor-pointer ${
                  isGenerating3D
                    ? "bg-blue-400 cursor-not-allowed opacity-80"
                    : isAnalyzingVision
                    ? "bg-blue-500 hover:bg-rose-500"
                    : "bg-blue-600 hover:bg-blue-500 active:scale-90 hover:scale-105 hover:shadow-lg text-white"
                }`}
              >
                {isAnalyzingVision ? (
                  <>
                    <Spin size="small" className="brightness-200 group-hover/cta:hidden" />
                    <X className="w-5 h-5 text-white hidden group-hover/cta:block" />
                  </>
                ) : isGenerating3D ? (
                  <Spin size="small" className="brightness-200" />
                ) : (
                  <Send className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* KHỐI 2: THƯ VIỆN NHIỀU ẢNH MẪU THỰC TẾ */}
      <div className="flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 space-y-3">
        {/* Header & Bộ lọc danh mục */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500 font-bold text-sm">🖼️</span>
            <span className="font-bold text-slate-800 text-xs md:text-sm">
              Mẫu Bảng Hiệu Thực Tế ({signSamples.length} mẫu)
            </span>
            <span className="text-[11px] text-[#00b4b6] font-semibold hidden sm:inline">
              • Bấm ảnh để nạp mô hình 3D
            </span>
          </div>

          {/* Pills lọc danh mục */}
          <div className="flex items-center gap-1 text-[11px]">
            {[
              { key: "all", label: "Tất cả" },
              { key: "billboard", label: "Billboard" },
              { key: "storefront", label: "Mặt tiền" },
              { key: "mini", label: "Biển vẫy" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSampleCategoryFilter(tab.key)}
                className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  sampleCategoryFilter === tab.key
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid hiển thị danh sách nhiều ảnh mẫu thực tế từ signs/ */}
        <div className="grid grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
          {signSamples
            .filter((s) => {
              if (sampleCategoryFilter === "all") return true;
              return s.category === sampleCategoryFilter;
            })
            .map((sample) => {
              const isSelected = selectedSampleId === sample.id;
              return (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSignSample(sample)}
                  className={`group relative flex flex-col rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer select-none bg-white min-h-[165px] ${
                    isSelected
                      ? "border-blue-600 ring-2 ring-blue-500/30 bg-blue-50/40 shadow-sm"
                      : "border-slate-200 hover:border-blue-400 hover:shadow-xs"
                  }`}
                >
                  <div className="relative w-full h-28 sm:h-32 bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={encodeURI(sample.image_url)}
                      alt={sample.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 block"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.triedStatic) {
                          target.dataset.triedStatic = "1";
                          target.src = encodeStaticPath("/static/signs/", sample.image_filename);
                        }
                      }}
                    />
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur-xs text-[10px] font-bold text-white shadow-xs">
                      {sample.badge}
                    </span>
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-blue-600/90 text-[10px] font-mono font-bold text-white shadow-xs">
                      {sample.dimensions.width}m × {sample.dimensions.height}m
                    </span>
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                        <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          ✓ Đang hiển thị 3D
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-2 flex flex-col justify-between flex-1 gap-1 bg-white">
                    <div className="text-[11px] font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors" title={sample.title}>
                      {sample.title}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate font-sans font-medium text-slate-500">
                        {sample.dimensions?.width}×{sample.dimensions?.height}m
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {sample.obj_url && (
                          <a
                            href={encodeURI(sample.obj_url)}
                            download={sample.obj_filename || `${sample.title}.obj`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-1.5 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 text-[10px] transition-colors"
                            title="Tải file 3D Wavefront (.obj)"
                          >
                            OBJ
                          </a>
                        )}
                        <span className="text-[#00b4b6] font-bold shrink-0">3D</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
