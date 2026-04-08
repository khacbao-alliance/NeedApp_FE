import { api } from './requests';
import type { NotificationDto, UnreadCountDto } from '@/types';

export const notificationService = {
  getAll: (page = 1, pageSize = 20) =>
    api.get<NotificationDto[]>(`/notifications?page=${page}&pageSize=${pageSize}`),

  getUnreadCount: () =>
    api.get<UnreadCountDto>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    api.put<void>(`/notifications/${id}/read`, {}),

  markAllAsRead: () =>
    api.put<void>('/notifications/read-all', {}),

  markAsReadByRequest: (requestId: string) =>
    api.put<void>(`/notifications/read-by-request/${requestId}`, {}),
};

