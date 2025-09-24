import type { PaginationDto } from "../@types/common.type";
import type { Holiday } from "../@types/holiday.type";
import axiosClient from "./axiosClient";

export const HolidayService = {
  createHoliday: (dto: Omit<Holiday, "_id" | "createdAt" | "updatedAt">) => {
    return axiosClient.post("/holiday", dto);
  },
  getHolidaysByUserId: (id: string, dto: Partial<PaginationDto>) => {
    return axiosClient.get(`/holiday/forUser/${id}`, { params: dto });
  },
  getHolidayById: (id: string) => {
    return axiosClient.get(`/holiday/${id}`);
  },
  updateHoliday: (id: string, dto: Partial<Holiday>) => {
    return axiosClient.put(`/holiday/${id}`, dto);
  },
  deleteHoliday: (id: string) => {
    return axiosClient.delete(`/holiday/${id}`);
  },
} as const;
