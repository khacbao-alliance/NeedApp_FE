import { api } from './requests';
import type { IntakeQuestionSetDto, CreateIntakeQuestionSetRequest, UpdateIntakeQuestionSetRequest } from '@/types';

export const intakeQuestionService = {
  list: () =>
    api.get<IntakeQuestionSetDto[]>('/intake-question-sets'),

  getById: (id: string) =>
    api.get<IntakeQuestionSetDto>(`/intake-question-sets/${id}`),

  create: (data: CreateIntakeQuestionSetRequest) =>
    api.post<IntakeQuestionSetDto>('/intake-question-sets', data),

  update: (id: string, data: UpdateIntakeQuestionSetRequest) =>
    api.put<IntakeQuestionSetDto>(`/intake-question-sets/${id}`, data),

  toggleActive: (id: string) =>
    api.patch<{ id: string; isActive: boolean }>(`/intake-question-sets/${id}/toggle-active`, {}),

  delete: (id: string) =>
    api.delete<void>(`/intake-question-sets/${id}`),
};
