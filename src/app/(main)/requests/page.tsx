'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { requestService, type GetRequestsParams } from '@/services/requestsApi';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import type { RequestDto, RequestStatus, PaginatedResponse } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  PlusIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  HandRaisedIcon,
} from '@heroicons/react/24/outline';

const statusFilters: { value: RequestStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Intake', label: 'Tiếp nhận' },
  { value: 'Pending', label: 'Chờ xử lý' },
  { value: 'MissingInfo', label: 'Thiếu TT' },
  { value: 'InProgress', label: 'Đang xử lý' },
  { value: 'Done', label: 'Hoàn thành' },
];

export default function RequestsPage() {
  const { role } = useAuth();
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

  const requests = data?.items ?? [];

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
    <div className="space-y-6 animate-fade-in" id="requests-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Yêu cầu</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {isClient ? 'Quản lý yêu cầu của bạn' : 'Quản lý tất cả yêu cầu trong hệ thống'}
          </p>
        </div>
        {isClient && (
          <Link href="/requests/new">
            <Button variant="gradient">
              <PlusIcon className="h-4 w-4" />
              Tạo mới
            </Button>
          </Link>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Tìm kiếm yêu cầu..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none transition-all focus:border-[var(--accent-indigo)] focus:ring-1 focus:ring-[var(--accent-indigo)]/50"
            id="search-requests"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? 'bg-[var(--accent-indigo)]/15 text-[var(--accent-violet)]'
                  : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
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
          title={search || statusFilter !== 'all' ? 'Không tìm thấy kết quả' : 'Chưa có yêu cầu nào'}
          description={
            search || statusFilter !== 'all'
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              : 'Tạo yêu cầu đầu tiên để bắt đầu'
          }
          action={
            !search && statusFilter === 'all' && isClient ? (
              <Link href="/requests/new">
                <Button variant="gradient">
                  <PlusIcon className="h-4 w-4" />
                  Tạo yêu cầu
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req, i) => (
            <Link
              key={req.id}
              href={`/requests/${req.id}`}
              className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4 transition-all duration-200 hover:bg-[var(--surface-hover)] hover:border-[var(--glass-border)]"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Creator Avatar */}
              <div className="flex-shrink-0">
                <Avatar
                  src={req.createdByUser?.avatarUrl ?? undefined}
                  name={req.createdByUser?.name || req.client?.name || '?'}
                  size="sm"
                />
              </div>

              {/* Main Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent-violet)] transition-colors">
                    {req.title}
                  </h3>
                  {req.messageCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
                      <ChatBubbleLeftRightIcon className="h-3 w-3" />
                      {req.messageCount}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  {req.client && (
                    <>
                      <span className="font-medium text-[var(--text-secondary)]">{req.client.name}</span>
                      <span>·</span>
                    </>
                  )}
                  <span>{formatDate(req.createdAt)}</span>
                  {!isClient && req.assignedUser && (
                    <>
                      <span>·</span>
                      <span className="text-[var(--accent-violet)]">→ {req.assignedUser.name || 'Staff'}</span>
                    </>
                  )}
                  {!isClient && !req.assignedUser && (
                    <>
                      <span>·</span>
                      <span className="text-amber-400">Chưa assign</span>
                    </>
                  )}
                </div>
              </div>

              {/* Badges + Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Staff self-assign button */}
                {!isClient && !req.assignedUser && req.status === 'Pending' && role === 'Staff' && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelfAssign(req.id);
                    }}
                    disabled={selfAssigning === req.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[var(--accent-indigo)] to-[var(--accent-violet)] px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                  >
                    {selfAssigning === req.id ? (
                      <ArrowPathIcon className="h-3 w-3 animate-spin" />
                    ) : (
                      <HandRaisedIcon className="h-3 w-3" />
                    )}
                    Nhận xử lý
                  </button>
                )}
                <PriorityBadge priority={req.priority} />
                <StatusBadge status={req.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-[var(--text-muted)]">
            Trang {data.page} / {data.totalPages} · {data.totalCount} yêu cầu
          </p>
          <div className="flex gap-1">
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                  page === p
                    ? 'bg-[var(--accent-indigo)]/15 text-[var(--accent-violet)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
