import { api } from './requests';
import type {
  MessageDto,
  MessageListResponse,
  MessageEditHistoryDto,
  SendMessageRequest,
  SendMissingInfoRequest,
  ConversationSummaryDto,
} from '@/types';

export const messageService = {
  list: (requestId: string, cursor?: string, limit = 20) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return api.get<MessageListResponse>(
      `/requests/${requestId}/messages?${params.toString()}`
    );
  },

  send: (requestId: string, data: SendMessageRequest) =>
    api.post<MessageDto>(`/requests/${requestId}/messages`, data),

  sendMissingInfo: (requestId: string, data: SendMissingInfoRequest) =>
    api.post<MessageDto>(
      `/requests/${requestId}/messages/missing-info`,
      data
    ),

  delete: (requestId: string, messageId: string) =>
    api.delete<void>(`/requests/${requestId}/messages/${messageId}`),

  getSummary: (requestId: string) =>
    api.get<ConversationSummaryDto>(`/requests/${requestId}/messages/summary`),

  toggleReaction: (requestId: string, messageId: string, emoji: string) =>
    api.post<{ added: boolean; emoji: string; count: number }>(
      `/requests/${requestId}/messages/${messageId}/reactions`,
      { emoji }
    ),

  markRead: (requestId: string) =>
    api.post<void>(`/requests/${requestId}/messages/read`, {}),

  editMessage: (requestId: string, messageId: string, content: string) =>
    api.put<MessageDto>(`/requests/${requestId}/messages/${messageId}`, { content }),

  pinMessage: (requestId: string, messageId: string) =>
    api.post<MessageDto>(`/requests/${requestId}/messages/${messageId}/pin`, {}),

  getEditHistory: (requestId: string, messageId: string) =>
    api.get<MessageEditHistoryDto[]>(
      `/requests/${requestId}/messages/${messageId}/history`
    ),

  answerMissingInfo: (requestId: string, messageId: string, questionId: string, answer: string) =>
    api.post<MessageDto>(
      `/requests/${requestId}/messages/${messageId}/answer-missing-info`,
      { questionId, answer }
    ),
};
