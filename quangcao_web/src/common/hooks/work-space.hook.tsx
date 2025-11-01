import { useMutation, useQuery } from "@tanstack/react-query";
import { WorkSpaceService } from "../../services/work-space.service";
import type { Task, WorkSpace } from "../../@types/work-space.type";
import { TaskService } from "../../services/task.service";
import { useUser } from "./useUser";
import type { PaginationDto } from "../../@types/common.type";

export const TASK_QUERY_KEY = "task/query";
export const WORK_SPACE_DETAIL_QUERY_KEY = "workspace/queryDetail";
// export function useWorkSpaceQueryAll() {
//   const {userLeadId} = useUser();
//   return useQuery({
//     queryKey: [WORK_SPACE_DETAIL_QUERY_KEY],
//     queryFn: () => WorkSpaceService.getAll(userLeadId),
//   });
// }


export function useWorkSpaceQueryAll(dto: Partial<PaginationDto> = {}) {
  return useQuery({
    queryKey: [WORK_SPACE_DETAIL_QUERY_KEY, dto],
    queryFn: () => WorkSpaceService.getAll(dto),
  });
}

export function useWorkSpaceQueryById(id: string) {
  return useQuery({
    queryKey: [WORK_SPACE_DETAIL_QUERY_KEY, "workspace", id],
    queryFn: () => WorkSpaceService.getById(id),
    enabled: !!id,
  });
}

export function useWorkSpaceQueryTaskById(id: string) {
  return useQuery({
    queryKey: [WORK_SPACE_DETAIL_QUERY_KEY, "tasks", id],
    queryFn: () => WorkSpaceService.getTaskById(id),
    enabled: !!id,
    staleTime: 0, // Always consider data stale to refetch when id changes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function useCreateWorkSpace() {
  return useMutation({
    mutationFn: (dto: WorkSpace) => WorkSpaceService.create(dto),
  });
}

export function useUpdateWorkSpace() {
  return useMutation({
    mutationFn: ({
      dto,
      id,
    }: {
      dto: Omit<WorkSpace, "_id" | "cover">;
      id: string;
    }) => WorkSpaceService.update(id, dto),
  });
}

export function useDeleteWorkSpace() {
  return useMutation({
    mutationFn: (id: string) => WorkSpaceService.delete(id),
  });
}

// task query
export function useCreateTask() {
  return useMutation({
    mutationFn: (dto: Task) => TaskService.create(dto),
  });
}

export function useGetTaskById(id: string) {
  return useQuery({
    // cần refectch mỗi khi mở lại form task
    queryKey: [TASK_QUERY_KEY, id],
    queryFn: async () => {
      try {
        const response = await TaskService.getById(id);
        return response.data; // trả về data đúng
      } catch (error) {
        throw error; // ném lỗi để React Query nhận biết và set isError=true
      }
    },

    enabled: !!id,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateTask() {
  return useMutation({
    mutationFn: ({ dto, id }: { dto: Task; id: string }) =>
      TaskService.update(id, dto),
  });
}

export function useUpdateTaskStatusById() {
  return useMutation({
    mutationFn: ({ dto, id }: { dto: { status: string }; id: string }) =>
      TaskService.updateStatusById(id, dto),
  });
}

export function useDeleteTask() {
  return useMutation({
    mutationFn: (id: string) => TaskService.delete(id),
  });
}

export function useCheckTask() {
  return useMutation({
    mutationFn: ({ body, id }: { body: FormData; id: string }) =>
      TaskService.check(body, id),
  });
}
