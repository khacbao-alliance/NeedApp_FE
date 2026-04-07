'use client';

import { useEffect, useRef, useState, createElement } from 'react';
import type { ReactNode } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationDto, NotificationType } from '@/types';

const MAX_VISIBLE_TOASTS = 3;
const TOAST_DURATION = 5000;

// ── Notification sound using Web Audio API ──
function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);

    setTimeout(() => ctx.close(), 500);
  } catch {
    // Audio not available
  }
}

const typeEmoji: Record<NotificationType, string> = {
  NewMessage: '💬',
  MissingInfo: '⚠️',
  StatusChange: '🔄',
  Assignment: '👤',
  NewRequest: '📋',
  Invitation: '✉️',
};

interface Toast {
  id: string;
  notification: NotificationDto;
  exiting?: boolean;
}

export function NotificationToast({ children }: { children: ReactNode }) {
  const { latestRealTimeNotification } = useNotifications();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const processedRef = useRef<Set<string>>(new Set());

  // Only react to REAL-TIME notifications (from SignalR), not initial API fetch
  useEffect(() => {
    if (!latestRealTimeNotification) return;

    const id = latestRealTimeNotification.id;

    // Prevent duplicate processing
    if (processedRef.current.has(id)) return;
    processedRef.current.add(id);

    // Play sound
    playNotificationSound();

    // Add toast (limit visible count)
    setToasts(prev => {
      const next = [{ id, notification: latestRealTimeNotification }, ...prev];
      return next.slice(0, MAX_VISIBLE_TOASTS);
    });

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, TOAST_DURATION);
  }, [latestRealTimeNotification]);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  };

  return createElement(
    'div',
    { className: 'relative' },
    children,
    toasts.length > 0 &&
      createElement(
        'div',
        {
          className: 'fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none',
          style: { maxWidth: '380px', width: '100%' },
          'aria-live': 'polite',
        },
        toasts.map(toast =>
          createElement(
            'div',
            {
              key: toast.id,
              className: [
                'pointer-events-auto flex items-start gap-3 rounded-2xl border border-[var(--border)]',
                'bg-[var(--surface-1)]/95 backdrop-blur-xl p-4 shadow-2xl shadow-black/20',
                toast.exiting ? 'animate-slide-out-right' : 'animate-slide-in-right',
                'cursor-pointer hover:bg-[var(--surface-hover)] transition-colors',
              ].join(' '),
              onClick: () => dismissToast(toast.id),
            },
            createElement(
              'span',
              { className: 'text-lg flex-shrink-0 mt-0.5' },
              typeEmoji[toast.notification.type] || '🔔'
            ),
            createElement(
              'div',
              { className: 'min-w-0 flex-1' },
              createElement(
                'p',
                { className: 'text-sm font-semibold text-[var(--foreground)] truncate' },
                toast.notification.title
              ),
              toast.notification.content &&
                createElement(
                  'p',
                  { className: 'mt-0.5 text-xs text-[var(--text-muted)] line-clamp-2' },
                  toast.notification.content
                )
            ),
            createElement(
              'button',
              {
                className: 'flex-shrink-0 rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors',
                onClick: (e: { stopPropagation: () => void }) => {
                  e.stopPropagation();
                  dismissToast(toast.id);
                },
              },
              '✕'
            )
          )
        )
      )
  );
}
