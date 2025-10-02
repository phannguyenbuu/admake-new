import type { WorkSpace } from "../@types/work-space.type";
import axiosClient from "./axiosClient";

export const WorkSpaceService = {
  getAll: () => {
    return axiosClient.get("/workspace/");
  },
  getTaskById: (id: string) => {
    return axiosClient.get(`/workspace/${id}/tasks`);
  },
  getById: (id: string) => {
    return axiosClient.get(`/workspace/${id}`);
  },
  create: (dto: WorkSpace) => {
    return axiosClient.post("/workspace/", dto);
  },
  update: (id: string, dto: Omit<WorkSpace, "id" | "cover">) => {
    return axiosClient.put(`/workspace/${id}`, dto);
  },
  delete: (id: string) => {
    return axiosClient.delete(`/workspace/${id}`);
  },
} as const;
