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

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
  Draft: { label: 'Nháp', className: 'status-draft' },
  Intake: { label: 'Tiếp nhận', className: 'status-intake' },
  Pending: { label: 'Chờ xử lý', className: 'status-pending' },
  MissingInfo: { label: 'Thiếu thông tin', className: 'status-missinginfo' },
  InProgress: { label: 'Đang xử lý', className: 'status-inprogress' },
  Done: { label: 'Hoàn thành', className: 'status-done' },
  Cancelled: { label: 'Đã hủy', className: 'status-cancelled' },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
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

const priorityConfig: Record<RequestPriority, { label: string; color: string }> = {
  Low: { label: 'Thấp', color: 'bg-gray-500/15 text-gray-400' },
  Medium: { label: 'Trung bình', color: 'bg-blue-500/15 text-blue-400' },
  High: { label: 'Cao', color: 'bg-amber-500/15 text-amber-400' },
  Urgent: { label: 'Khẩn cấp', color: 'bg-red-500/15 text-red-400' },
};

export function PriorityBadge({ priority }: { priority: RequestPriority }) {
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
