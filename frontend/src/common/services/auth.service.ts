import type { JwtResponse, User } from "../@types/user.type";
import axiosClient from "./axiosClient";

export const AuthService = {
  login: async (body: Pick<User, "username" | "password">): Promise<JwtResponse> => {
    try {
      const response = await axiosClient.post<JwtResponse>("/auth/login", body);
      const payload = response.data as JwtResponse;
      const access_token = payload.access_token;
      if (!access_token) throw new Error("No access token");

      localStorage.setItem("accessToken", access_token);
      
      return payload;
    } catch (error) {
      console.error("Login error: ", error);
      throw error;
    }
  },
  me: (): Promise<User | null> => {
    const accessToken = localStorage.getItem("accessToken") || "";
    // console.log("AS_ME", accessToken);
    return axiosClient.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  update: (
    body: Partial<Pick<User, "username" | "password" | "fullName">>
  ): Promise<Pick<User, "username" | "password" | "fullName">> => {
    
    const accessToken = localStorage.getItem("accessToken") || "";
    // console.log("AS_ME_UPDATE", accessToken);
    return axiosClient.put("/auth/me", body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  updateAvatar: (body: FormData): Promise<User> => {
    const accessToken = localStorage.getItem("accessToken") || "";
    return axiosClient.putForm("/auth/me/avatar", body, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },
} as const;
