import { useMutation, useQuery, useInfiniteQuery } from "@tanstack/react-query";
import type { PaginationDto } from "../../@types/common.type";
import { SupplierService } from "../../services/supplier.service";
import type { User } from "../../@types/user.type";

export const USER_QUERY_KEY = "supplier/queryPagination";
export const USER_DETAIL_QUERY_KEY = "supplier/queryDetail";
export function useSupplierQuery(dto: Partial<PaginationDto> = {}) {
  return useQuery({
    queryKey: [USER_QUERY_KEY, dto],
    queryFn: () => SupplierService.getAll(dto),
  });
}

export function useSupplierDetail(id?: string) {
  return useQuery({
    queryKey: [USER_DETAIL_QUERY_KEY, id],
    queryFn: () => SupplierService.getDetail(id || ""),
    enabled: !!id,
  });
}

export function useCreateUser() {
  return useMutation({
    mutationFn: (dto: User) => SupplierService.create(dto),
  });
}

export function useUpdateUser() {
  return useMutation({
    mutationFn: ({ dto, id }: { dto: User; id: string }) =>
      SupplierService.update(id, dto),
  });
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: (id: string) => SupplierService.delete(id),
  });
}

// Infinite users list with append and basic hasMore heuristic (length >= limit)
export function useSuppliersInfinite(dto: Partial<PaginationDto> = {}) {
  const limit = dto.limit ?? 10;
  return useInfiniteQuery({
    queryKey: [USER_QUERY_KEY, "infinite", dto], // tạo query key
    queryFn: ({ pageParam = 1 }) =>
      SupplierService.getAll({ ...dto, page: pageParam }),
    // tạo hàm getNextPageParam để lấy pageParam tiếp theo
    getNextPageParam: (lastPage, allPages) => {
      const payload: any = (lastPage as any)?.data;
      const items: any[] = payload?.data ?? payload ?? [];
      // nếu có items và số lượng items >= limit thì trả về pageParam tiếp theo
      return Array.isArray(items) && items.length >= limit
        ? allPages.length + 1
        : undefined;
    },
    initialPageParam: 1,
  });
}
