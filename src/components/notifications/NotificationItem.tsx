'use client';

import { useTranslation } from 'react-i18next';
import {
  ChatBubbleLeftEllipsisIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UserPlusIcon,
  DocumentPlusIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { NotificationDto, NotificationType } from '@/types';

interface NotificationItemProps {
  notification: NotificationDto;
  onClick?: () => void;
  compact?: boolean;
}

const typeConfig: Record<NotificationType, { icon: typeof ChatBubbleLeftEllipsisIcon; color: string }> = {
  NewMessage: { icon: ChatBubbleLeftEllipsisIcon, color: 'text-blue-400 bg-blue-500/10' },
  MissingInfo: { icon: ExclamationTriangleIcon, color: 'text-amber-400 bg-amber-500/10' },
  StatusChange: { icon: ArrowPathIcon, color: 'text-emerald-400 bg-emerald-500/10' },
  Assignment: { icon: UserPlusIcon, color: 'text-purple-400 bg-purple-500/10' },
  NewRequest: { icon: DocumentPlusIcon, color: 'text-indigo-400 bg-indigo-500/10' },
  Invitation: { icon: EnvelopeIcon, color: 'text-pink-400 bg-pink-500/10' },
};

export function NotificationItem({ notification, onClick, compact }: NotificationItemProps) {
  const { t, i18n } = useTranslation();
  const config = typeConfig[notification.type] || typeConfig.NewMessage;
  const Icon = config.icon;

  function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return t('time.justNow');
    if (seconds < 3600) return t('time.minutesAgo', { count: Math.floor(seconds / 60) });
    if (seconds < 86400) return t('time.hoursAgo', { count: Math.floor(seconds / 3600) });
    if (seconds < 604800) return t('time.daysAgo', { count: Math.floor(seconds / 86400) });
    return date.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US');
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150',
        'hover:bg-[var(--surface-hover)]',
        !notification.isRead && 'bg-[var(--accent-indigo)]/[0.03]',
        compact && 'py-2.5'
      )}
    >
      {/* Icon */}
      <div className={cn('mt-0.5 flex-shrink-0 rounded-xl p-2', config.color)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={cn(
          'text-sm leading-snug',
          notification.isRead ? 'text-[var(--text-secondary)]' : 'text-[var(--foreground)] font-medium'
        )}>
          {notification.title}
        </p>
        {notification.content && (
          <p className="mt-0.5 text-xs text-[var(--text-muted)] line-clamp-2">
            {notification.content}
          </p>
        )}
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--accent-violet)]" />
      )}
    </button>
  );
}
