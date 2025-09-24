import { useMutation, useQuery } from "@tanstack/react-query";

import type { PaginationDto } from "../../@types/common.type";
import { CommentService } from "../../services/comment.service";

export const COMMENT_QUERY_KEY = "comment/query";

export function useCreateComment() {
  return useMutation({
    mutationFn: ({ dto, id }: { dto: FormData; id: string }) =>
      CommentService.createComment(id, dto),
  });
}

export function useGetCommentById(id: string, dto?: Partial<PaginationDto>) {
  return useQuery({
    queryKey: [COMMENT_QUERY_KEY, "comment", id, dto],
    queryFn: () => CommentService.getCommentById(id, dto || {}),
    enabled: !!id,
  });
}
