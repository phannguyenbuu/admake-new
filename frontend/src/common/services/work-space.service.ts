import type { WorkSpace } from "../@types/work-space.type";
import type { AxiosResponse } from "axios";
import axiosClient from "./axiosClient";
import type { PaginationDto } from "../@types/common.type";

export const WorkSpaceService = {
  getAll: (dto: Partial<PaginationDto> = {}) => {
    return axiosClient.get<WorkSpace[]>("/workspace/", { params: dto });
  },
  getTaskById: (id: string) => {
    return axiosClient.get<{ data: object; namelist: string[] }>(`/workspace/${id}/tasks`);
  },
  getById: (id: string) => {
    return axiosClient.get<WorkSpace>(`/workspace/${id}`);
  },
  create: (dto: WorkSpace) => {
    return axiosClient.post<WorkSpace>("/workspace/", dto);
  },
  update: (id: string, dto: Omit<WorkSpace, "id" | "cover">) => {
    return axiosClient.put<WorkSpace>(`/workspace/${id}`, dto);
  },
  delete: (id: string) => {
    return axiosClient.delete(`/workspace/${id}`);
  },
} as const;
