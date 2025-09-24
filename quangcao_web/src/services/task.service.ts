import type { Task } from "../@types/work-space.type";
import axiosClient from "./axiosClient";

export const TaskService = {
  getById: (id: string) => {
    return axiosClient.get(`/task/${id}`);
  },
  create: (dto: Task) => {
    return axiosClient.post("/task", dto);
  },
  update: (id: string, dto: Task) => {
    return axiosClient.put(`/task/${id}`, dto);
  },
  updateStatusById: (id: string, dto: { status: string }) => {
    return axiosClient.put(`/task/${id}/status`, dto);
  },
  delete: (id: string) => {
    return axiosClient.delete(`/task/${id}`);
  },
  check: (body: FormData, id: string): Promise<void> => {
    //set header
    const headers = {
      "Content-Type": "multipart/form-data",
    };
    return axiosClient.post(`/task/${id}/check`, body, { headers });
  },
} as const;
