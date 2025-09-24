import type { JwtResponse, User } from "../@types/user.type";
import axiosClient from "./axiosClient";

export const AuthService = {
  login: (body: Pick<User, "username" | "password">): Promise<JwtResponse> => {
    return axiosClient.post("/auth/login", body);
  },
  me: (): Promise<User | null> => {
    return axiosClient.get("/auth/me");
  },
  update: (
    body: Partial<Pick<User, "username" | "password" | "fullName">>
  ): Promise<Pick<User, "username" | "password" | "fullName">> => {
    return axiosClient.put("/auth/me", body);
  },
  updateAvatar: (body: FormData): Promise<User> => {
    return axiosClient.putForm("/auth/me/avatar", body, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
} as const;
