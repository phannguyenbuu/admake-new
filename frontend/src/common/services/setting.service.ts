import type {
  Setting,
  SettingDto,
  StandardWorkingDaysDto,
} from "../@types/setting.type";
import type { AxiosResponse } from "axios";
import axiosClient from "./axiosClient";

export const SettingService = {
  getAll: (): Promise<AxiosResponse<Setting[]>> => {
    return axiosClient.get("/setting/get-setting");
  },

  update: (dto: SettingDto): Promise<AxiosResponse<Setting>> => {
    return axiosClient.put(`/setting/update-setting`, dto);
  },
  updateStandardWorkingDays: (
    dto: StandardWorkingDaysDto
  ): Promise<AxiosResponse<Setting>> => {
    return axiosClient.put(`/setting/update-standard-working-days`, dto);
  },
} as const;
