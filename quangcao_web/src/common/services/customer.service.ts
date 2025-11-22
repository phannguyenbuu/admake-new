import type { PaginationDto } from "../@types/common.type";
// import type { Customer } from "../@types/customer.type";
import type { WorkSpace } from "../@types/work-space.type";
import axiosClient from "./axiosClient";

export const CustomerService = {
  getCustomers: (dto: Partial<PaginationDto> = {}) => {
    return axiosClient.get("/customer/", { params: dto });
  },
  getCustomerDetail: (id: string) => {
    console.log('HY useCustomerDetail', id);
    return axiosClient.get(`/customer/${id}`);
  },
  createCustomer: (
    dto: Omit<WorkSpace, "createdAt" | "updatedAt" | "deletedAt">
  ) => {
    return axiosClient.post("/customer/", dto).then(response => response.data);
  },
  updateCustomer: (
    id: string,
    dto: Omit<WorkSpace, "createdAt" | "updatedAt" | "deletedAt">
  ) => {
    return axiosClient.put(`/customer/${id}`, dto);
  },
  deleteCustomer: (id: string) => {
    return axiosClient.delete(`/customer/${id}`);
  },
} as const;
