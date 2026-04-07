import { useState, useCallback, useEffect } from 'react';
import { clientService } from '@/services/clients';
import type { ClientMemberDto, ClientRole } from '@/types';

export function useClientMembers(clientId: string) {
  const [members, setMembers] = useState<ClientMemberDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await clientService.getMembers(clientId);
      setMembers(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load members');
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) fetchMembers();
  }, [fetchMembers, clientId]);

  const invite = async (email: string, role: ClientRole = 'Member') => {
    const newMember = await clientService.inviteMember(clientId, { email, role });
    setMembers((prev) => [...prev, newMember]);
    return newMember;
  };

  const remove = async (userId: string) => {
    await clientService.removeMember(clientId, userId);
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  return { members, isLoading, error, refetch: fetchMembers, invite, remove };
}
