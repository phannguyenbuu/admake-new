import { useMutation, useQuery } from "@tanstack/react-query";
import type { PaginationDto } from "../../@types/common.type";
import { CustomerService } from "../../services/customer.service";
// import type { Customer } from "../../@types/customer.type";
import type { WorkSpace } from "../../@types/work-space.type";

export const CUSTOMER_QUERY_KEY = "customer/queryPagination";
export const CUSTOMER_DETAIL_QUERY_KEY = "customer/queryDetail";

export function useCustomerQuery(dto: Partial<PaginationDto> = {}) {
  return useQuery({
    queryKey: [CUSTOMER_QUERY_KEY, dto],
    queryFn: () => CustomerService.getCustomers(dto),
  });
}

export function useCustomerDetail(id?: string) {
  
  return useQuery({
    queryKey: [CUSTOMER_DETAIL_QUERY_KEY, id],
    queryFn: () => CustomerService.getCustomerDetail(id || ''),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  return useMutation({
    mutationFn: (
      dto: Omit<WorkSpace, "createdAt" | "updatedAt" | "deletedAt">
    ) => CustomerService.createCustomer(dto),
  });
}

export function useUpdateCustomer() {
  return useMutation({
    mutationFn: ({
      dto,
      id,
    }: {
      dto: Omit<WorkSpace, "createdAt" | "updatedAt" | "deletedAt">;
      id: string;
    }) => CustomerService.updateCustomer(id, dto),
  });
}

export function useDeleteCustomer() {
  return useMutation({
    mutationFn: (id: string) => CustomerService.deleteCustomer(id),
  });
}
