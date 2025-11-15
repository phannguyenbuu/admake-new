import { useMutation, useQuery } from "@tanstack/react-query";
import { AttendanceService } from "../../services/attendance.service";
import type { ReportById, ReportTime } from "../../@types/attendance.type";

export const ATTENDANCE_QUERY_KEY = "attendance/query";
export const ATTENDANCE_REPORT_QUERY_KEY = "attendance/queryReport";
export const ATTENDANCE_REPORT_BY_ID_QUERY_KEY = "attendance/queryReportById";
export const ATTENDANCE_KEY_QUERY_KEY = "attendance/queryByKey";

export function useGetAttendance() {
  return useQuery({
    queryKey: [ATTENDANCE_QUERY_KEY],
    queryFn: () => AttendanceService.getAttendance(),
  });
}
export function useGetReport(body: ReportTime) {
  return useQuery({
    queryKey: [ATTENDANCE_REPORT_QUERY_KEY, body],
    queryFn: () => AttendanceService.getReport(body),
  });
}

export function useCheckAttendance() {
  return useMutation({
    mutationFn: (body: FormData) => AttendanceService.check(body),
  });
}

export function useGetReportById(body: ReportById) {
  return useQuery({
    queryKey: [ATTENDANCE_REPORT_BY_ID_QUERY_KEY, body],
    queryFn: () => AttendanceService.getReportById(body),
    enabled: !!body.id,
  });
}
export function useGetByKey() {
  return useMutation({
    mutationKey: [ATTENDANCE_KEY_QUERY_KEY],
    mutationFn: (body: { key: string; userId: string }) =>
      AttendanceService.getByKey(body.key, body.userId),
  });
}
