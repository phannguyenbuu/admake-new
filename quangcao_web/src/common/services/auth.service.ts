import type { JwtResponse, User } from "../@types/user.type";
import axiosClient from "./axiosClient";
import { useApiHost } from "../common/hooks/useApiHost";

const API_HOST = useApiHost();

export const AuthService = {
  login: async (body: Pick<User, "username" | "password">): Promise<JwtResponse> => {
    try {
      const response = await axiosClient.post<JwtResponse>(`${API_HOST}/auth/login`, body);
      console.log("response", response);
      const access_token = (response as any).access_token;
      if (!access_token) throw new Error("No access token");


      sessionStorage.setItem("accessToken", access_token);
      
      return (response as any);
    } catch (error) {
      console.error("Login error: ", error);
      throw error;
    }
  },
  me: (): Promise<User | null> => {
    const accessToken = sessionStorage.getItem("accessToken") || "";
    // console.log("AS_ME", accessToken);
    return axiosClient.get(`${API_HOST}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  update: (
    body: Partial<Pick<User, "username" | "password" | "fullName">>
  ): Promise<Pick<User, "username" | "password" | "fullName">> => {
    
    const accessToken = sessionStorage.getItem("accessToken") || "";
    // console.log("AS_ME_UPDATE", accessToken);
    return axiosClient.put(`${API_HOST}/auth/me`, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  updateAvatar: (body: FormData): Promise<User> => {
    const accessToken = sessionStorage.getItem("accessToken") || "";
    return axiosClient.putForm(`${API_HOST}/auth/me/avatar`, body, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },
} as const;
