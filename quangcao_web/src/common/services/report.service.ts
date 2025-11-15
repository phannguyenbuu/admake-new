import { downloadFromBlob } from "../utils/download.util";
import axiosClient from "./axiosClient";

export interface ReportDto {
  from: number;
  to: number;
}

export const ReportService = {
  getReport: (dto: ReportDto) => {
    return axiosClient.get("/report/task/grid", { params: dto });
  },
  getReportAttendance: (dto: ReportDto) => {
    return axiosClient.get("/report/attendance", {
      params: dto,
    });
  },
  getReportExcelAttendance: async (dto: ReportDto) => {
    const res = await axiosClient.get("/report/attendance/excel", {
      params: dto,
      responseType: "blob",
    });
    const contentType = res.headers?.["content-type"] || "";
    if (contentType.includes("application/json")) {
      const text = await res.data.text?.();
      throw new Error(text || "Quote error");
    }

    // Truyền toàn bộ response object để có thể lấy headers
    downloadFromBlob(res, "chamcong.xlsx");
    return true;
  },
  getReportExcelCalculate: async (dto: ReportDto) => {
    const res = await axiosClient.get("/report/attendance/excel/calculate", {
      params: dto,
      responseType: "blob",
    });

    // Truyền toàn bộ response object để có thể lấy headers
    downloadFromBlob(res, "tinhcong.xlsx");
    return true;
  },
} as const;
