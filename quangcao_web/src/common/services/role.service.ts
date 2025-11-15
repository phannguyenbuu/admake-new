import type { Role } from "../@types/role.type";
import axiosClient from "./axiosClient";

export const RoleService = {
  getAll: () => {
    return axiosClient.get("/role/");
  },
  getId: (id: number) => {
    return axiosClient.get(`/role/${id}`);
  },
  getPermission: () => {
    return axiosClient.get("/role/list/permission/");
  },
  create: (dto: Role) => {
    return axiosClient.post("/role/", dto);
  },
  update: (id: number, dto: Role) => {
    return axiosClient.put(`/role/${id}`, dto);
  },
  delete: (id: number) => {
    return axiosClient.delete(`/role/${id}`);
  },
} as const;
