import type {
  Setting,
  SettingDto,
  StandardWorkingDaysDto,
} from "../@types/setting.type";
import axiosClient from "./axiosClient";

export const SettingService = {
  getAll: (): Promise<Setting[]> => {
    return axiosClient.get("/setting/get-setting");
  },

  update: (dto: SettingDto): Promise<Setting> => {
    return axiosClient.put(`/setting/update-setting`, dto);
  },
  updateStandardWorkingDays: (
    dto: StandardWorkingDaysDto
  ): Promise<Setting> => {
    return axiosClient.put(`/setting/update-standard-working-days`, dto);
  },
} as const;
