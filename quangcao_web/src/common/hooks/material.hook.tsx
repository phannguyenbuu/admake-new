import { useMutation, useQuery, useInfiniteQuery } from "@tanstack/react-query";
import type { PaginationDto } from "../../@types/common.type";
import { MaterialService } from "../../services/material.service";

export const MATERIAL_QUERY_KEY = "material/queryPagination";
export const MATERIAL_DETAIL_QUERY_KEY = "material/queryDetail";
export function useMaterialQuery(dto: Partial<PaginationDto> = {}) {
  return useQuery({
    queryKey: [MATERIAL_QUERY_KEY, dto],
    queryFn: () => MaterialService.getMaterials(dto),
  });
}

export function useMaterialDetail(id?: string) {
  return useQuery({
    queryKey: [MATERIAL_DETAIL_QUERY_KEY, id],
    queryFn: () => MaterialService.getMaterialDetail(id || ""),
    enabled: !!id,
  });
}

export function useCreateMaterial() {
  return useMutation({
    mutationFn: (dto: FormData) => MaterialService.createMaterial(dto),
  });
}

export function useUpdateMaterial() {
  return useMutation({
    mutationFn: ({ dto, id }: { dto: FormData; id: string }) =>
      MaterialService.updateMaterial(id, dto),
  });
}

export function useDeleteMaterial() {
  return useMutation({
    mutationFn: (id: string) => MaterialService.deleteMaterial(id),
  });
}

// Infinite materials list with append and basic hasMore heuristic (length >= limit)
export function useMaterialsInfinite(dto: Partial<PaginationDto> = {}) {
  const limit = dto.limit ?? 10;
  return useInfiniteQuery({
    queryKey: [MATERIAL_QUERY_KEY, "infinite", dto],
    queryFn: ({ pageParam = 1 }) =>
      MaterialService.getMaterials({ ...dto, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const payload: any = (lastPage as any)?.data;
      const items: any[] = payload?.data ?? payload ?? [];
      return Array.isArray(items) && items.length >= limit
        ? allPages.length + 1
        : undefined;
    },
    initialPageParam: 1,
  });
}
