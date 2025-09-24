import type { Material } from "./material.type";
import type { User } from "./user.type";
import type { Dayjs } from "dayjs";

export interface ConfirmInvoiceModalProps {
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLoading: boolean;
  materials: Material[];
  selectedMaterials: Material[];
  quantities: { [key: string]: number };
  users: User[];
  selectedUsers: string[];
  date: {
    startDate: Dayjs | null;
    endDate: Dayjs | null;
  };
  totalDays: number;
  totalMaterialsCost: number;
  coefficient?: number;
}

export interface UserSectionProps {
  selectedUsers: string[];
  onUserCheck: (checked: boolean, userId: string) => void;
  onRemoveUser: (userId: string) => void;
  disabled?: boolean;
}

export interface MaterialSectionProps {
  selected: any[]; // Thay đổi từ string[] sang any[] để lưu toàn bộ material object
  quantities: { [key: string]: number };
  onCheck: (checked: boolean, material: any) => void; // Thay đổi từ materialId: string sang material: any
  onRemove: (material: string) => void;
  onQuantityChange: (material: string, value: number | null) => void;
  isAdminMode?: boolean;
  disabled?: boolean;
}
