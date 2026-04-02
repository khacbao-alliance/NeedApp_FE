'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { requestService } from '@/services/requestsApi';
import { userService } from '@/services/users';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import type { RequestDto, UserDetailDto, PaginatedResponse } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  BoltIcon,
  ShieldCheckIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user, role } = useAuth();
  const router = useRouter();

  // Client should not be on /dashboard — redirect to landing
  useEffect(() => {
    if (role === 'Client') {
      router.replace('/');
    }
  }, [role, router]);

  if (role === 'Client') return null;
  if (role === 'Admin') return <AdminDashboard userName={user?.name} />;
  if (role === 'Staff') return <StaffDashboard userName={user?.name} />;
  return null;
}

/* ═══════════════════════════════════════════════════════
   ADMIN DASHBOARD
   ═══════════════════════════════════════════════════════ */
function AdminDashboard({ userName }: { userName?: string | null }) {
  const [requests, setRequests] = useState<RequestDto[]>([]);
  const [users, setUsers] = useState<PaginatedResponse<UserDetailDto> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      requestService.list({ pageSize: 50 }).catch(() => null),
      userService.list({ pageSize: 5 }).catch(() => null),
    ]).then(([reqData, userData]) => {
      if (reqData?.items) setRequests(reqData.items);
      if (userData) setUsers(userData);
      setLoading(false);
    });
  }, []);

  const stats = {
    total: requests.length,
    intake: requests.filter((r) => r.status === 'Intake').length,
    pending: requests.filter((r) => r.status === 'Pending' || r.status === 'MissingInfo').length,
    inProgress: requests.filter((r) => r.status === 'InProgress').length,
    done: requests.filter((r) => r.status === 'Done').length,
    totalUsers: users?.totalCount ?? 0,
  };

  const urgentRequests = requests
    .filter((r) => r.priority === 'Urgent' || r.priority === 'High')
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-page">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-6 w-6 text-red-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Admin Panel</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)]">
            Xin chào, <span className="gradient-text">{userName || 'Admin'}</span>! 👋
          </h1>
          <p className="mt-1 text-[var(--text-muted)]">
            Tổng quan hệ thống và quản lý toàn bộ hoạt động.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<DocumentTextIcon className="h-5 w-5" />} label="Tổng yêu cầu" value={stats.total} color="text-[var(--accent-violet)]" bg="bg-[var(--accent-violet)]/10" />
        <StatCard icon={<InboxIcon className="h-5 w-5" />} label="Đang tiếp nhận" value={stats.intake} color="text-amber-400" bg="bg-amber-500/10" />
        <StatCard icon={<ClockIcon className="h-5 w-5" />} label="Chờ xử lý" value={stats.pending} color="text-blue-400" bg="bg-blue-500/10" />
        <StatCard icon={<ArrowTrendingUpIcon className="h-5 w-5" />} label="Đang xử lý" value={stats.inProgress} color="text-purple-400" bg="bg-purple-500/10" />
        <StatCard icon={<CheckCircleIcon className="h-5 w-5" />} label="Hoàn thành" value={stats.done} color="text-emerald-400" bg="bg-emerald-500/10" />
        <StatCard icon={<UserGroupIcon className="h-5 w-5" />} label="Người dùng" value={stats.totalUsers} color="text-cyan-400" bg="bg-cyan-500/10" />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickActionCard href="/admin/users" icon={<UserGroupIcon className="h-6 w-6" />} title="Quản lý người dùng" description="Tạo, sửa, xóa tài khoản người dùng" color="text-cyan-400" bg="bg-cyan-500/10" />
        <QuickActionCard href="/admin/intake-questions" icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />} title="Câu hỏi tiếp nhận" description="Quản lý bộ câu hỏi tự động" color="text-amber-400" bg="bg-amber-500/10" />
        <QuickActionCard href="/requests" icon={<DocumentTextIcon className="h-6 w-6" />} title="Tất cả yêu cầu" description="Xem và quản lý toàn bộ yêu cầu" color="text-[var(--accent-violet)]" bg="bg-[var(--accent-violet)]/10" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Urgent Requests */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              Yêu cầu ưu tiên cao
            </h2>
            <Link href="/requests" className="text-sm font-medium text-[var(--accent-violet)] hover:text-[var(--accent-indigo)] transition-colors">
              Xem tất cả →
            </Link>
          </div>
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : urgentRequests.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-center">
              <CheckCircleIcon className="mx-auto h-8 w-8 text-emerald-400" />
              <p className="mt-2 text-sm text-[var(--text-muted)]">Không có yêu cầu ưu tiên cao</p>
            </div>
          ) : (
            <RequestList requests={urgentRequests} />
          )}
        </div>

        {/* Recent Users */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
              <UserGroupIcon className="h-5 w-5 text-cyan-400" />
              Người dùng mới
            </h2>
            <Link href="/admin/users" className="text-sm font-medium text-[var(--accent-violet)] hover:text-[var(--accent-indigo)] transition-colors">
              Xem tất cả →
            </Link>
          </div>
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : !users?.items.length ? (
            <EmptyState title="Chưa có người dùng" />
          ) : (
            <div className="space-y-2">
              {users.items.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-3 transition-all duration-200 hover:bg-[var(--surface-hover)]">
                  <Avatar src={u.avatarUrl ?? undefined} name={u.name || u.email} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">{u.name || u.email}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">{u.email}</p>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STAFF DASHBOARD
   ═══════════════════════════════════════════════════════ */
function StaffDashboard({ userName }: { userName?: string | null }) {
  const [requests, setRequests] = useState<RequestDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestService
      .list({ pageSize: 50 })
      .then((res) => {
        if (res?.items) setRequests(res.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'Pending' || r.status === 'MissingInfo').length,
    inProgress: requests.filter((r) => r.status === 'InProgress').length,
    done: requests.filter((r) => r.status === 'Done').length,
    intake: requests.filter((r) => r.status === 'Intake').length,
  };

  const actionNeeded = requests.filter(
    (r) => r.status === 'Pending' || r.status === 'Intake' || r.status === 'MissingInfo'
  );
  const inProgressList = requests.filter((r) => r.status === 'InProgress').slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-page">
      <div>
        <div className="flex items-center gap-2">
          <BoltIcon className="h-5 w-5 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Staff Workspace</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)]">
          Xin chào, <span className="gradient-text">{userName || 'bạn'}</span>! 👋
        </h1>
        <p className="mt-1 text-[var(--text-muted)]">Theo dõi công việc và xử lý yêu cầu từ khách hàng.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<DocumentTextIcon className="h-5 w-5" />} label="Tổng yêu cầu" value={stats.total} color="text-[var(--accent-violet)]" bg="bg-[var(--accent-violet)]/10" />
        <StatCard icon={<ClockIcon className="h-5 w-5" />} label="Cần xử lý" value={stats.pending + stats.intake} color="text-amber-400" bg="bg-amber-500/10" highlight={stats.pending + stats.intake > 0} />
        <StatCard icon={<ArrowTrendingUpIcon className="h-5 w-5" />} label="Đang xử lý" value={stats.inProgress} color="text-blue-400" bg="bg-blue-500/10" />
        <StatCard icon={<CheckCircleIcon className="h-5 w-5" />} label="Hoàn thành" value={stats.done} color="text-emerald-400" bg="bg-emerald-500/10" />
      </div>

      {actionNeeded.length > 0 && (
        <div className="gradient-border rounded-2xl">
          <div className="flex items-center gap-4 rounded-2xl bg-[var(--surface-1)] p-5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--foreground)]">{actionNeeded.length} yêu cầu cần xử lý</h3>
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">Có yêu cầu đang chờ phản hồi hoặc thiếu thông tin từ khách hàng</p>
            </div>
            <Link href="/requests">
              <Button variant="gradient" size="sm">Xem ngay</Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
              <ClockIcon className="h-5 w-5 text-amber-400" />
              Cần xử lý
            </h2>
            <Link href="/requests" className="text-sm font-medium text-[var(--accent-violet)] hover:text-[var(--accent-indigo)] transition-colors">
              Xem tất cả →
            </Link>
          </div>
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : actionNeeded.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-center">
              <CheckCircleIcon className="mx-auto h-8 w-8 text-emerald-400" />
              <p className="mt-2 text-sm text-[var(--text-muted)]">Tất cả yêu cầu đã được xử lý! 🎉</p>
            </div>
          ) : (
            <RequestList requests={actionNeeded.slice(0, 5)} />
          )}
        </div>

        <div>
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
              <ArrowTrendingUpIcon className="h-5 w-5 text-blue-400" />
              Đang xử lý
            </h2>
          </div>
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : inProgressList.length === 0 ? (
            <EmptyState
              icon={<DocumentTextIcon className="h-8 w-8" />}
              title="Chưa có yêu cầu đang xử lý"
              description="Nhận yêu cầu mới từ danh sách chờ xử lý"
            />
          ) : (
            <RequestList requests={inProgressList} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════ */

function StatCard({ icon, label, value, color, bg, highlight }: {
  icon: React.ReactNode; label: string; value: number; color: string; bg: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-[var(--surface-1)] p-4 transition-all duration-300 ${highlight ? 'border-amber-500/30 animate-pulse-glow' : 'border-[var(--border)]'}`}>
      <div className={`mb-3 inline-flex rounded-lg p-2 ${bg}`}>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

function QuickActionCard({ href, icon, title, description, color, bg }: {
  href: string; icon: React.ReactNode; title: string; description: string; color: string; bg: string;
}) {
  return (
    <Link href={href} className="group flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5 transition-all duration-200 hover:bg-[var(--surface-hover)] hover:border-[var(--glass-border)]">
      <div className={`flex-shrink-0 rounded-xl p-3 ${bg} transition-transform duration-200 group-hover:scale-110`}>
        <span className={color}>{icon}</span>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--accent-violet)] transition-colors">{title}</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p>
      </div>
    </Link>
  );
}

function RequestList({ requests }: { requests: RequestDto[] }) {
  return (
    <div className="space-y-2">
      {requests.map((req) => (
        <Link key={req.id} href={`/requests/${req.id}`} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4 transition-all duration-200 hover:bg-[var(--surface-hover)] hover:border-[var(--glass-border)]">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium text-[var(--foreground)]">{req.title}</h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
              {req.client && <span className="font-medium text-[var(--text-secondary)]">{req.client.name}</span>}
              {req.client && <span>·</span>}
              <span>{formatDate(req.createdAt)}</span>
              {req.assignedUser && (
                <>
                  <span>·</span>
                  <span className="text-[var(--accent-violet)]">→ {req.assignedUser.name}</span>
                </>
              )}
            </div>
          </div>
          <div className="ml-4 flex items-center gap-2 flex-shrink-0">
            <PriorityBadge priority={req.priority} />
            <StatusBadge status={req.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    Admin: 'bg-red-500/15 text-red-400',
    Staff: 'bg-blue-500/15 text-blue-400',
    Client: 'bg-emerald-500/15 text-emerald-400',
  };
  return (
    <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-semibold ${colors[role] || 'bg-[var(--surface-3)] text-[var(--text-muted)]'}`}>
      {role}
    </span>
  );
}

function LoadingSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-20 rounded-xl animate-shimmer" />
      ))}
    </div>
  );
}
