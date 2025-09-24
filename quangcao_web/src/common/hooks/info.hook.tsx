import { useMutation, useQuery } from "@tanstack/react-query";
import { AuthService } from "../../services/auth.service";
import type { User } from "../../@types/user.type";

export const INFO_DETAIL_QUERY_KEY = "info/queryDetail";
export function useInfo() {
  return useQuery({
    queryKey: [INFO_DETAIL_QUERY_KEY],
    queryFn: () => AuthService.me(),
  });
}

export function useUpdateInfo() {
  return useMutation({
    mutationFn: (
      body: Partial<Pick<User, "phone" | "password" | "fullName">>
    ) => AuthService.update(body),
  });
}

export function useUpdateAvatar() {
  return useMutation({
    mutationFn: (body: FormData) => AuthService.updateAvatar(body),
  });
}
