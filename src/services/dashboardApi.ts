import { api } from './requests';
import type { DashboardStatsDto } from '@/types';

export const dashboardService = {
  getStats: (days = 30) =>
    api.get<DashboardStatsDto>(`/dashboard/stats?days=${days}`),
};
