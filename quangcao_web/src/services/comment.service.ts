import type { PaginationDto } from "../@types/common.type";
import axiosClient from "./axiosClient";

export const CommentService = {
  createComment: (id: string, dto: FormData) => {
    return axiosClient.post(`/task/${id}/comment`, dto, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  getCommentById: (id: string, dto: Partial<PaginationDto>) => {
    return axiosClient.get(`/task/${id}/comment`, { params: dto });
  },
} as const;
