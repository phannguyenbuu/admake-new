import React, { useState } from "react";
import { Input, Switch, Select, message, Spin, Tooltip } from "antd";
import {
  ThunderboltOutlined,
  CameraOutlined,
  PictureOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Sparkles } from "lucide-react";
import type { AiEngine, AspectRatio, Resolution, ProPresets, AiStudioImageItem } from "../types";

const { TextArea } = Input;

interface AiCreateTabProps {
  apiHost: string;
  hasGeminiKey: boolean;
  hasGptKey: boolean;
  onImageCreated: (img: AiStudioImageItem) => void;
  externalPrompt?: string;
}

const QUICK_TAGS = [
  "Bảng hiệu alu chữ nổi mica đèn LED sáng chân quán cafe phong cách tối giản",
  "Mặt tiền showroom nội thất cao cấp biển hiệu kim loại sang trọng ban đêm",
  "Hộp đèn siêu mỏng in bạt 3M không gân sắc nét trung tâm thương mại",
  "Biển vẫy hút nổi mica 2 mặt logo thương hiệu ánh sáng neon rực rỡ",
  "Mockup bao bì hộp giấy kraft in ấn thương mại trên bàn gỗ studio",
];

const STYLE_OPTIONS = [
  { value: "none", label: "Tự do / Theo AI" },
  { value: "doc_realism", label: "📷 Chân thực đời thường (RAW Capture)" },
  { value: "cinematic", label: "🎬 Điện ảnh Cinematic (Panavision 35mm)" },
  { value: "commercial_studio", label: "📸 Studio Thương mại (Editorial Quality)" },
  { value: "vintage_film", label: "☕ Analog Kodak Portra 400" },
  { value: "packaging_mockup", label: "📦 Mockup Bao bì In ấn (High-Fidelity)" },
  { value: "oil_painting", label: "🎨 Tranh sơn dầu Nghệ thuật (Museum)" },
];

const LIGHTING_OPTIONS = [
  { value: "none", label: "Tự do / Theo AI" },
  { value: "golden_hour", label: "☀️ Nắng sớm bình minh (Golden Hour)" },
  { value: "soft_daylight", label: "⛅ Ánh sáng tự nhiên dịu (Diffused)" },
  { value: "studio_softbox", label: "💡 Studio Softbox 3 điểm (Three-Point)" },
  { value: "sunset_dramatic", label: "🌆 Hoàng hôn rực rỡ (Sunset Twilight)" },
  { value: "neon_glow", label: "🏮 Đèn Neon tương phản (Dual-Tone Cyberpunk)" },
  { value: "moody_night", label: "🌙 Đêm huyền bí / Ánh trăng (Low-Key)" },
];

const LENS_OPTIONS = [
  { value: "none", label: "Tự do / Theo AI" },
  { value: "portrait_85mm", label: "🔍 Chân dung xóa phông (85mm f/1.4 Bokeh)" },
  { value: "natural_50mm", label: "👁️ Góc mắt người thật (50mm f/1.8 Prime)" },
  { value: "wide_24mm", label: "🌄 Toàn cảnh góc rộng (24mm f/2.8 Expansive)" },
  { value: "macro_100mm", label: "🔬 Cận cảnh vi mô (100mm Macro 1:1)" },
  { value: "drone_aerial", label: "🚁 Góc nhìn trên cao (Aerial Drone)" },
  { value: "full_body", label: "👤 Chụp toàn thân (Full Body Framing)" },
];

export const AiCreateTab: React.FC<AiCreateTabProps> = ({
  apiHost,
  hasGeminiKey,
  hasGptKey,
  onImageCreated,
  externalPrompt,
}) => {
  const [engine, setEngine] = useState<AiEngine>("gpt");
  const [prompt, setPrompt] = useState<string>(externalPrompt || "");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:3");
  const [resolution, setResolution] = useState<Resolution>("4k");
  const [useEnhancer, setUseEnhancer] = useState<boolean>(true);
  const [presets, setPresets] = useState<ProPresets>({
    style: "cinematic",
    lighting: "golden_hour",
    lens: "natural_50mm",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [previewingEnhance, setPreviewingEnhance] = useState<boolean>(false);
  const [enhancedPreviewText, setEnhancedPreviewText] = useState<string>("");

  // Cập nhật khi nhận externalPrompt từ Tab Chat
  React.useEffect(() => {
    if (externalPrompt) {
      setPrompt(externalPrompt);
    }
  }, [externalPrompt]);

  const handlePreviewEnhance = async () => {
    if (!prompt.trim()) {
      message.warning("Vui lòng nhập prompt trước khi chuẩn hóa!");
      return;
    }
    setPreviewingEnhance(true);
    try {
      const res = await fetch(`${apiHost}/ai/prompt/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, presets, task_type: "create" }),
      });
      const data = await res.json();
      if (data.success && data.enhanced_prompt) {
        setEnhancedPreviewText(data.enhanced_prompt);
        message.success("Đã chuẩn hóa prompt 5 lớp thành công!");
      } else {
        message.error(data.error || "Không thể chuẩn hóa prompt");
      }
    } catch (err: any) {
      message.error(err.message || "Lỗi kết nối");
    } finally {
      setPreviewingEnhance(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.warning("Vui lòng nhập mô tả ảnh cần tạo!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiHost}/ai/image/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          engine,
          aspect_ratio: aspectRatio,
          resolution,
          use_ai_enhancer: useEnhancer,
          presets,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Lỗi khi tạo ảnh");
      }

      const newImage: AiStudioImageItem = {
        id: `img_${Date.now()}`,
        url: data.image_url,
        thumbnailUrl: data.thumbnail_url || data.image_url,
        prompt: data.prompt,
        enhancedPrompt: data.enhanced_prompt,
        engine: data.engine || engine,
        model: data.model || (engine === "gemini" ? "imagen-3" : "gpt-image-1"),
        aspectRatio: data.aspect_ratio || aspectRatio,
        resolution: data.resolution || resolution.toUpperCase(),
        width: data.width || 4096,
        height: data.height || 3072,
        dpi: data.dpi || 300,
        sizeKb: data.size_kb || 2500,
        taskType: "create",
        tokens: data.usage?.total_tokens || 3500,
        costUsd: data.usage?.cost_usd || 0.138,
        costVnd: data.usage?.cost_vnd || 3500,
        createdAt: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };

      onImageCreated(newImage);
      message.success(`Tạo ảnh ${resolution.toUpperCase()} 300 DPI thành công!`);
    } catch (err: any) {
      message.error(err.message || "Lỗi tạo ảnh AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-slate-200">
      {/* Chọn AI Engine */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>1. Chọn AI Engine Tạo Ảnh</span>
          <span className="text-[11px] font-normal text-slate-400">
            {engine === "gpt" ? "OpenAI gpt-image-1" : "Google Imagen 3"}
          </span>
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setEngine("gpt")}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border font-bold text-xs transition-all ${
              engine === "gpt"
                ? "bg-violet-600/30 border-violet-500 text-violet-200 shadow-md shadow-violet-900/40"
                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <span>🟣 GPT (OpenAI)</span>
          </button>

          <button
            type="button"
            onClick={() => setEngine("gemini")}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border font-bold text-xs transition-all ${
              engine === "gemini"
                ? "bg-emerald-600/30 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-900/40"
                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>🟢 Gemini (Google)</span>
          </button>
        </div>
      </div>

      {/* Nhập Prompt */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            2. Mô Tả Ảnh Cần Tạo (Prompt)
          </label>
          <span className="text-[11px] text-slate-400">Tiếng Việt hoặc English</span>
        </div>

        <TextArea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ví dụ: Bảng hiệu alu chữ nổi mica đèn LED sáng chân quán cafe phong cách tối giản..."
          className="!bg-slate-950/90 !text-slate-100 !border-slate-800 focus:!border-violet-500 !rounded-xl !text-xs !p-3"
        />

        {/* Gợi ý Prompt nhanh */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold mr-1 self-center">Gợi ý:</span>
          {QUICK_TAGS.map((tag, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(tag)}
              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 truncate max-w-[280px] transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* AI Prompt Enhancer (5-Layer Photographic Framework) */}
      <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">
              AI Tự Động Chuẩn Hóa Prompt (5-Layer Framework)
            </span>
          </div>
          <Switch
            checked={useEnhancer}
            onChange={(checked) => setUseEnhancer(checked)}
            size="small"
            className="bg-slate-800"
          />
        </div>

        {useEnhancer && (
          <>
            <p className="text-[11px] text-slate-400 m-0 leading-relaxed">
              Tự động viết lại chi tiết theo tiêu chuẩn nhiếp ảnh: Chủ thể, Bối cảnh, Ánh sáng, Quang học Ống kính & Xử lý màu sắc bằng GPT-4o-mini.
            </p>

            {/* Presets Chuyên Nghiệp */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Phong Cách</label>
                <Select
                  value={presets.style}
                  onChange={(val) => setPresets((p) => ({ ...p, style: val }))}
                  options={STYLE_OPTIONS}
                  size="small"
                  className="w-full !text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Ánh Sáng</label>
                <Select
                  value={presets.lighting}
                  onChange={(val) => setPresets((p) => ({ ...p, lighting: val }))}
                  options={LIGHTING_OPTIONS}
                  size="small"
                  className="w-full !text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Ống Kính</label>
                <Select
                  value={presets.lens}
                  onChange={(val) => setPresets((p) => ({ ...p, lens: val }))}
                  options={LENS_OPTIONS}
                  size="small"
                  className="w-full !text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handlePreviewEnhance}
                disabled={previewingEnhance || !prompt.trim()}
                className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold disabled:opacity-50"
              >
                {previewingEnhance ? <Spin size="small" /> : <EyeOutlined />}
                <span>Xem thử prompt tiếng Anh được AI viết lại</span>
              </button>
            </div>

            {enhancedPreviewText && (
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono leading-relaxed">
                <span className="text-violet-400 font-bold block mb-1">Enhanced Prompt:</span>
                {enhancedPreviewText}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tỷ lệ & Độ phân giải xuất file */}
      <div className="grid grid-cols-2 gap-3">
        {/* Tỷ lệ khung hình */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            3. Tỷ Lệ Khung Hình
          </label>
          <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(["1:1", "16:9", "9:16", "4:3", "3:4"] as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => setAspectRatio(ratio)}
                className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                  aspectRatio === ratio
                    ? "bg-violet-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Độ phân giải xuất file */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>4. Độ Phân Giải</span>
            <span className="text-emerald-400 font-bold text-[10px]">300 DPI In Ấn</span>
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(
              [
                { val: "4k", label: "4K UHD" },
                { val: "2k", label: "2K QHD" },
                { val: "1080p", label: "1080p" },
              ] as { val: Resolution; label: string }[]
            ).map((item) => (
              <button
                key={item.val}
                type="button"
                onClick={() => setResolution(item.val)}
                className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                  resolution === item.val
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nút hành động Tạo Ảnh */}
      <button
        type="button"
        disabled={loading || !prompt.trim()}
        onClick={handleGenerate}
        className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-600 hover:from-violet-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-950/50 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer border-none"
      >
        {loading ? (
          <>
            <Spin size="small" />
            <span>AI Đang Xử Lý & Xuất Ảnh {resolution.toUpperCase()} 300 DPI...</span>
          </>
        ) : (
          <>
            <ThunderboltOutlined className="text-base text-yellow-300" />
            <span>✨ Tiến Hành Tạo Ảnh {resolution.toUpperCase()} (300 DPI)</span>
          </>
        )}
      </button>
    </div>
  );
};
