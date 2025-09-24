import type { PaginationDto } from "../@types/common.type";
import axiosClient from "./axiosClient";

export const NotificationService = {
  getNotifications: (dto: Partial<PaginationDto> = {}) => {
    return axiosClient.get("/notification", { params: dto });
  },
  checkNotification: () => {
    return axiosClient.get("/notification/unread");
  },
} as const;
