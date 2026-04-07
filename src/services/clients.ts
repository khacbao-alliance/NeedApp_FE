import { api } from './requests';
import type { ClientDto, CreateClientRequest, ClientMemberDto, AddMemberRequest } from '@/types';

export const clientService = {
  create: (data: CreateClientRequest) =>
    api.post<ClientDto>('/clients', data),

  getById: (id: string) =>
    api.get<ClientDto>(`/clients/${id}`),

  getMembers: (clientId: string) =>
    api.get<ClientMemberDto[]>(`/clients/${clientId}/members`),

  inviteMember: (clientId: string, data: AddMemberRequest) =>
    api.post<ClientMemberDto>(`/clients/${clientId}/members`, data),

  removeMember: (clientId: string, userId: string) =>
    api.delete<void>(`/clients/${clientId}/members/${userId}`),
};
