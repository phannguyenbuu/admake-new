import type { PaginationDto } from "../@types/common.type";
import axiosClient from "./axiosClient";

export const MaterialService = {
  getMaterials: (dto: Partial<PaginationDto> = {}) => {
    return axiosClient.get("/material", { params: dto });
  },
  getMaterialDetail: (id: string) => {
    return axiosClient.get(`/material/${id}`);
  },
  createMaterial: (dto: FormData) => {
    return axiosClient.postForm("/material", dto, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updateMaterial: (id: string, dto: FormData) => {
    return axiosClient.putForm(`/material/${id}`, dto, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteMaterial: (id: string) => {
    return axiosClient.delete(`/material/${id}`);
  },
} as const;
