import { useMutation, useQuery, useInfiniteQuery } from "@tanstack/react-query";
import type { PaginationDto } from "../../@types/common.type";
import { UserService } from "../../services/user.service";

export const USER_QUERY_KEY = "user/queryPagination";
export const USER_DETAIL_QUERY_KEY = "user/queryDetail";
export function useUserQuery(dto: Partial<PaginationDto> = {}) {
  return useQuery({
    queryKey: [USER_QUERY_KEY, dto],
    queryFn: () => UserService.getAll(dto),
  });
}

export function useUserDetail(id?: string) {
  return useQuery({
    queryKey: [USER_DETAIL_QUERY_KEY, id],
    queryFn: () => UserService.getDetail(id || ""),
    enabled: !!id,
  });
}

export function useCreateUser() {
  return useMutation({
    mutationFn: (dto: FormData) => UserService.create(dto),
  });
}

export function useUpdateUser() {
  return useMutation({
    mutationFn: ({ dto, id }: { dto: FormData; id: string }) =>
      UserService.update(id, dto),
  });
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: (id: string) => UserService.delete(id),
  });
}

// Infinite users list with append and basic hasMore heuristic (length >= limit)
export function useUsersInfinite(dto: Partial<PaginationDto> = {}) {
  const limit = dto.limit ?? 10;
  return useInfiniteQuery({
    queryKey: [USER_QUERY_KEY, "infinite", dto], // tạo query key
    queryFn: ({ pageParam = 1 }) =>
      UserService.getAll({ ...dto, page: pageParam }),
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
