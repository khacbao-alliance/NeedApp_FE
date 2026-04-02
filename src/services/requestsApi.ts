import { api } from './requests';
import type {
  CreateRequestRequest,
  CreateRequestResponse,
  RequestDto,
  RequestStatus,
  RequestPriority,
  PaginatedResponse,
} from '@/types';

export interface GetRequestsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: RequestStatus;
  priority?: RequestPriority;
}

export const requestService = {
  list: (params: GetRequestsParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params.search) searchParams.set('search', params.search);
    if (params.status) searchParams.set('status', params.status);
    if (params.priority) searchParams.set('priority', params.priority);
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
};

