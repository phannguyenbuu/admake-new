/**
 * MaterialPbrSliders.tsx - Bộ Slider điều chỉnh thông số PBR & Texture Map
 * Hỗ trợ Độ bóng/nhám, Kim loại, Trong suốt, Texture ảnh tham chiếu.
 * Tự động lưu và nạp từ localStorage theo từng vật liệu.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Slider, Input, Tooltip, message } from "antd";
import { Sparkles, Sliders, Image, RotateCcw, Eye, ShieldCheck, Upload } from "lucide-react";
import type { SignboardMaterialOption } from "./editorTypes";

export interface CustomPbrProps {
  roughness: number;
  metalness: number;
  transmission: number;
  textureUrl?: string;
}

interface MaterialPbrSlidersProps {
  materialId?: string;
  currentMaterial?: SignboardMaterialOption | null;
  onChange?: (props: CustomPbrProps) => void;
  disabled?: boolean;
}

const QUICK_TEXTURE_MAPS = [
  { label: "Vân Gỗ Sồi", url: "/api/ai/maps/file?path=%23Wood/009.JPG" },
  { label: "Gỗ Óc Chó", url: "/api/ai/maps/file?path=%23Wood/017.JPG" },
  { label: "Đá Marble Trắng", url: "/api/ai/maps/file?path=%23Stone/001.JPG" },
  { label: "Bê Tông Xám", url: "/api/ai/maps/file?path=%23Concrete/003.JPG" },
  { label: "Kim Loại Xước", url: "/api/ai/maps/file?path=%23Metal/005.JPG" },
  { label: "Gạch Cổ", url: "/api/ai/maps/file?path=%23Brick/002.JPG" },
];

export const MaterialPbrSliders: React.FC<MaterialPbrSlidersProps> = ({
  materialId,
  currentMaterial,
  onChange,
  disabled = false,
}) => {
  const [roughness, setRoughness] = useState<number>(0.35);
  const [metalness, setMetalness] = useState<number>(0.2);
  const [transmission, setTransmission] = useState<number>(0);
  const [textureUrl, setTextureUrl] = useState<string>("");
  const [isCustomized, setIsCustomized] = useState<boolean>(false);
  const [showMapInput, setShowMapInput] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Nạp từ localStorage khi đổi vật liệu
  useEffect(() => {
    if (!materialId) return;
    const cacheKey = `admake_mat_custom_${materialId}`;
    const saved = localStorage.getItem(cacheKey);

    if (saved) {
      try {
        const parsed: CustomPbrProps = JSON.parse(saved);
        setRoughness(parsed.roughness ?? (currentMaterial?.roughness ?? 0.35));
        setMetalness(parsed.metalness ?? (currentMaterial?.metalness ?? 0.2));
        setTransmission(parsed.transmission ?? (currentMaterial?.transmission ?? 0));
        setTextureUrl(parsed.textureUrl ?? (currentMaterial?.textureUrl ?? ""));
        setIsCustomized(true);
        onChange?.({
          roughness: parsed.roughness ?? 0.35,
          metalness: parsed.metalness ?? 0.2,
          transmission: parsed.transmission ?? 0,
          textureUrl: parsed.textureUrl,
        });
        return;
      } catch (e) {
        console.warn("[MaterialPbrSliders] Lỗi đọc localStorage:", e);
      }
    }

    // Giá trị mặc định từ catalog
    const defRough = currentMaterial?.roughness ?? 0.35;
    const defMetal = currentMaterial?.metalness ?? 0.2;
    const defTrans = currentMaterial?.transmission ?? 0;
    const defTex = currentMaterial?.textureUrl ?? "";

    setRoughness(defRough);
    setMetalness(defMetal);
    setTransmission(defTrans);
    setTextureUrl(defTex);
    setIsCustomized(false);
  }, [materialId, currentMaterial]);

  // 2. Lưu vào localStorage và thông báo thay đổi
  const persistChanges = useCallback(
    (newProps: Partial<CustomPbrProps>) => {
      const updated: CustomPbrProps = {
        roughness: newProps.roughness !== undefined ? newProps.roughness : roughness,
        metalness: newProps.metalness !== undefined ? newProps.metalness : metalness,
        transmission: newProps.transmission !== undefined ? newProps.transmission : transmission,
        textureUrl: newProps.textureUrl !== undefined ? newProps.textureUrl : textureUrl,
      };

      if (materialId) {
        try {
          localStorage.setItem(`admake_mat_custom_${materialId}`, JSON.stringify(updated));
          setIsCustomized(true);
        } catch (e) {
          console.warn("[MaterialPbrSliders] Không ghi được localStorage:", e);
        }
      }
      onChange?.(updated);
    },
    [materialId, roughness, metalness, transmission, textureUrl, onChange]
  );

  // 3. Reset về mặc định ban đầu
  const handleResetToDefault = () => {
    if (materialId) {
      try {
        localStorage.removeItem(`admake_mat_custom_${materialId}`);
      } catch (e) {
        // ignore
      }
    }
    const defRough = currentMaterial?.roughness ?? 0.35;
    const defMetal = currentMaterial?.metalness ?? 0.2;
    const defTrans = currentMaterial?.transmission ?? 0;
    const defTex = currentMaterial?.textureUrl ?? "";

    setRoughness(defRough);
    setMetalness(defMetal);
    setTransmission(defTrans);
    setTextureUrl(defTex);
    setIsCustomized(false);

    onChange?.({
      roughness: defRough,
      metalness: defMetal,
      transmission: defTrans,
      textureUrl: defTex,
    });
    message.info("Đã khôi phục thông số mặc định của vật liệu");
  };

  // 4. Chọn file ảnh texture từ máy tính
  const handleUploadTexture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setTextureUrl(dataUrl);
        persistChanges({ textureUrl: dataUrl });
        message.success("✨ Đã tải ảnh tham chiếu vào texture!");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-2.5 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      {/* Tiêu đề & Nút Reset */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
          <Sliders className="w-3.5 h-3.5 text-[#00b4b6]" />
          <span>Thông Số Vật Liệu PBR</span>
          {isCustomized && (
            <span className="text-[10px] font-normal text-teal-600 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded-full">
              Đã lưu
            </span>
          )}
        </span>
        {isCustomized && (
          <Tooltip title="Khôi phục thông số mặc định">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-[10px] text-slate-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Mặc định</span>
            </button>
          </Tooltip>
        )}
      </div>

      {/* 1. Slider Độ Nhám / Bóng (Roughness) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-600">Độ nhám / Bóng:</span>
          <span className="font-semibold text-slate-800">
            {Math.round(roughness * 100)}% ({roughness < 0.2 ? "Bóng gương" : roughness < 0.5 ? "Bóng vừa" : "Nhám mờ"})
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          value={Math.round(roughness * 100)}
          onChange={(val) => {
            const v = Number(val) / 100;
            setRoughness(v);
            onChange?.({ roughness: v, metalness, transmission, textureUrl });
          }}
          onChangeComplete={(val) => persistChanges({ roughness: Number(val) / 100 })}
          className="m-0"
        />
      </div>

      {/* 2. Slider Độ Kim Loại (Metalness) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-600">Độ kim loại (Metal):</span>
          <span className="font-semibold text-slate-800">
            {Math.round(metalness * 100)}% ({metalness > 0.7 ? "Kim loại cao" : metalness > 0.3 ? "Bán kim" : "Phi kim"})
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          value={Math.round(metalness * 100)}
          onChange={(val) => {
            const v = Number(val) / 100;
            setMetalness(v);
            onChange?.({ roughness, metalness: v, transmission, textureUrl });
          }}
          onChangeComplete={(val) => persistChanges({ metalness: Number(val) / 100 })}
          className="m-0"
        />
      </div>

      {/* 3. Slider Độ Trong Suốt (Transmission / Opacity) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-600">Độ trong suốt (Kính/Mica):</span>
          <span className="font-semibold text-slate-800">
            {Math.round(transmission * 100)}% ({transmission === 0 ? "Đặc 100%" : transmission > 0.6 ? "Trong suốt cao" : "Mờ bán thấu"})
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          value={Math.round(transmission * 100)}
          onChange={(val) => {
            const v = Number(val) / 100;
            setTransmission(v);
            onChange?.({ roughness, metalness, transmission: v, textureUrl });
          }}
          onChangeComplete={(val) => persistChanges({ transmission: Number(val) / 100 })}
          className="m-0"
        />
      </div>

      {/* 4. Hình ảnh tham chiếu / Texture Map */}
      <div className="pt-1 border-t border-slate-200/80 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-600 font-medium flex items-center gap-1">
            <Image className="w-3 h-3 text-[#00b4b6]" />
            <span>Map vân bề mặt:</span>
          </span>
          <button
            type="button"
            onClick={() => setShowMapInput(!showMapInput)}
            className="text-[10px] text-[#00b4b6] hover:underline cursor-pointer"
          >
            {showMapInput ? "Thu gọn" : "Đổi Map..."}
          </button>
        </div>

        {/* Thumbnail texture hiện tại nếu có */}
        {textureUrl && (
          <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200">
            <img
              src={textureUrl}
              alt="Map"
              className="w-7 h-7 rounded object-cover border border-slate-200 shadow-2xs shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-slate-600 truncate block">Texture áp dụng</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setTextureUrl("");
                persistChanges({ textureUrl: "" });
              }}
              className="text-[10px] text-rose-500 hover:text-rose-700 px-1 py-0.5 rounded cursor-pointer"
              title="Xóa texture"
            >
              Gỡ
            </button>
          </div>
        )}

        {/* Khung chọn Map nhanh hoặc Upload */}
        {showMapInput && (
          <div className="p-2 bg-white rounded-lg border border-slate-200 space-y-2">
            <div className="grid grid-cols-3 gap-1">
              {QUICK_TEXTURE_MAPS.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => {
                    setTextureUrl(m.url);
                    persistChanges({ textureUrl: m.url });
                  }}
                  className="px-1.5 py-1 text-[10px] font-medium rounded border border-slate-200 hover:border-[#00b4b6] hover:text-[#00b4b6] text-slate-700 truncate cursor-pointer bg-slate-50 transition-colors"
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleUploadTexture}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold cursor-pointer border border-slate-200"
              >
                <Upload className="w-3 h-3 text-[#00b4b6]" />
                <span>Tải ảnh từ máy</span>
              </button>
              <Input
                placeholder="Dán link ảnh URL..."
                value={textureUrl.startsWith("data:") ? "(Ảnh tải từ máy)" : textureUrl}
                size="small"
                className="text-[10px] flex-1"
                onChange={(e) => {
                  const val = e.target.value;
                  setTextureUrl(val);
                  persistChanges({ textureUrl: val });
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
