import type { PaginationDto } from "../@types/common.type";
import type { Customer } from "../@types/customer.type";
import axiosClient from "./axiosClient";

export const CustomerService = {
  getCustomers: (dto: Partial<PaginationDto> = {}) => {
    return axiosClient.get("/customer", { params: dto });
  },
  getCustomerDetail: (id: number) => {
    console.log('HY useCustomerDetail', id);
    return axiosClient.get(`/customer/${id}`);
  },
  createCustomer: (
    dto: Omit<Customer, "createdAt" | "updatedAt" | "deletedAt">
  ) => {
    return axiosClient.post("/customer/", dto);
  },
  updateCustomer: (
    id: number,
    dto: Omit<Customer, "createdAt" | "updatedAt" | "deletedAt">
  ) => {
    return axiosClient.put(`/customer/${id}`, dto);
  },
  deleteCustomer: (id: number) => {
    return axiosClient.delete(`/customer/${id}`);
  },
} as const;
