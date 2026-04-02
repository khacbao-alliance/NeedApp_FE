'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
  /** Polling interval in ms */
  interval: number;
  /** Whether polling is active */
  enabled?: boolean;
  /** Reduce interval when tab is not visible (ms). 0 = stop polling. */
  backgroundInterval?: number;
}

/**
 * Generic polling hook. Calls `callback` every `interval` ms.
 * Automatically slows down / stops when tab is not visible.
 */
export function usePolling(
  callback: () => void | Promise<void>,
  options: UsePollingOptions
) {
  const { interval, enabled = true, backgroundInterval = 0 } = options;
  const savedCallback = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Always keep the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const startPolling = useCallback(
    (ms: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (ms <= 0) return;
      timerRef.current = setInterval(() => {
        savedCallback.current();
      }, ms);
    },
    []
  );

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }

    startPolling(interval);

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
        if (backgroundInterval > 0) {
          startPolling(backgroundInterval);
        }
      } else {
        // Re-fetch immediately on tab focus
        savedCallback.current();
        startPolling(interval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [interval, enabled, backgroundInterval, startPolling, stopPolling]);

  return { stopPolling };
}
