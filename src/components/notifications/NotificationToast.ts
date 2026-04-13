'use client';

import { useEffect, useRef, useState, createElement } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/hooks/useNotifications';
import { getNotificationContent } from '@/lib/notificationUtils';
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

// Type-specific accent colors (matching the app's design palette)
const typeConfig: Record<NotificationType, { icon: string; color: string; bg: string }> = {
  NewMessage:   { icon: '💬', color: 'var(--accent-violet)',  bg: 'rgba(139, 92, 246, 0.12)' },
  MissingInfo:  { icon: '⚠️', color: 'var(--status-missing)', bg: 'rgba(239, 68, 68, 0.12)' },
  StatusChange: { icon: '🔄', color: 'var(--accent-cyan)',    bg: 'rgba(6, 182, 212, 0.12)' },
  Assignment:   { icon: '👤', color: 'var(--accent-indigo)',  bg: 'rgba(99, 102, 241, 0.12)' },
  NewRequest:   { icon: '📋', color: 'var(--status-pending)', bg: 'rgba(59, 130, 246, 0.12)' },
  Invitation:   { icon: '✉️', color: 'var(--status-intake)',  bg: 'rgba(245, 158, 11, 0.12)' },
};

interface Toast {
  id: string;
  notification: NotificationDto;
  exiting?: boolean;
  progress: number; // 0 → 100 for auto-dismiss progress bar
}

// Get the navigation path for a notification
function getNotificationHref(notification: NotificationDto): string | null {
  if (notification.referenceId && notification.referenceType === 'Request') {
    return `/requests/${notification.referenceId}`;
  }
  return null;
}

export function NotificationToast({ children }: { children: ReactNode }) {
  const { latestRealTimeNotification, activeRequestId, markAsRead } = useNotifications();
  const router = useRouter();
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const processedRef = useRef<Set<string>>(new Set());

  // Only react to REAL-TIME notifications (from SignalR), not initial API fetch
  useEffect(() => {
    if (!latestRealTimeNotification) return;

    const id = latestRealTimeNotification.id;

    // Prevent duplicate processing
    if (processedRef.current.has(id)) return;
    processedRef.current.add(id);

    // Check if user is currently viewing this request's chat
    const isViewingThisChat =
      activeRequestId &&
      latestRealTimeNotification.type === 'NewMessage' &&
      latestRealTimeNotification.referenceId === activeRequestId;

    // Always play sound for new notifications
    playNotificationSound();

    // Skip visual toast if user is already in this chat
    // Also auto-mark as read so unread count stays accurate
    if (isViewingThisChat) {
      markAsRead(id);
      return;
    }

    // Add toast with progress tracking
    setToasts(prev => {
      const next = [{ id, notification: latestRealTimeNotification, progress: 0 }, ...prev];
      return next.slice(0, MAX_VISIBLE_TOASTS);
    });

    // Progress bar animation (update every 50ms)
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / TOAST_DURATION) * 100, 100);
      setToasts(prev => prev.map(t => t.id === id ? { ...t, progress } : t));
      if (progress >= 100) clearInterval(progressInterval);
    }, 50);

    // Auto-dismiss after duration
    setTimeout(() => {
      clearInterval(progressInterval);
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, TOAST_DURATION);

    return () => clearInterval(progressInterval);
  }, [latestRealTimeNotification, activeRequestId, markAsRead]);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  };

  const handleToastClick = (toast: Toast) => {
    const href = getNotificationHref(toast.notification);
    markAsRead(toast.id);
    dismissToast(toast.id);
    if (href) {
      router.push(href);
    }
  };

  return createElement(
    'div',
    { className: 'relative' },
    children,
    toasts.length > 0 &&
      createElement(
        'div',
        {
          className: 'fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none',
          style: { maxWidth: '340px', width: '100%' },
          'aria-live': 'polite',
        },
        toasts.map((toast, index) => {
          const config = typeConfig[toast.notification.type] || typeConfig.NewMessage;
          const href = getNotificationHref(toast.notification);

          return createElement(
            'div',
            {
              key: toast.id,
              className: [
                'pointer-events-auto relative overflow-hidden',
                'rounded-xl',
                toast.exiting ? 'animate-slide-out-right' : 'animate-slide-in-right',
                href ? 'cursor-pointer' : 'cursor-default',
              ].join(' '),
              style: {
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid var(--glass-border)',
                boxShadow: `0 8px 32px -4px rgba(0,0,0,0.3), 0 0 0 1px rgba(139,92,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04)`,
                animationDelay: `${index * 60}ms`,
              },
              onClick: () => handleToastClick(toast),
            },

            // Accent top border (gradient line)
            createElement('div', {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: `linear-gradient(90deg, ${config.color}, var(--accent-cyan))`,
                opacity: 0.8,
              },
            }),

            // Main content area
            createElement(
              'div',
              { className: 'flex items-start gap-2.5 px-3 py-2.5' },

              // Icon with colored background
              createElement(
                'div',
                {
                  className: 'flex-shrink-0 flex items-center justify-center rounded-lg',
                  style: {
                    width: '32px',
                    height: '32px',
                    background: config.bg,
                    fontSize: '14px',
                  },
                },
                config.icon
              ),

              // Title + content
              createElement(
                'div',
                { className: 'min-w-0 flex-1' },
                createElement(
                  'p',
                  {
                    className: 'text-xs font-semibold truncate',
                    style: { color: 'var(--foreground)' },
                  },
                  t(`notifications.typeTitle.${toast.notification.type}`, toast.notification.title ?? '')
                ),
                (() => {
                  const content = getNotificationContent(toast.notification, t);
                  return content
                    ? createElement(
                        'p',
                        {
                          className: 'mt-0.5 text-[11px] line-clamp-1',
                          style: { color: 'var(--text-muted)' },
                        },
                        content
                      )
                    : null;
                })()
              ),

              // Close button
              createElement(
                'button',
                {
                  className: 'flex-shrink-0 rounded p-0.5 text-xs transition-all duration-150',
                  style: { color: 'var(--text-muted)' },
                  onMouseEnter: (e: { currentTarget: HTMLElement }) => {
                    e.currentTarget.style.color = 'var(--foreground)';
                    e.currentTarget.style.background = 'var(--surface-hover)';
                  },
                  onMouseLeave: (e: { currentTarget: HTMLElement }) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'transparent';
                  },
                  onClick: (e: { stopPropagation: () => void }) => {
                    e.stopPropagation();
                    dismissToast(toast.id);
                  },
                },
                '✕'
              )
            ),

            // Progress bar (auto-dismiss countdown)
            createElement('div', {
              style: {
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '2px',
                width: `${100 - toast.progress}%`,
                background: `linear-gradient(90deg, ${config.color}, var(--accent-cyan))`,
                transition: 'width 80ms linear',
                opacity: 0.5,
                borderRadius: '0 1px 0 0',
              },
            })
          );
        })
      )
  );
}
