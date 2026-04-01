import { api } from "./requests";
import type { ApiResponse, User } from "@/types";

export const authService = {
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>("/auth/login", data),

  register: (data: { name: string; username: string; email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>("/auth/register", data),

  logout: () => api.post<ApiResponse<void>>("/auth/logout", {}),

  me: () => api.get<ApiResponse<User>>("/auth/me"),

  refreshToken: () =>
    api.post<ApiResponse<{ token: string }>>("/auth/refresh", {}),
};
