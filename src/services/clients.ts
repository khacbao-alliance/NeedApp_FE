import { api } from './requests';
import type { ClientDto, CreateClientRequest, ClientMemberDto, AddMemberRequest } from '@/types';

export interface UpdateClientRequest {
  name?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export const clientService = {
  create: (data: CreateClientRequest) =>
    api.post<ClientDto>('/clients', data),

  update: (id: string, data: UpdateClientRequest) =>
    api.put<ClientDto>(`/clients/${id}`, data),

  getById: (id: string) =>
    api.get<ClientDto>(`/clients/${id}`),

  getMembers: (clientId: string) =>
    api.get<ClientMemberDto[]>(`/clients/${clientId}/members`),

  inviteMember: (clientId: string, data: AddMemberRequest) =>
    api.post<ClientMemberDto>(`/clients/${clientId}/members`, data),

  removeMember: (clientId: string, userId: string) =>
    api.delete<void>(`/clients/${clientId}/members/${userId}`),

  /** Owner deletes the entire client organization */
  deleteMyClient: () =>
    api.delete<void>('/clients/me'),

  /** Member leaves the client organization */
  leaveClient: () =>
    api.delete<void>('/clients/me/leave'),
};

