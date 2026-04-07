import { api } from './requests';
import type { PendingInvitationDto, InvitationDto } from '@/types';

export const invitationService = {
  getPending: () =>
    api.get<PendingInvitationDto[]>('/invitations/pending'),

  respond: (id: string, accept: boolean) =>
    api.put<InvitationDto>(`/invitations/${id}/respond`, { accept }),
};
