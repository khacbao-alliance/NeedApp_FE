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

// SVG icon paths (24x24 heroicons outline) used in notification toasts
const svgIcon = (path: string) => `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="${path}" /></svg>`;

const ICON_PATHS = {
  chat: 'M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z',
  warning: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
  refresh: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182',
  user: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
  clipboard: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z',
  envelope: 'M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75',
};

// Type-specific accent colors (matching the app's design palette)
const typeConfig: Record<NotificationType, { icon: string; color: string; bg: string }> = {
  NewMessage:   { icon: svgIcon(ICON_PATHS.chat),      color: 'var(--accent-primary)',  bg: 'rgba(59, 130, 246, 0.12)' },
  MissingInfo:  { icon: svgIcon(ICON_PATHS.warning),   color: 'var(--status-missing)', bg: 'rgba(239, 68, 68, 0.12)' },
  StatusChange: { icon: svgIcon(ICON_PATHS.refresh),   color: 'var(--accent-primary)',  bg: 'rgba(59, 130, 246, 0.12)' },
  Assignment:   { icon: svgIcon(ICON_PATHS.user),      color: 'var(--accent-primary)',  bg: 'rgba(59, 130, 246, 0.12)' },
  NewRequest:   { icon: svgIcon(ICON_PATHS.clipboard), color: 'var(--status-pending)', bg: 'rgba(59, 130, 246, 0.12)' },
  Invitation:   { icon: svgIcon(ICON_PATHS.envelope),  color: 'var(--status-intake)',  bg: 'rgba(245, 158, 11, 0.12)' },
  IntakeAnswerEdited: { icon: svgIcon(ICON_PATHS.clipboard), color: 'var(--status-intake)', bg: 'rgba(245, 158, 11, 0.12)' },
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
                background: config.color,
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
                    color: config.color,
                  },
                  dangerouslySetInnerHTML: { __html: config.icon },
                }
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
                background: config.color,
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
