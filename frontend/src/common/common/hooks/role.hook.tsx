import { useMutation, useQuery } from "@tanstack/react-query";
import { RoleService } from "../../services/role.service";
import type { Role } from "../../@types/role.type";

export const ROLE_QUERY_KEY = "role/queryPagination";
export const ROLE_DETAIL_QUERY_KEY = "role/queryDetail";
export function useRoleQuery() {
  return useQuery({
    queryKey: [ROLE_QUERY_KEY],
    queryFn: () => RoleService.getAll().then((res) => res?.data ?? []),
  });
}

export function useRolePermission() {
  return useQuery({
    queryKey: [ROLE_DETAIL_QUERY_KEY],
    queryFn: () => RoleService.getPermission(),
  });
}

export function useRoleDetail(id?: number) {
  return useQuery({
    queryKey: [ROLE_DETAIL_QUERY_KEY, id],
    queryFn: () => RoleService.getId(id || 0),
    enabled: !!id,
  });
}

export function useCreateRole() {
  return useMutation({
    mutationFn: (dto: Role) => RoleService.create(dto),
  });
}

export function useUpdateRole() {
  return useMutation({
    mutationFn: ({ dto, id }: { dto: Role; id: number }) =>
      RoleService.update(id, dto),
  });
}

export function useDeleteRole() {
  return useMutation({
    mutationFn: (id: number) => RoleService.delete(id),
  });
}
