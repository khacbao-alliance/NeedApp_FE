'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { PriorityBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate } from '@/lib/utils';
import type { RequestDto } from '@/types';
import {
  FireIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  HandRaisedIcon,
} from '@heroicons/react/24/outline';

interface KanbanCardProps {
  request: RequestDto;
  onSelfAssign?: (id: string) => Promise<void>;
  isStaff?: boolean;
  isMoving?: boolean;
}

export function KanbanCard({ request, onSelfAssign, isStaff, isMoving }: KanbanCardProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [assigning, setAssigning] = useState(false);
  const isDissolved = !request.isClientActive;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: request.id,
    data: { type: 'card', request },
    disabled: isMoving || isDissolved, // Prevent dragging while in-flight OR dissolved
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group rounded-xl border bg-[var(--surface-1)] p-3 transition-all ${
        isDissolved
          ? 'cursor-default opacity-70 border-red-500/20 bg-red-500/5'
          : isMoving
          ? 'cursor-wait opacity-60 border-[var(--accent-primary)]/30'
          : isDragging
          ? 'cursor-grabbing opacity-50 shadow-2xl border-[var(--accent-primary)]/50 scale-[1.02] z-50'
          : 'cursor-grab active:cursor-grabbing border-[var(--border)] hover:border-[var(--glass-border)] hover:shadow-md'
      }`}
    >
      {/* Moving indicator */}
      {isMoving && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[var(--surface-1)]/60 backdrop-blur-[1px] z-10">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
        </div>
      )}
      {/* Title — clickable to navigate */}
      <Link
        href={`/requests/${request.id}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="block text-sm font-medium text-[var(--foreground)] line-clamp-2 hover:text-[var(--accent-primary)] transition-colors leading-snug"
      >
        {request.title}
      </Link>

      {/* Meta row: priority + deadline + msg count | created time */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <PriorityBadge priority={request.priority} />
          <DeadlineIndicator dueDate={request.dueDate} isOverdue={request.isOverdue} />
          {request.messageCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
              <ChatBubbleLeftRightIcon className="h-3 w-3" />
              {request.messageCount}
            </span>
          )}
        </div>
        {/* createdAt — hover to see exact datetime, helps verify sort order */}
        <span
          className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)] flex-shrink-0"
          title={new Date(request.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN')}
        >
          <ClockIcon className="h-3 w-3" />
          {formatDate(request.createdAt, language)}
        </span>
      </div>

      {/* Bottom: client + assignee */}
      <div className="mt-2 flex items-center justify-between gap-2">
        {request.client ? (
          <span className={`flex items-center gap-1 text-[10px] truncate max-w-[120px] ${
            isDissolved ? 'text-red-400' : 'text-[var(--text-muted)]'
          }`}>
            {isDissolved && (
              <span className="inline-flex items-center rounded-full bg-red-500/15 border border-red-500/25 px-1 py-0.5 text-[9px] font-semibold text-red-400 flex-shrink-0 mr-0.5">
                {t('requests.list.clientDissolved', 'Giải thể')}
              </span>
            )}
            {request.client.name}
          </span>
        ) : (
          <span />
        )}
        {request.assignedUser ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Avatar
              src={request.assignedUser.avatarUrl ?? undefined}
              name={request.assignedUser.name || '?'}
              size="xs"
            />
          </div>
        ) : isStaff && onSelfAssign && !isDissolved ? (
          <button
            onClick={async (e) => {
              e.stopPropagation();
              setAssigning(true);
              try { await onSelfAssign(request.id); } finally { setAssigning(false); }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            disabled={assigning}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-primary)]/10 px-2 py-1 text-[10px] font-semibold text-[var(--accent-primary)] transition-all hover:bg-[var(--accent-primary)]/20 disabled:opacity-50"
          >
            <HandRaisedIcon className="h-3 w-3" />
            {assigning ? '...' : t('requests.list.selfAssign', 'Nhận')}
          </button>
        ) : (
          <span className="text-[10px] text-amber-400/80 font-medium italic">
            {t('requests.list.notAssigned', 'Chưa assign')}
          </span>
        )}
      </div>
    </div>
  );
}

function DeadlineIndicator({ dueDate, isOverdue }: { dueDate: string | null; isOverdue: boolean }) {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const now = new Date();
  const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/15 border border-red-500/25 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
        <FireIcon className="h-2.5 w-2.5" />
      </span>
    );
  }

  if (hoursLeft > 0 && hoursLeft < 24) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
        <ClockIcon className="h-2.5 w-2.5" />
        {hoursLeft < 1 ? `${Math.max(1, Math.round(hoursLeft * 60))}m` : `${Math.round(hoursLeft)}h`}
      </span>
    );
  }

  return null;
}
