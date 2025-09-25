import type { PaginationDto } from "../@types/common.type";
import type { Material } from "../@types/material.type";
import axiosClient from "./axiosClient";

export const MaterialService = {
  getMaterials: (dto: Partial<PaginationDto> = {}) => {
    return axiosClient.get("/material", { params: dto });
  },
  getMaterialDetail: (id: number) => {
    return axiosClient.get(`/material/${id}`);
  },
  // createMaterial: (dto: FormData) => {
  //   return axiosClient.postForm("/material", dto, {
  //     headers: {
  //       "Content-Type": "multipart/form-data",
  //     },
  //   });
  // },

  createMaterial: (
    dto: Omit<Material, "createdAt" | "updatedAt" | "deletedAt">
  ) => {
    return axiosClient.post("/material/", dto);
  },



  updateMaterial: (
    id: number,  
    dto: Omit<Material, "createdAt" | "updatedAt" | "deletedAt">
  ) => {
    return axiosClient.put(`/material/${id}`, dto);
  },
  deleteMaterial: (id: number) => {
    return axiosClient.delete(`/material/${id}`);
  },
} as const;
