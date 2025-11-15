import type { Attendance } from "./attendance.type";
import type { BaseEntity } from "./common.type";

export interface CommentUser {
  _id: string;
  username: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  avatar: string;
}

export interface CommentItem extends BaseEntity {
  content: string;
  image: string | null;
  taskId: string;
  createBy: CommentUser;
  attendance: Omit<
    Attendance,
    "time_checkin" | "time_checkout" | "late_checkin" | "early_checkout"
  >;
  type: "in" | "out";
}

export interface CommentResponse {
  data: CommentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  meta: Record<string, any>;
}

export interface CommentSectionProps {
  taskId?: string;
  placeholder?: string;
  disabled?: boolean;
}

// Interface cho image state
export interface ImageState {
  files: File[];
  urls: string[];
}
