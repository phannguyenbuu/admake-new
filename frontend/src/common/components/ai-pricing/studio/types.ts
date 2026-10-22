import { ClipboardList, Box, FileSpreadsheet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ChevronTabItem {
  key: string;
  num: string;
  label: string;
  icon: LucideIcon;
}

export const STUDIO_CHEVRON_TABS: ChevronTabItem[] = [
  {
    key: "survey",
    num: "1",
    label: "Khảo Sát",
    icon: ClipboardList,
  },
  {
    key: "editor3d",
    num: "2",
    label: "3D Editor",
    icon: Box,
  },
  {
    key: "quote",
    num: "3",
    label: "Báo Giá",
    icon: FileSpreadsheet,
  },
];

export interface SignSampleItem {
  id: string;
  image_filename: string;
  image_url: string;
  rb_filename: string;
  rb_url: string;
  title: string;
  description: string;
  category: "billboard" | "storefront" | "mini";
  badge: string;
  dimensions: { width: number; height: number; depth: number };
  materials: {
    iron_type: string;
    surface_type: string;
    has_led: boolean;
    has_sheet_backing: boolean;
  };
  elements: any[];
  ruby_code: string;
  prompt: string;
}

export interface AttachedImage {
  dataUrl: string;
  name: string;
  size: number;
}

export interface Signboard3DStudioProps {
  onClose?: () => void;
  /** Studio có đang hiển thị không (dùng để chỉ bắt Ctrl+V khi đang mở). Mặc định true. */
  open?: boolean;
}
