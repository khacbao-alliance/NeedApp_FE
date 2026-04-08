'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    setOpen(false);

    // Navigate based on reference type
    if (notification.referenceType === 'Request' && notification.referenceId) {
      router.push(`/requests/${notification.referenceId}`);
    } else if (notification.referenceType === 'Invitation') {
      router.push('/setup-client');
    }
  };

  const recentNotifications = notifications.slice(0, 8);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'relative rounded-xl p-2 transition-all duration-200',
          open
            ? 'bg-[var(--accent-indigo)]/10 text-[var(--accent-violet)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
        )}
        aria-label={t('notifications.title')}
        id="notification-bell"
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="h-5 w-5 animate-bell-ring" />
        ) : (
          <BellIcon className="h-5 w-5" />
        )}

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-indigo)] px-1 text-[10px] font-bold text-white shadow-lg shadow-[var(--accent-violet)]/30">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] shadow-2xl shadow-black/30 animate-fade-in z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              {t('notifications.title')}
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-[var(--accent-violet)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent-violet)]">
                  {t('notifications.newBadge', { count: unreadCount })}
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[var(--accent-indigo)] hover:bg-[var(--accent-indigo)]/10 transition-colors"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                {t('notifications.markAllDone')}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto overscroll-contain">
            {recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BellIcon className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-muted)]">{t('notifications.empty')}</p>
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-[var(--border)] px-4 py-2.5">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push('/notifications');
                }}
                className="w-full rounded-lg py-1.5 text-center text-xs font-medium text-[var(--accent-indigo)] hover:bg-[var(--accent-indigo)]/5 transition-colors"
              >
                {t('notifications.viewAll')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
