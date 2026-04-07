import { useState, useCallback } from 'react';
import { messageService } from '@/services/messages';
import type { ConversationSummaryDto } from '@/types';

export function useConversationSummary(requestId: string) {
  const [summary, setSummary] = useState<ConversationSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await messageService.getSummary(requestId);
      setSummary(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load summary';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  return { summary, isLoading, error, fetchSummary };
}
