/**
 * overlayTypes.ts - Định nghĩa kiểu dữ liệu cho Logo và Text 2D phủ trên Canvas và xuất PDF 2 trang
 */

export type CanvasPageType = "render" | "quote";

export type OverlayItemPageScope = "render" | "quote" | "both";

export type PdfOrientation = "landscape" | "portrait";

export interface OverlayLogo {
  url: string;
  name?: string;
  x: number; // Tọa độ % (0 -> 100)
  y: number; // Tọa độ % (0 -> 100)
  width: number; // Chiều rộng % (5 -> 40)
  page: OverlayItemPageScope;
}

export interface OverlayTextItem {
  id: string;
  text: string;
  x: number; // Tọa độ % (0 -> 100)
  y: number; // Tọa độ % (0 -> 100)
  fontSize: number; // px: 11, 14, 18, 22, 28, 36...
  fontWeight: "300" | "400" | "500" | "600" | "700" | "900";
  color: string; // #ffffff, #1e293b, #f59e0b, #00b4b6, #ef4444...
  bgColor?: string; // transparent, rgba(0,0,0,0.65), rgba(255,255,255,0.9), etc.
  borderRadius?: number;
  page: OverlayItemPageScope;
  label?: string; // Tên dự án, Chủ đầu tư, Kích thước, Đơn vị thiết kế...
}

export interface TwoPagePdfData {
  /** Live final-tab regions: capture the same typography/content for PDF. */
  bomPages?: HTMLElement[];
  bomQuote?: { result: import("../../product-bom/types").Result; vat: number };
  orientation?: PdfOrientation;
  renderImageUrl: string | null;
  logo: OverlayLogo | null;
  textItems: OverlayTextItem[];
  model3DName?: string;
  dimensions?: { width: number; height: number; depth?: number };
  quoteResult?: any;
  profitMargin: number;
}

