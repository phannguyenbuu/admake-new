import type { Role } from "../@types/role.type";
import type { AxiosResponse } from "axios";
import axiosClient from "./axiosClient";

export const RoleService = {
  getAll: (): Promise<AxiosResponse<Role[]>> => {
    return axiosClient.get("/role/");
  },
  getId: (id: number): Promise<AxiosResponse<Role>> => {
    return axiosClient.get(`/role/${id}`);
  },
  getPermission: (): Promise<AxiosResponse<Role[]>> => {
    return axiosClient.get("/role/list/permission/");
  },
  create: (dto: Role): Promise<AxiosResponse<Role>> => {
    return axiosClient.post("/role/", dto);
  },
  update: (id: number, dto: Role): Promise<AxiosResponse<Role>> => {
    return axiosClient.put(`/role/${id}`, dto);
  },
  delete: (id: number): Promise<AxiosResponse<void>> => {
    return axiosClient.delete(`/role/${id}`);
  },
} as const;
