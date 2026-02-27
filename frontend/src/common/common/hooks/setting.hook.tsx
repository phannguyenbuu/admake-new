import { useMutation, useQuery } from "@tanstack/react-query";
import { SettingService } from "../../services/setting.service";
import type {
  SettingDto,
  StandardWorkingDaysDto,
} from "../../@types/setting.type";

export const SETTING_QUERY_KEY = "setting/queryAll";
export const SETTING_DETAIL_QUERY_KEY = "setting/queryDetail";

export function useSettingQuery() {
  return useQuery({
    queryKey: [SETTING_QUERY_KEY],
    queryFn: () => SettingService.getAll(),
  });
}

export function useUpdateSetting() {
  return useMutation({
    mutationFn: (dto: SettingDto) => SettingService.update(dto),
  });
}

export function useUpdateStandardWorkingDays() {
  return useMutation({
    mutationFn: (dto: StandardWorkingDaysDto) =>
      SettingService.updateStandardWorkingDays(dto),
  });
}
