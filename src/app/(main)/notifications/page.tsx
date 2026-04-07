'use client';

import { useRouter } from 'next/navigation';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

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
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Thông báo</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {unreadCount} thông báo chưa đọc
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--accent-indigo)] hover:bg-[var(--accent-indigo)]/10 transition-colors"
          >
            <CheckIcon className="h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]">
        {notifications.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-2xl bg-[var(--surface-2)] p-4">
              <BellIcon className="h-10 w-10 text-[var(--text-muted)]" />
            </div>
            <h3 className="text-base font-medium text-[var(--foreground)]">Chưa có thông báo</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Bạn sẽ nhận thông báo khi có hoạt động mới
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--border)]">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleClick(notification)}
                />
              ))}
            </div>

            {/* Load more */}
            {notifications.length >= 20 && (
              <div className="border-t border-[var(--border)] p-3 text-center">
                <button
                  onClick={fetchMore}
                  disabled={isLoading}
                  className="text-sm font-medium text-[var(--accent-indigo)] hover:underline disabled:opacity-50"
                >
                  {isLoading ? 'Đang tải...' : 'Tải thêm'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
