import { useQuery } from "@tanstack/react-query";

import type { PaginationDto } from "../../@types/common.type";
import { NotificationService } from "../../services/notification.service";

export const NOTIFICATION_QUERY_KEY = "notification/query";
export const NOTIFICATION_CHECK_KEY = "notification/check";

export function useGetNotification(dto: Partial<PaginationDto>) {
  return useQuery({
    queryKey: [NOTIFICATION_QUERY_KEY, "notification", dto],
    queryFn: () => NotificationService.getNotifications(dto),
  });
}

export function useCheckNotification() {
  return useQuery({
    queryKey: [NOTIFICATION_CHECK_KEY],
    queryFn: () => NotificationService.checkNotification(),
  });
}
