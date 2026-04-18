'use client';

import { useState, useMemo } from 'react';
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
import type { RequestDto, RequestStatus } from '@/types';

const COLUMNS: ColumnConfig[] = [
  { status: 'Intake',      labelKey: 'status.intake',      color: 'text-sky-400',     bgColor: 'bg-sky-400' },
  { status: 'Pending',     labelKey: 'status.pending',     color: 'text-amber-400',   bgColor: 'bg-amber-400' },
  { status: 'MissingInfo', labelKey: 'status.missingInfo', color: 'text-orange-400',  bgColor: 'bg-orange-400' },
  { status: 'InProgress',  labelKey: 'status.inProgress',  color: 'text-violet-400',  bgColor: 'bg-violet-400' },
  { status: 'Done',        labelKey: 'status.done',        color: 'text-emerald-400', bgColor: 'bg-emerald-400' },
];

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
  const [optimisticMoves, setOptimisticMoves] = useState<Record<string, RequestStatus>>({});

  // Quick filters
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterMine, setFilterMine] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Apply quick filters + optimistic moves
  const filteredRequests = useMemo(() => {
    let items = requests;
    if (filterPriority) {
      items = items.filter((r) => r.priority === filterPriority);
    }
    if (filterMine && currentUserId) {
      items = items.filter((r) => r.assignedUser?.id === currentUserId);
    }
    return items;
  }, [requests, filterPriority, filterMine, currentUserId]);

  // Group by column, using optimistic status if available
  const columns = useMemo(() => {
    const grouped: Record<string, RequestDto[]> = {};
    for (const col of COLUMNS) {
      grouped[col.status] = [];
    }
    for (const req of filteredRequests) {
      const effectiveStatus = optimisticMoves[req.id] || req.status;
      if (grouped[effectiveStatus]) {
        grouped[effectiveStatus].push({ ...req, status: effectiveStatus });
      }
    }
    return grouped;
  }, [filteredRequests, optimisticMoves]);

  const activeRequest = activeId
    ? requests.find((r) => r.id === activeId) || null
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as string | undefined;
    if (!overId) {
      setOverColumnId(null);
      return;
    }
    // Check if hovering over a column directly
    if (COLUMNS.some((c) => c.status === overId)) {
      setOverColumnId(overId);
    } else {
      // Hovering over a card — find which column it belongs to
      const overReq = requests.find((r) => r.id === overId);
      if (overReq) {
        const effectiveStatus = optimisticMoves[overReq.id] || overReq.status;
        setOverColumnId(effectiveStatus);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumnId(null);

    if (!over) return;

    const requestId = active.id as string;
    let targetStatus: RequestStatus | null = null;

    // Dropped on a column
    if (COLUMNS.some((c) => c.status === over.id)) {
      targetStatus = over.id as RequestStatus;
    } else {
      // Dropped on a card — find column
      const overReq = requests.find((r) => r.id === over.id);
      if (overReq) {
        targetStatus = optimisticMoves[overReq.id] || overReq.status;
      }
    }

    if (!targetStatus) return;

    const draggedReq = requests.find((r) => r.id === requestId);
    if (!draggedReq) return;

    const currentStatus = optimisticMoves[requestId] || draggedReq.status;
    if (currentStatus === targetStatus) return;

    // Optimistic update
    setOptimisticMoves((prev) => ({ ...prev, [requestId]: targetStatus! }));

    try {
      await onStatusChange(requestId, targetStatus);
      // On success, remove from optimistic (real data will refresh)
      setOptimisticMoves((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
    } catch {
      // Revert optimistic
      setOptimisticMoves((prev) => {
        const next = { ...prev };
        delete next[requestId];
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

        {currentUserId && (
          <button
            onClick={() => setFilterMine(!filterMine)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              filterMine
                ? 'border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--foreground)]'
            }`}
            id="kanban-filter-mine"
          >
            {t('kanban.myRequests', 'Của tôi')}
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
