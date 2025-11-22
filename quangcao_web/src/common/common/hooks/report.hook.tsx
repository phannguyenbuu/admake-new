import { useMutation, useQuery } from "@tanstack/react-query";
import { ReportService, type ReportDto } from "../../services/report.service";

export const REPORT_QUERY_KEY = "report/query";
export const REPORT_ATTENDANCE_QUERY_KEY = "report/attendance/query";
export const REPORT_EXCEL_ATTENDANCE_QUERY_KEY =
  "report/attendance/excel/query";
export const REPORT_EXCEL_CALCULATE_QUERY_KEY =
  "report/attendance/excel/calculate/query";

export const useReport = (dto: ReportDto) => {
  return useQuery({
    queryKey: [REPORT_QUERY_KEY, dto],
    queryFn: () => ReportService.getReport(dto),
  });
};

export const useReportAttendance = (dto: ReportDto) => {
  return useQuery({
    queryKey: [REPORT_ATTENDANCE_QUERY_KEY, dto],
    queryFn: () => ReportService.getReportAttendance(dto),
  });
};

export const useReportExcelAttendance = (dto: ReportDto) => {
  return useMutation({
    mutationFn: () => ReportService.getReportExcelAttendance(dto),
  });
};

export const useReportExcelCalculate = (dto: ReportDto) => {
  return useMutation({
    mutationFn: () => ReportService.getReportExcelCalculate(dto),
  });
};
