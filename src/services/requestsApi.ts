import { api } from './requests';
import type {
  CreateRequestRequest,
  CreateRequestResponse,
  RequestDto,
  RequestStatus,
  RequestPriority,
  PaginatedResponse,
  MessageDto,
} from '@/types';

export interface GetRequestsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: RequestStatus;
  priority?: RequestPriority;
  // ── Advanced filters ──
  assignedTo?: string;
  clientId?: string;
  dateFrom?: string;   // ISO date string
  dateTo?: string;     // ISO date string
  isOverdue?: boolean;
  sortBy?: string;
}

export const requestService = {
  list: (params: GetRequestsParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params.search) searchParams.set('search', params.search);
    if (params.status) searchParams.set('status', params.status);
    if (params.priority) searchParams.set('priority', params.priority);
    if (params.assignedTo) searchParams.set('assignedTo', params.assignedTo);
    if (params.clientId) searchParams.set('clientId', params.clientId);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    if (params.isOverdue) searchParams.set('isOverdue', 'true');
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    const qs = searchParams.toString();
    return api.get<PaginatedResponse<RequestDto>>(`/requests${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) =>
    api.get<RequestDto>(`/requests/${id}`),

  create: (data: CreateRequestRequest) =>
    api.post<CreateRequestResponse>('/requests', data),

  /** Staff/Admin: change request status (PATCH) */
  updateStatus: (id: string, status: RequestStatus) =>
    api.patch<RequestDto>(`/requests/${id}/status`, { status }),

  /** Admin only: assign a staff user to request (PATCH) */
  assign: (id: string, staffUserId: string) =>
    api.patch<RequestDto>(`/requests/${id}/assign`, { staffUserId }),

  /** Staff: self-assign to an unassigned request (PATCH) */
  selfAssign: (id: string) =>
    api.patch<RequestDto>(`/requests/${id}/self-assign`, {}),

  /** Admin: unassign staff from request (PATCH) */
  unassign: (id: string) =>
    api.patch<RequestDto>(`/requests/${id}/unassign`, {}),

  /** Search messages within a request */
  searchMessages: (requestId: string, q: string, limit = 50) =>
    api.get<MessageDto[]>(`/requests/${requestId}/messages/search?q=${encodeURIComponent(q)}&limit=${limit}`),
};
