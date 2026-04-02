import { api } from './requests';
import type { ClientDto, CreateClientRequest } from '@/types';

export const clientService = {
  create: (data: CreateClientRequest) =>
    api.post<ClientDto>('/clients', data),

  getById: (id: string) =>
    api.get<ClientDto>(`/clients/${id}`),
};
