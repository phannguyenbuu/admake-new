import type { PaginationDto } from "../@types/common.type";
import axiosClient from "./axiosClient";
import type { User } from '../@types/user.type';

export const SupplierService = {
  getAll: (dto: Partial<PaginationDto> = {}) => {
    return axiosClient.get("/supplier/", { params: dto });
  },
  getDetail: (id: string) => {
    return axiosClient.get(`/supplier/${id}`);
  },
  create: (dto: User) => {
    return axiosClient.post("/supplier/", dto);
  },
  update: (id: string, dto: User) => {
    return axiosClient.put(`/supplier/${id}`, dto);
  },
  delete: (id: string) => {
    return axiosClient.delete(`/supplier/${id}`);
  },
} as const;
