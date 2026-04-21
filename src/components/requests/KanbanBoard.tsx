'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { KanbanColumn, type ColumnConfig } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { showErrorToast } from '@/components/ui/ErrorToast';
import type { RequestDto, RequestStatus } from '@/types';

const COLUMNS: ColumnConfig[] = [
  { status: 'Intake',      labelKey: 'status.intake',      color: 'text-sky-400',     bgColor: 'bg-sky-400' },
  { status: 'Pending',     labelKey: 'status.pending',     color: 'text-amber-400',   bgColor: 'bg-amber-400' },
  { status: 'MissingInfo', labelKey: 'status.missingInfo', color: 'text-orange-400',  bgColor: 'bg-orange-400' },
  { status: 'InProgress',  labelKey: 'status.inProgress',  color: 'text-violet-400',  bgColor: 'bg-violet-400' },
  { status: 'Done',        labelKey: 'status.done',        color: 'text-emerald-400', bgColor: 'bg-emerald-400' },
];

// Mirror backend ValidTransitions — used to block invalid drags before API call
const VALID_TRANSITIONS: Partial<Record<RequestStatus, RequestStatus[]>> = {
  Intake:      ['Pending'],                                                    // Staff can force-close intake
  Pending:     ['InProgress', 'Cancelled'],
  MissingInfo: ['InProgress', 'Pending', 'Cancelled'],
  InProgress:  ['Done', 'MissingInfo', 'Pending', 'Cancelled'],
  Done:        ['InProgress'],
};

function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  if (from === to) return false;
  if (from === 'Draft') return false; // Draft is never manually movable
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

interface KanbanBoardProps {
  requests: RequestDto[];
  onStatusChange: (requestId: string, newStatus: RequestStatus) => Promise<void>;
  onSelfAssign?: (id: string) => Promise<void>;
  currentUserId?: string;
  isStaff?: boolean;
}

export function KanbanBoard({ requests, onStatusChange, onSelfAssign, currentUserId, isStaff }: KanbanBoardProps) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  // optimisticMoves: requestId → target status while API is in-flight
  const [optimisticMoves, setOptimisticMoves] = useState<Record<string, RequestStatus>>({});
  // Track which cards are currently being moved (disables drag on them)
  const [movingIds, setMovingIds] = useState<Set<string>>(new Set());

  // Quick local filter — priority + dissolved toggle
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [hideDissolved, setHideDissolved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Apply quick local filters
  const filteredRequests = useMemo(() => {
    let items = requests;
    if (filterPriority) {
      items = items.filter((r) => r.priority === filterPriority);
    }
    if (hideDissolved) {
      items = items.filter((r) => r.isClientActive);
    }
    return items;
  }, [requests, filterPriority, hideDissolved]);

  // Group by column — use optimisticMoves status when in-flight
  const columns = useMemo(() => {
    const grouped: Record<string, RequestDto[]> = {};
    for (const col of COLUMNS) {
      grouped[col.status] = [];
    }
    for (const req of filteredRequests) {
      const effectiveStatus = optimisticMoves[req.id] ?? req.status;
      if (grouped[effectiveStatus] !== undefined) {
        grouped[effectiveStatus].push({ ...req, status: effectiveStatus });
      }
    }
    return grouped;
  }, [filteredRequests, optimisticMoves]);

  const activeRequest = activeId
    ? (filteredRequests.find((r) => r.id === activeId) ?? null)
    : null;

  const getColumnForId = useCallback(
    (id: string): RequestStatus | null => {
      // Is it a column id?
      if (COLUMNS.some((c) => c.status === id)) return id as RequestStatus;
      // Is it a card id?
      const req = filteredRequests.find((r) => r.id === id);
      if (req) return optimisticMoves[req.id] ?? req.status;
      return null;
    },
    [filteredRequests, optimisticMoves]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as string | undefined;
    if (!overId) {
      setOverColumnId(null);
      return;
    }
    const col = getColumnForId(overId);
    setOverColumnId(col);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumnId(null);

    if (!over) return;

    const requestId = active.id as string;

    // Skip if already in-flight
    if (movingIds.has(requestId)) return;

    const draggedReq = filteredRequests.find((r) => r.id === requestId);
    if (!draggedReq) return;

    const currentStatus = optimisticMoves[requestId] ?? draggedReq.status;
    const targetStatus = getColumnForId(over.id as string);
    if (!targetStatus || currentStatus === targetStatus) return;

    // ── Validate transition on FE before hitting API ──
    if (!canTransition(currentStatus, targetStatus)) {
      const fromLabel = t(`status.${currentStatus.charAt(0).toLowerCase() + currentStatus.slice(1)}`, currentStatus);
      const toLabel   = t(`status.${targetStatus.charAt(0).toLowerCase() + targetStatus.slice(1)}`, targetStatus);
      showErrorToast(t('kanban.invalidTransition', `Không thể chuyển từ "${fromLabel}" sang "${toLabel}".`).replace('{from}', fromLabel).replace('{to}', toLabel));
      return;
    }

    // ── Optimistic update ──
    setOptimisticMoves((prev) => ({ ...prev, [requestId]: targetStatus }));
    setMovingIds((prev) => new Set(prev).add(requestId));

    try {
      // onStatusChange must await fetchRequests() before resolving
      await onStatusChange(requestId, targetStatus);
      // Success — remove optimistic (fresh data already loaded by the parent)
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      showErrorToast(msg || t('kanban.moveError', 'Không thể thay đổi trạng thái.'));
    } finally {
      // Always clean up — whether success or failure, fresh data determines card position
      setOptimisticMoves((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
      setMovingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick Filters Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] outline-none transition-all focus:border-[var(--accent-indigo)] cursor-pointer"
          id="kanban-filter-priority"
        >
          <option value="">{t('kanban.allPriorities', 'Tất cả ưu tiên')}</option>
          <option value="Urgent">{t('priority.urgent', 'Khẩn cấp')}</option>
          <option value="High">{t('priority.high', 'Cao')}</option>
          <option value="Medium">{t('priority.medium', 'Trung bình')}</option>
          <option value="Low">{t('priority.low', 'Thấp')}</option>
        </select>

        {/* Toggle: hide dissolved */}
        {requests.some((r) => !r.isClientActive) && (
          <button
            onClick={() => setHideDissolved(!hideDissolved)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
              hideDissolved
                ? 'bg-red-500/15 border-red-500/30 text-red-400'
                : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
            {hideDissolved
              ? t('kanban.showDissolved', 'Hiện giải thể')
              : t('kanban.hideDissolved', 'Ẩn giải thể')}
          </button>
        )}

        <span className="ml-auto text-[11px] text-[var(--text-muted)]">
          {filteredRequests.length} {t('kanban.total', 'yêu cầu')}
        </span>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              config={col}
              requests={columns[col.status] || []}
              isOver={overColumnId === col.status}
              onSelfAssign={onSelfAssign}
              isStaff={isStaff}
              movingIds={movingIds}
            />
          ))}
        </div>

        {/* Drag Overlay — floating card while dragging */}
        <DragOverlay>
          {activeRequest ? (
            <div className="opacity-90 rotate-2 shadow-2xl">
              <KanbanCard request={activeRequest} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
