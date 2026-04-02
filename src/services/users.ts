import { api } from './requests';
import type { UserDetailDto, PaginatedResponse, UserRole } from '@/types';

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
}

export const userService = {
  list: (params?: { page?: number; pageSize?: number; search?: string; role?: UserRole }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.role) searchParams.set('role', params.role);
    return api.get<PaginatedResponse<UserDetailDto>>(`/users?${searchParams.toString()}`);
  },

  getById: (id: string) =>
    api.get<UserDetailDto>(`/users/${id}`),

  create: (data: CreateUserRequest) =>
    api.post<UserDetailDto>('/users', data),

  update: (id: string, data: UpdateUserRequest) =>
    api.put<UserDetailDto>(`/users/${id}`, data),

  delete: (id: string) =>
    api.delete<void>(`/users/${id}`),
};
