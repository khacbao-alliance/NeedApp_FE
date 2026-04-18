import { api } from './requests';
import type { SlaConfigDto } from '@/types';

export interface UpdateSlaConfigsRequest {
  configs: {
    priority: string;
    deadlineHours: number;
    description?: string;
  }[];
}

export const slaConfigService = {
  getAll: () => api.get<SlaConfigDto[]>('/sla-config'),
  update: (data: UpdateSlaConfigsRequest) => api.put<SlaConfigDto[]>('/sla-config', data),
};
