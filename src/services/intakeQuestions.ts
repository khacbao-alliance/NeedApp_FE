import { api } from './requests';
import type { IntakeQuestionSetDto, CreateIntakeQuestionSetRequest } from '@/types';

export const intakeQuestionService = {
  list: () =>
    api.get<IntakeQuestionSetDto[]>('/intake-question-sets'),

  getById: (id: string) =>
    api.get<IntakeQuestionSetDto>(`/intake-question-sets/${id}`),

  create: (data: CreateIntakeQuestionSetRequest) =>
    api.post<IntakeQuestionSetDto>('/intake-question-sets', data),

  update: (id: string, data: Partial<CreateIntakeQuestionSetRequest>) =>
    api.put<IntakeQuestionSetDto>(`/intake-question-sets/${id}`, data),

  delete: (id: string) =>
    api.delete<void>(`/intake-question-sets/${id}`),
};
