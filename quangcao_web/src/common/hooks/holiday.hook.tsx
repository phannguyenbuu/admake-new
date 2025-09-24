import { useMutation, useQuery } from "@tanstack/react-query";
import { HolidayService } from "../../services/holiday.service";
import type { Holiday } from "../../@types/holiday.type";
import type { PaginationDto } from "../../@types/common.type";

export function useCreateHoliday() {
  return useMutation({
    mutationFn: (dto: Omit<Holiday, "_id" | "createdAt" | "updatedAt">) =>
      HolidayService.createHoliday(dto),
  });
}

export function useGetHolidays(id: string, dto: Partial<PaginationDto>) {
  return useQuery({
    queryKey: ["holidays", id, dto],
    queryFn: () => HolidayService.getHolidaysByUserId(id, dto),
  });
}

export function useGetHolidayById(id: string) {
  return useQuery({
    queryKey: ["holiday", id],
    queryFn: () => HolidayService.getHolidayById(id),
    enabled: !!id,
  });
}

export function useUpdateHoliday() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Holiday> }) =>
      HolidayService.updateHoliday(id, dto),
  });
}

export function useDeleteHoliday() {
  return useMutation({
    mutationFn: (id: string) => HolidayService.deleteHoliday(id),
  });
}
