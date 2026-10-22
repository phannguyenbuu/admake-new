/**
 * useCanvas2DOverlay.ts - Hook quản lý toàn bộ trạng thái Logo, Text 2D, kéo thả và xuất PDF 2 trang
 */

import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import type { OverlayLogo, OverlayTextItem, CanvasPageType, OverlayItemPageScope, PdfOrientation } from "./overlayTypes";
import { exportTwoPageStudioPdf } from "./exportTwoPagePdf";
import type { Signboard3DModel } from "../../../services/genaiSignboard.service";
import type { StudioQuoteResult } from "./studioQuote";
import type { Signboard3DCanvasHandle } from "../Signboard3DCanvas";

interface UseCanvas2DOverlayOptions {
  model3D: Signboard3DModel | null;
  quoteResult: StudioQuoteResult | null;
  activeRenderUrl: string | null;
  canvasRef?: React.RefObject<Signboard3DCanvasHandle | null>;
  profitMargin: number;
}

export function useCanvas2DOverlay(options: UseCanvas2DOverlayOptions) {
  const { model3D, quoteResult, activeRenderUrl, canvasRef, profitMargin } = options;

  // 1. Quản lý trang hiện tại trên Canvas: "render" (Trang 1) hoặc "quote" (Trang 2)
  const [activeCanvasPage, setActiveCanvasPage] = useState<CanvasPageType>("render");

  // 1b. Quản lý khổ in: "landscape" (Khổ Nằm) hoặc "portrait" (Khổ Đứng)
  const [orientation, setOrientationState] = useState<PdfOrientation>(() => {
    try {
      const saved = localStorage.getItem("admake_pdf_orientation");
      return saved === "portrait" || saved === "landscape" ? saved : "landscape";
    } catch {
      return "landscape";
    }
  });

  const setOrientation = (val: PdfOrientation) => {
    setOrientationState(val);
    try {
      localStorage.setItem("admake_pdf_orientation", val);
    } catch {}
  };

  // 2. Quản lý Logo
  const [logo, setLogo] = useState<OverlayLogo | null>(() => {
    try {
      const saved = localStorage.getItem("admake_overlay_logo");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const saveLogo = (newLogo: OverlayLogo | null) => {
    setLogo(newLogo);
    try {
      if (newLogo) {
        localStorage.setItem("admake_overlay_logo", JSON.stringify(newLogo));
      } else {
        localStorage.removeItem("admake_overlay_logo");
      }
    } catch {}
  };

  const handleUploadLogo = (file: File) => {
    if (!file.type.startsWith("image/")) {
      message.error("Vui lòng tải lên tệp ảnh hợp lệ (PNG, JPG, SVG, WebP)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (url) {
        const newLogo: OverlayLogo = {
          url,
          name: file.name,
          x: 4,
          y: 4,
          width: 16,
          page: "both",
        };
        saveLogo(newLogo);
        message.success("✨ Đã tải lên logo thành công!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    saveLogo(null);
    message.info("Đã xóa logo");
  };

  const updateLogo = (updates: Partial<OverlayLogo>) => {
    setLogo((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem("admake_overlay_logo", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // 3. Quản lý danh sách Text 2D
  const [textItems, setTextItems] = useState<OverlayTextItem[]>(() => {
    try {
      const saved = localStorage.getItem("admake_overlay_texts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Bỏ nền đen cũ nếu có
          return parsed.map((item) => ({
            ...item,
            bgColor: item.bgColor?.includes("0,0,0") ? "transparent" : item.bgColor || "transparent",
          }));
        }
      }
    } catch {}
    // Mặc định ban đầu
    const w = model3D?.dimensions?.width || 3;
    const h = model3D?.dimensions?.height || 1.2;
    return [
      {
        id: "txt_project",
        text: `DỰ ÁN: ${model3D?.name || "BẢNG HIỆU QUẢNG CÁO"}`,
        x: 4,
        y: 8,
        fontSize: 16,
        fontWeight: "700",
        color: "#ffffff",
        bgColor: "transparent",
        page: "both",
        label: "Tên dự án",
      },
      {
        id: "txt_dim",
        text: `KÍCH THƯỚC: ${w}m × ${h}m`,
        x: 4,
        y: 15,
        fontSize: 13,
        fontWeight: "600",
        color: "#f59e0b",
        bgColor: "transparent",
        page: "both",
        label: "Kích thước",
      },
      {
        id: "txt_designer",
        text: "THIẾT KẾ & THI CÔNG: ADMAKE",
        x: 4,
        y: 89,
        fontSize: 12,
        fontWeight: "600",
        color: "#00b4b6",
        bgColor: "transparent",
        page: "render",
        label: "Đơn vị thi công",
      },
    ];
  });

  const saveTextItems = (items: OverlayTextItem[]) => {
    setTextItems(items);
    try {
      localStorage.setItem("admake_overlay_texts", JSON.stringify(items));
    } catch {}
  };

  const addTextItem = (preset?: Partial<OverlayTextItem>) => {
    const newItem: OverlayTextItem = {
      id: `text_${Date.now()}`,
      text: preset?.text || "Nhập nội dung ghi chú...",
      x: preset?.x ?? 25,
      y: preset?.y ?? 35,
      fontSize: preset?.fontSize ?? 14,
      fontWeight: preset?.fontWeight ?? "600",
      color: preset?.color ?? "#ffffff",
      bgColor: preset?.bgColor ?? "rgba(0,0,0,0.6)",
      page: preset?.page ?? activeCanvasPage,
      label: preset?.label || "Ghi chú",
    };
    const updated = [...textItems, newItem];
    saveTextItems(updated);
    setSelectedItemId(newItem.id);
  };

  const updateTextItem = (id: string, updates: Partial<OverlayTextItem>) => {
    setTextItems((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      try {
        localStorage.setItem("admake_overlay_texts", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const deleteTextItem = (id: string) => {
    setTextItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem("admake_overlay_texts", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (selectedItemId === id) setSelectedItemId(null);
  };

  // 4. Quản lý Item đang chọn
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // 5. Hàm xuất PDF 2 trang (Tải file PDF thật về máy)
  const handleExportTwoPagePdf = async (overrideOrientation?: PdfOrientation) => {
    let finalImageUrl = activeRenderUrl;
    if (!finalImageUrl && canvasRef?.current) {
      try {
        finalImageUrl = canvasRef.current.captureSnapshot(0.95);
      } catch (err) {
        console.warn("Không thể chụp snapshot 3D:", err);
      }
    }

    await exportTwoPageStudioPdf({
      orientation: overrideOrientation || orientation,
      renderImageUrl: finalImageUrl,
      logo,
      textItems,
      model3DName: model3D?.name || "Biển Hiệu Quảng Cáo Cao Cấp",
      dimensions: model3D?.dimensions || { width: 3, height: 1.2, depth: 0.12 },
      quoteResult,
      profitMargin,
    });
  };

  return {
    activeCanvasPage,
    setActiveCanvasPage,
    orientation,
    setOrientation,
    logo,
    handleUploadLogo,
    handleRemoveLogo,
    updateLogo,
    textItems,
    addTextItem,
    updateTextItem,
    deleteTextItem,
    selectedItemId,
    setSelectedItemId,
    handleExportTwoPagePdf,
  };
}
