import type { BaseEntity } from "./common.type";
import type { User } from "./user.type";

export interface Holiday extends BaseEntity {
  name: string;
  startDate: string;
  endDate: string;
  type:
    | "PUBLIC_HOLIDAY" // Lễ tết
    | "COMPANY_HOLIDAY" // Nghỉ công ty
    | "PERSONAL_LEAVE" // Nghỉ phép cá nhân
    | "SICK_LEAVE" // Nghỉ phép ốm
    | "ANNUAL_LEAVE" // Nghỉ phép năm
    | "OTHER";
  description: string;
  forUserId?: string;
}

export interface HolidayModalProps {
  open: boolean;
  onCancel: () => void;
  user?: User;
  holiday?: Holiday; // Để edit holiday
  refetchHolidays?: () => void; // Để refresh danh sách
}
