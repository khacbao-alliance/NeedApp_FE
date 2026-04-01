import { api } from "./requests";
import type { ApiResponse, PaginatedResponse, Post } from "@/types";

export const postService = {
  getFeed: (page = 1) =>
    api.get<PaginatedResponse<Post>>(`/posts/feed?page=${page}&limit=10`),

  getById: (id: string) => api.get<ApiResponse<Post>>(`/posts/${id}`),

  create: (data: { content: string; images?: string[] }) =>
    api.post<ApiResponse<Post>>("/posts", data),

  like: (id: string) => api.post<ApiResponse<{ likes: number }>>(`/posts/${id}/like`, {}),

  unlike: (id: string) =>
    api.delete<ApiResponse<{ likes: number }>>(`/posts/${id}/like`),

  delete: (id: string) => api.delete<ApiResponse<void>>(`/posts/${id}`),
};
