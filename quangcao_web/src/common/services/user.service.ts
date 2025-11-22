import type { PaginationDto } from "../@types/common.type";
import axiosClient from "./axiosClient";
import type { User } from '../@types/user.type';

export const UserService = {
  getAll: (dto: Partial<PaginationDto> = {}) => {
    return axiosClient.get("/user/", { params: dto });
  },
  getDetail: (id: string) => {
    return axiosClient.get(`/user/${id}`);
  },
  create: (dto: User) => {
    return axiosClient.post("/user/", dto);
  },
  update: (id: string, dto: User) => {
    return axiosClient.put(`/user/${id}`, dto);
  },
  delete: (id: string) => {
    return axiosClient.delete(`/user/${id}`);
  },
} as const;
