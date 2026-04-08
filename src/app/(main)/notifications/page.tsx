'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filtered = showUnreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const handleClick = async (notification: typeof notifications[0]) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.referenceType === 'Request' && notification.referenceId) {
      router.push(`/requests/${notification.referenceId}`);
    } else if (notification.referenceType === 'Invitation') {
      router.push('/setup-client');
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('notifications.title')}</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {t('notifications.unread', { count: unreadCount })}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--accent-indigo)] hover:bg-[var(--accent-indigo)]/10 transition-colors"
          >
            <CheckIcon className="h-4 w-4" />
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-1 w-fit">
        <button
          onClick={() => setShowUnreadOnly(false)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            !showUnreadOnly
              ? 'bg-[var(--accent-violet)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          {t('notifications.filterAll', 'Tất cả')}
        </button>
        <button
          onClick={() => setShowUnreadOnly(true)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            showUnreadOnly
              ? 'bg-[var(--accent-violet)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          {t('notifications.filterUnread', 'Chưa đọc')}
          {unreadCount > 0 && (
            <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white/20 px-1 text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification List */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]">
        {filtered.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-2xl bg-[var(--surface-2)] p-4">
              <BellIcon className="h-10 w-10 text-[var(--text-muted)]" />
            </div>
            <h3 className="text-base font-medium text-[var(--foreground)]">
              {showUnreadOnly ? t('notifications.noUnread', 'Không có thông báo chưa đọc') : t('notifications.empty')}
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {showUnreadOnly ? t('notifications.noUnreadDesc', 'Bạn đã đọc hết thông báo') : t('notifications.emptyDesc')}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--border)]">
              {filtered.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleClick(notification)}
                />
              ))}
            </div>

            {/* Load more */}
            {notifications.length >= 20 && !showUnreadOnly && (
              <div className="border-t border-[var(--border)] p-3 text-center">
                <button
                  onClick={fetchMore}
                  disabled={isLoading}
                  className="text-sm font-medium text-[var(--accent-indigo)] hover:underline disabled:opacity-50"
                >
                  {isLoading ? t('common.loading') : t('notifications.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

