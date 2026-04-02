'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { RequestStatus, RequestPriority } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'status' | 'priority';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold',
        variant === 'default' && 'bg-[var(--surface-3)] text-[var(--text-secondary)]',
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  const { t } = useTranslation();
  const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
    Draft: { label: t('status.draft'), className: 'status-draft' },
    Intake: { label: t('status.intake'), className: 'status-intake' },
    Pending: { label: t('status.pending'), className: 'status-pending' },
    MissingInfo: { label: t('status.missingInfo'), className: 'status-missinginfo' },
    InProgress: { label: t('status.inProgress'), className: 'status-inprogress' },
    Done: { label: t('status.done'), className: 'status-done' },
    Cancelled: { label: t('status.cancelled'), className: 'status-cancelled' },
  };
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold',
        config.className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: RequestPriority }) {
  const { t } = useTranslation();
  const priorityConfig: Record<RequestPriority, { label: string; color: string }> = {
    Low: { label: t('priority.low'), color: 'bg-gray-500/15 text-gray-400' },
    Medium: { label: t('priority.medium'), color: 'bg-blue-500/15 text-blue-400' },
    High: { label: t('priority.high'), color: 'bg-amber-500/15 text-amber-400' },
    Urgent: { label: t('priority.urgent'), color: 'bg-red-500/15 text-red-400' },
  };
  const config = priorityConfig[priority];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold',
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
