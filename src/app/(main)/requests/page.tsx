'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { requestService, type GetRequestsParams } from '@/services/requestsApi';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import type { RequestDto, RequestStatus, PaginatedResponse } from '@/types';
import { formatDate, getTimeUrgency } from '@/lib/utils';
import {
  PlusIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  HandRaisedIcon,
  ClockIcon,
  BarsArrowDownIcon,
} from '@heroicons/react/24/outline';

export default function RequestsPage() {
  const { role, user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();

  const statusFilters: { value: RequestStatus | 'all'; label: string }[] = [
    { value: 'all', label: t('requests.list.all') },
    { value: 'Intake', label: t('status.intake') },
    { value: 'Pending', label: t('status.pending') },
    { value: 'MissingInfo', label: t('status.missingInfo') },
    { value: 'InProgress', label: t('status.inProgress') },
    { value: 'Done', label: t('status.done') },
  ];
  const isClient = role === 'Client';
  const [data, setData] = useState<PaginatedResponse<RequestDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selfAssigning, setSelfAssigning] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const params: GetRequestsParams = {
        page,
        pageSize: 10,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      };
      const res = await requestService.list(params);
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchRequests();
  }, [fetchRequests]);

  const allRequests = data?.items ?? [];

  // Staff filter tabs
  type StaffTab = 'all' | 'mine' | 'unassigned';
  const [staffTab, setStaffTab] = useState<StaffTab>('all');
  type SortKey = 'newest' | 'oldest' | 'priority';
  const [sortKey, setSortKey] = useState<SortKey>('newest');

  const PRIORITY_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

  const requests = (() => {
    let filtered = role === 'Staff'
      ? allRequests.filter(req => {
          if (staffTab === 'mine') return req.assignedUser?.id === user?.id;
          if (staffTab === 'unassigned') return !req.assignedUser;
          return !req.assignedUser || req.assignedUser.id === user?.id;
        })
      : allRequests;
    if (sortKey === 'oldest') {
      filtered = [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortKey === 'priority') {
      filtered = [...filtered].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
    }
    // 'newest' is the default order from API
    return filtered;
  })();

  // #8 — Auto-refresh every 30s
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchRequests();
    }, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchRequests]);

  const handleSelfAssign = async (id: string) => {
    setSelfAssigning(id);
    try {
      await requestService.selfAssign(id);
      fetchRequests(); // Refresh list
    } catch {
      // ignore
    } finally {
      setSelfAssigning(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in min-h-[70vh]" id="requests-page">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('requests.list.title')}</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {isClient ? t('requests.list.subtitleClient') : t('requests.list.subtitleStaff')}
          </p>
        </div>
        {isClient && (
          <Link href="/requests/new" className="flex-shrink-0">
            <Button variant="gradient">
              <PlusIcon className="h-4 w-4" />
              {t('requests.list.createNew')}
            </Button>
          </Link>
        )}
      </div>

      {/* Staff scope tabs — separate row */}
      {role === 'Staff' && (
        <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-1 w-fit">
          {[
            { value: 'all' as StaffTab, label: t('requests.list.staffAll', 'Tất cả') },
            { value: 'mine' as StaffTab, label: t('requests.list.staffMine', 'Của tôi') },
            { value: 'unassigned' as StaffTab, label: t('requests.list.staffUnassigned', 'Chưa nhận') },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStaffTab(tab.value)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                staffTab === tab.value
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Search & Status Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={t('requests.list.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none transition-all focus:border-[var(--accent-indigo)] focus:ring-1 focus:ring-[var(--accent-indigo)]/50"
            id="search-requests"
          />
        </div>
        {/* Sort */}
        <div className="relative flex-shrink-0">
          <BarsArrowDownIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface-2)] py-1.5 pl-8 pr-6 text-xs font-medium text-[var(--text-secondary)] outline-none transition-all focus:border-[var(--accent-indigo)] cursor-pointer"
          >
            <option value="newest">{t('requests.list.sortNewest', 'Mới nhất')}</option>
            <option value="oldest">{t('requests.list.sortOldest', 'Cũ nhất')}</option>
            <option value="priority">{t('requests.list.sortPriority', 'Ưu tiên')}</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${statusFilter === f.value
                ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--foreground)]'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Urgency Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-[var(--text-muted)] select-none">
        <span className="font-medium text-[var(--text-secondary)]">{t('requests.list.legendTitle')}:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-red-500/70" />
          {t('requests.list.legendUrgent')}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-amber-500/70" />
          {t('requests.list.legendWarning')}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[var(--border)]" />
          {t('requests.list.legendNormal')}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl animate-shimmer" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="h-8 w-8" />}
          title={search || statusFilter !== 'all' ? t('requests.list.noResults') : t('requests.list.empty')}
          description={
            search || statusFilter !== 'all'
              ? t('requests.list.noResultsDesc')
              : t('requests.list.emptyDesc')
          }
          action={
            !search && statusFilter === 'all' && isClient ? (
              <Link href="/requests/new">
                <Button variant="gradient">
                  <PlusIcon className="h-4 w-4" />
                  {t('requests.list.createRequest')}
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req, i) => {
            const urgency = getTimeUrgency(req.createdAt, req.status);
            return (
            <Link
              key={req.id}
              href={`/requests/${req.id}`}
              className={`group flex items-center gap-3 rounded-xl border p-3 sm:p-4 transition-all duration-200 hover:bg-(--surface-hover) bg-(--surface-1) ${
                !req.isClientActive
                  ? 'border-(--border) hover:border-(--glass-border) opacity-75'
                  : urgency === 'urgent'
                  ? 'border-red-500/50 hover:border-red-500/70'
                  : urgency === 'warning'
                  ? 'border-amber-500/40 hover:border-amber-500/60'
                  : 'border-(--border) hover:border-(--glass-border)'
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Creator Avatar */}
              <div className="flex-shrink-0 hidden xs:block sm:block">
                <Avatar
                  src={req.createdByUser?.avatarUrl ?? undefined}
                  name={req.createdByUser?.name || req.client?.name || '?'}
                  size="sm"
                />
              </div>

              {/* Main Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent-primary)] transition-colors">
                    {req.title}
                  </h3>
                  {req.messageCount > 0 && (
                    <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
                      <ChatBubbleLeftRightIcon className="h-3 w-3" />
                      {req.messageCount}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-secondary)]">
                  {req.client && (
                    <>
                      <span className={`font-medium truncate max-w-[120px] sm:max-w-none ${!req.isClientActive ? 'line-through text-[var(--text-muted)]' : ''}`}>{req.client.name}</span>
                      {!req.isClientActive && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                          {t('requests.list.clientDissolved')}
                        </span>
                      )}
                      <span className="text-[var(--text-muted)]">·</span>
                    </>
                  )}
                  <span className={`inline-flex items-center gap-1 font-medium flex-shrink-0 ${
                    !req.isClientActive
                      ? ''
                      : urgency === 'urgent'
                      ? 'text-red-400'
                      : urgency === 'warning'
                      ? 'text-amber-400'
                      : ''
                  }`}>
                    {req.isClientActive && urgency === 'urgent' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                    )}
                    <ClockIcon className="h-3 w-3" />
                    {formatDate(req.createdAt, language)}
                  </span>
                  {!isClient && req.assignedUser && (
                    <>
                      <span className="text-[var(--text-muted)]">·</span>
                      <span className="text-[var(--accent-primary)] truncate max-w-[100px] sm:max-w-none">→ {req.assignedUser.name || 'Staff'}</span>
                    </>
                  )}
                  {!isClient && !req.assignedUser && (
                    <>
                      <span className="text-[var(--text-muted)]">·</span>
                      <span className="text-amber-400">{t('requests.list.notAssigned')}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Badges + Actions */}
              <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2 flex-shrink-0">
                {/* Staff self-assign button */}
                {!isClient && !req.assignedUser && req.status === 'Pending' && role === 'Staff' && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelfAssign(req.id);
                    }}
                    disabled={selfAssigning === req.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-primary)] px-2 py-1.5 sm:px-2.5 text-[10px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-primary-hover)] hover:shadow-md disabled:opacity-50"
                  >
                    {selfAssigning === req.id ? (
                      <ArrowPathIcon className="h-3 w-3 animate-spin" />
                    ) : (
                      <HandRaisedIcon className="h-3 w-3" />
                    )}
                    <span className="hidden sm:inline">{t('requests.list.selfAssign')}</span>
                  </button>
                )}
                <div className="flex items-center gap-1.5">
                  <PriorityBadge priority={req.priority} />
                  <StatusBadge status={req.status} />
                </div>
              </div>
            </Link>
          );})}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-[var(--text-muted)]">
            {t('requests.list.paging', { page: data.page, total: data.totalPages, count: data.totalCount })}
          </p>
          <div className="flex gap-1">
            {(() => {
              const total = data.totalPages;
              const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
              if (total <= 7) {
                for (let i = 1; i <= total; i++) pages.push(i);
              } else {
                pages.push(1);
                if (page > 3) pages.push('ellipsis-start');
                for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i);
                if (page < total - 2) pages.push('ellipsis-end');
                pages.push(total);
              }
              return pages.map((p) =>
                typeof p === 'string' ? (
                  <span key={p} className="flex h-8 w-8 items-center justify-center text-xs text-[var(--text-muted)]">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${page === p
                        ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                      }`}
                  >
                    {p}
                  </button>
                )
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
