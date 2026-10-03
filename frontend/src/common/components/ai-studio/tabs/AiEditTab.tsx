import React, { useState, useEffect } from "react";
import { Input, message, Spin, Upload, Tooltip } from "antd";
import {
  UploadOutlined,
  ScissorOutlined,
  EditOutlined,
  PictureOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { AiMaskCanvas } from "../components/AiMaskCanvas";
import type { Resolution, AiStudioImageItem } from "../types";

const { TextArea } = Input;

interface AiEditTabProps {
  apiHost: string;
  sourceImage: AiStudioImageItem | null;
  onImageCreated: (img: AiStudioImageItem) => void;
}

export const AiEditTab: React.FC<AiEditTabProps> = ({
  apiHost,
  sourceImage,
  onImageCreated,
}) => {
  const [currentImageSrc, setCurrentImageSrc] = useState<string>("");
  const [maskBase64, setMaskBase64] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [resolution, setResolution] = useState<Resolution>("4k");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (sourceImage?.url) {
      setCurrentImageSrc(sourceImage.url);
      setMaskBase64(null);
    }
  }, [sourceImage]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setCurrentImageSrc(result);
        setMaskBase64(null);
        message.success("Đã nạp ảnh thành công! Bạn có thể bắt đầu tô cọ lên vùng muốn sửa.");
      }
    };
    reader.readAsDataURL(file);
    return false; // Chặn upload mặc định của Antd
  };

  const handleEdit = async () => {
    if (!currentImageSrc) {
      message.warning("Vui lòng tải lên ảnh hoặc chọn ảnh từ thư viện để sửa!");
      return;
    }
    if (!prompt.trim()) {
      message.warning("Vui lòng nhập mô tả phần muốn thay đổi / sửa!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiHost}/ai/image/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: currentImageSrc,
          mask_base64: maskBase64,
          prompt,
          resolution,
          use_ai_enhancer: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Lỗi khi sửa ảnh");
      }

      const editedImage: AiStudioImageItem = {
        id: `edit_${Date.now()}`,
        url: data.image_url,
        thumbnailUrl: data.thumbnail_url || data.image_url,
        prompt: data.prompt,
        enhancedPrompt: data.enhanced_prompt,
        engine: "gpt",
        model: "gpt-image-1",
        aspectRatio: data.aspect_ratio || "4:3",
        resolution: data.resolution || resolution.toUpperCase(),
        width: data.width || 4096,
        height: data.height || 3072,
        dpi: data.dpi || 300,
        sizeKb: data.size_kb || 2800,
        taskType: maskBase64 ? "inpainting" : "edit",
        tokens: data.usage?.total_tokens || 3500,
        costUsd: data.usage?.cost_usd || 0.140,
        costVnd: data.usage?.cost_vnd || 3550,
        createdAt: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };

      onImageCreated(editedImage);
      message.success("Sửa ảnh & Inpainting 4K thành công!");
    } catch (err: any) {
      message.error(err.message || "Lỗi khi gọi API sửa ảnh");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-slate-200">
      {/* Vùng chọn / nạp ảnh */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <PictureOutlined className="text-violet-400" />
          <span>1. Ảnh Nguồn Cần Sửa</span>
        </label>

        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={handleFileUpload}
        >
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <UploadOutlined />
            <span>Tải ảnh khác lên</span>
          </button>
        </Upload>
      </div>

      {currentImageSrc ? (
        <AiMaskCanvas
          imageUrl={currentImageSrc}
          onMaskChange={(mask) => setMaskBase64(mask)}
          disabled={loading}
        />
      ) : (
        <Upload.Dragger
          accept="image/*"
          showUploadList={false}
          beforeUpload={handleFileUpload}
          className="!bg-slate-950/60 !border-slate-800 hover:!border-violet-500 !rounded-2xl p-6"
        >
          <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
            <UploadOutlined className="text-3xl text-violet-400" />
            <span className="font-bold text-sm text-slate-200">Kéo thả ảnh hoặc bấm để tải lên</span>
            <span className="text-xs text-slate-500">
              Hoặc bấm nút "Sửa ảnh này" trên bất kỳ ảnh nào trong thư viện bên phải
            </span>
          </div>
        </Upload.Dragger>
      )}

      {/* Trạng thái Mask */}
      {currentImageSrc && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400">Chế độ sửa:</span>
          {maskBase64 ? (
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <CheckCircleOutlined />
              <span>Inpainting (Chỉ sửa phần tô màu đỏ, giữ nguyên phần còn lại)</span>
            </span>
          ) : (
            <span className="text-indigo-400 font-medium">
              Image-to-Image (Sửa toàn bộ ảnh theo phong cách prompt mới)
            </span>
          )}
        </div>
      )}

      {/* Mô tả chỉnh sửa (Prompt) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          2. Mô Tả Nội Dung Cần Sửa (Prompt)
        </label>
        <TextArea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ví dụ: Thay đổi chữ bảng hiệu thành 'ADMAKE STUDIO', thêm hiệu ứng đèn LED hắt sáng xung quanh..."
          className="!bg-slate-950/90 !text-slate-100 !border-slate-800 focus:!border-violet-500 !rounded-xl !text-xs !p-3"
        />
      </div>

      {/* Độ phân giải xuất file */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-400 font-semibold uppercase text-[11px]">Độ phân giải:</span>
        <div className="flex items-center gap-1">
          {(["4k", "2k", "1080p"] as Resolution[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setResolution(r)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                resolution === r
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {r.toUpperCase()} {r === "4k" && "(300 DPI)"}
            </button>
          ))}
        </div>
      </div>

      {/* Nút hành động Sửa ảnh */}
      <button
        type="button"
        disabled={loading || !currentImageSrc || !prompt.trim()}
        onClick={handleEdit}
        className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-red-600 via-violet-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-950/50 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer border-none"
      >
        {loading ? (
          <>
            <Spin size="small" />
            <span>OpenAI Đang Sửa & Nâng Cấp Ảnh 4K...</span>
          </>
        ) : (
          <>
            <ScissorOutlined className="text-base" />
            <span>🎨 Thực Hiện Sửa Ảnh (Generate Edit)</span>
          </>
        )}
      </button>
    </div>
  );
};
