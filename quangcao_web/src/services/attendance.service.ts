import type {
  AttendanceByKey,
  ReportById,
  ReportTime,
} from "../@types/attendance.type";
import type { Attendance } from "../@types/attendance.type";
import axiosClient from "./axiosClient";

export const AttendanceService = {
  check: (body: FormData): Promise<void> => {
    return axiosClient.post("/attendance/check", body, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  getAttendance: (): Promise<Attendance> => {
    return axiosClient.get("/attendance");
  },
  getReport: (body: ReportTime): Promise<void> => {
    return axiosClient.get("/attendance/report", { params: body });
  },
  getReportById: (body: ReportById): Promise<void> => {
    return axiosClient.get(`/attendance/report`, { params: body });
  },
  getByKey: (key: string, userId: string): Promise<AttendanceByKey> => {
    return axiosClient.post(`/attendance/getByKey`, { key, userId });
  },
} as const;
