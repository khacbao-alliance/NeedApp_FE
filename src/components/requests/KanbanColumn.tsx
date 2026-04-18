'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import { KanbanCard } from './KanbanCard';
import type { RequestDto, RequestStatus } from '@/types';

export interface ColumnConfig {
  status: RequestStatus;
  labelKey: string;
  color: string;      // accent color class
  bgColor: string;     // background color
}

interface KanbanColumnProps {
  config: ColumnConfig;
  requests: RequestDto[];
  isOver?: boolean;
  onSelfAssign?: (id: string) => Promise<void>;
  isStaff?: boolean;
}

export function KanbanColumn({ config, requests, isOver, onSelfAssign, isStaff }: KanbanColumnProps) {
  const { t } = useTranslation();
  const { setNodeRef } = useDroppable({
    id: config.status,
    data: { type: 'column', status: config.status },
  });

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-[var(--surface-2)]/50 min-w-[280px] w-[280px] flex-shrink-0 transition-all ${
        isOver
          ? 'border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/5 shadow-lg'
          : 'border-[var(--border)]'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${config.bgColor}`} />
        <h3 className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>
          {t(config.labelKey)}
        </h3>
        <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--surface-3)] px-1.5 text-[10px] font-bold text-[var(--text-muted)]">
          {requests.length}
        </span>
      </div>

      {/* Droppable Card Area */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-280px)]"
      >
        <SortableContext items={requests.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          {requests.length === 0 ? (
            <div className={`flex items-center justify-center rounded-xl border-2 border-dashed py-8 text-xs transition-colors ${
              isOver
                ? 'border-[var(--accent-primary)]/40 text-[var(--accent-primary)]'
                : 'border-[var(--border)] text-[var(--text-muted)]'
            }`}>
              {isOver
                ? t('kanban.dropHere', 'Thả vào đây')
                : t('kanban.emptyColumn', 'Chưa có yêu cầu')}
            </div>
          ) : (
            requests.map((request) => (
              <KanbanCard key={request.id} request={request} onSelfAssign={onSelfAssign} isStaff={isStaff} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
