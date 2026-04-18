'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { requestService } from '@/services/requestsApi';
import { dashboardService } from '@/services/dashboardApi';
import { userService } from '@/services/users';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import type { RequestDto, UserDetailDto, PaginatedResponse, DashboardStatsDto } from '@/types';
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
  UserPlusIcon,
  FireIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion/StaggerContainer';
import { FadeIn } from '@/components/ui/motion/FadeIn';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const { user, role } = useAuth();
  const router = useRouter();

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
  const { t } = useTranslation();
  const [requests, setRequests] = useState<RequestDto[]>([]);
  const [users, setUsers] = useState<PaginatedResponse<UserDetailDto> | null>(null);
  const [dashStats, setDashStats] = useState<DashboardStatsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      requestService.list({ pageSize: 50 }).catch(() => null),
      userService.list({ pageSize: 5 }).catch(() => null),
      dashboardService.getStats(30).catch(() => null),
    ]).then(([reqData, userData, statsData]) => {
      if (reqData?.items) setRequests(reqData.items);
      if (userData) setUsers(userData);
      if (statsData) setDashStats(statsData);
      setLoading(false);
    });
  }, []);

  const stats = {
    total: dashStats?.totalRequests ?? requests.length,
    intake: dashStats?.intakeCount ?? requests.filter((r) => r.status === 'Intake').length,
    pending: dashStats?.pendingCount ?? requests.filter((r) => r.status === 'Pending' || r.status === 'MissingInfo').length,
    inProgress: dashStats?.inProgressCount ?? requests.filter((r) => r.status === 'InProgress').length,
    done: dashStats?.doneCount ?? requests.filter((r) => r.status === 'Done').length,
    unassigned: dashStats?.unassignedCount ?? requests.filter((r) => !r.assignedUser && r.status !== 'Done' && r.status !== 'Cancelled' && r.status !== 'Intake').length,
    totalUsers: dashStats?.totalUsers ?? users?.totalCount ?? 0,
    overdue: dashStats?.overdueCount ?? requests.filter((r) => r.isOverdue).length,
    avgResolution: dashStats?.avgResolutionHours ?? 0,
    slaCompliance: dashStats?.slaComplianceRate ?? 100,
  };

  const urgentRequests = requests
    .filter((r) => r.priority === 'Urgent' || r.priority === 'High')
    .filter((r) => r.status !== 'Done' && r.status !== 'Cancelled')
    .slice(0, 5);

  const unassignedRequests = requests
    .filter((r) => !r.assignedUser && r.status !== 'Done' && r.status !== 'Cancelled' && r.status !== 'Intake')
    .slice(0, 5);

  const overdueRequests = requests
    .filter((r) => r.isOverdue)
    .slice(0, 5);

  return (
    <div className="space-y-8" id="dashboard-page">
      {/* Welcome */}
      <FadeIn direction="down" delay={0}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-6 w-6 text-red-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Admin Panel</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)]">
              {t('dashboard.greeting')}, <span className="gradient-text">{userName || 'Admin'}</span>!
            </h1>
            <p className="mt-1 text-[var(--text-muted)]">
              {t('dashboard.adminSubtitle')}
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Stats Row 1 — Core Metrics */}
      <StaggerContainer staggerDelay={0.07} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        <StaggerItem><StatCard icon={<DocumentTextIcon className="h-5 w-5" />} label={t('dashboard.totalRequests')} value={stats.total} color="text-[var(--accent-primary)]" bg="bg-[var(--accent-primary)]/10" /></StaggerItem>
        <StaggerItem><StatCard icon={<InboxIcon className="h-5 w-5" />} label={t('dashboard.intake')} value={stats.intake} color="text-amber-400" bg="bg-amber-500/10" /></StaggerItem>
        <StaggerItem><StatCard icon={<ClockIcon className="h-5 w-5" />} label={t('dashboard.pending')} value={stats.pending} color="text-blue-400" bg="bg-blue-500/10" /></StaggerItem>
        <StaggerItem><StatCard icon={<ArrowTrendingUpIcon className="h-5 w-5" />} label={t('dashboard.inProgress')} value={stats.inProgress} color="text-purple-400" bg="bg-purple-500/10" /></StaggerItem>
        <StaggerItem><StatCard icon={<CheckCircleIcon className="h-5 w-5" />} label={t('dashboard.done')} value={stats.done} color="text-emerald-400" bg="bg-emerald-500/10" /></StaggerItem>
        <StaggerItem><StatCard icon={<ExclamationTriangleIcon className="h-5 w-5" />} label={t('dashboard.unassigned')} value={stats.unassigned} color="text-red-400" bg="bg-red-500/10" highlight={stats.unassigned > 0} /></StaggerItem>
        <StaggerItem><StatCard icon={<UserGroupIcon className="h-5 w-5" />} label={t('dashboard.totalUsers')} value={stats.totalUsers} color="text-cyan-400" bg="bg-cyan-500/10" /></StaggerItem>
      </StaggerContainer>

      {/* Stats Row 2 — SLA Metrics */}
      <StaggerContainer staggerDelay={0.07} delayStart={0.2} className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StaggerItem>
          <StatCard
            icon={<FireIcon className="h-5 w-5" />}
            label={t('dashboard.overdue')}
            value={stats.overdue}
            color="text-red-400"
            bg="bg-red-500/10"
            highlight={stats.overdue > 0}
          />
        </StaggerItem>
        <StaggerItem>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4 transition-all duration-300">
            <div className="mb-3 inline-flex rounded-lg p-2 bg-blue-500/10">
              <ClockIcon className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {stats.avgResolution > 0 ? `${stats.avgResolution.toFixed(1)}h` : '—'}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{t('dashboard.avgResolution')}</p>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4 transition-all duration-300">
            <div className="mb-3 inline-flex rounded-lg p-2 bg-emerald-500/10">
              <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {stats.slaCompliance.toFixed(0)}%
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{t('dashboard.slaCompliance')}</p>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Charts Row — Recharts */}
      {dashStats && (
        <FadeIn delay={0.4}>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Status Pie Chart */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <ChartBarIcon className="h-4 w-4 text-[var(--accent-primary)]" />
                {t('dashboard.statusDistribution')}
              </h3>
              <StatusPieChartRecharts data={dashStats.statusBreakdown} />
            </div>

            {/* Daily Trend */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <ArrowTrendingUpIcon className="h-4 w-4 text-[var(--accent-primary)]" />
                {t('dashboard.dailyTrend')}
              </h3>
              <DailyTrendChartRecharts data={dashStats.dailyTrend} />
            </div>
          </div>
        </FadeIn>
      )}

      {/* Priority Breakdown */}
      {dashStats && dashStats.priorityBreakdown.length > 0 && (
        <FadeIn delay={0.45}>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-400" />
              {t('dashboard.priorityBreakdown', 'Phân bổ ưu tiên (active)')}
            </h3>
            <PriorityBarChart data={dashStats.priorityBreakdown} />
          </div>
        </FadeIn>
      )}

      {/* Staff Leaderboard */}
      {dashStats && dashStats.staffPerformance.length > 0 && (
        <FadeIn delay={0.5}>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
              <UserGroupIcon className="h-4 w-4 text-[var(--accent-primary)]" />
              {t('dashboard.staffLeaderboard')}
            </h3>
            <StaffLeaderboard data={dashStats.staffPerformance} />
          </div>
        </FadeIn>
      )}

      {/* Quick Actions Grid */}
      <StaggerContainer staggerDelay={0.1} delayStart={0.3} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StaggerItem><QuickActionCard href="/admin/users" icon={<UserGroupIcon className="h-6 w-6" />} title={t('dashboard.manageUsers')} description={t('dashboard.manageUsersDesc')} color="text-[var(--accent-primary)]" bg="bg-[var(--accent-primary)]/10" /></StaggerItem>
        <StaggerItem><QuickActionCard href="/admin/intake-questions" icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />} title={t('dashboard.intakeQuestions')} description={t('dashboard.intakeQuestionsDesc')} color="text-[var(--accent-primary)]" bg="bg-[var(--accent-primary)]/10" /></StaggerItem>
        <StaggerItem><QuickActionCard href="/requests" icon={<DocumentTextIcon className="h-6 w-6" />} title={t('dashboard.allRequests')} description={t('dashboard.allRequestsDesc')} color="text-[var(--accent-primary)]" bg="bg-[var(--accent-primary)]/10" /></StaggerItem>
      </StaggerContainer>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue Requests */}
        {overdueRequests.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
                <FireIcon className="h-5 w-5 text-red-400" />
                {t('dashboard.overdueRequests')}
              </h2>
              <Link href="/requests" className="text-sm font-medium text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors">
                {t('dashboard.viewAll')} →
              </Link>
            </div>
            <RequestList requests={overdueRequests} showDeadline />
          </div>
        )}

        {/* Urgent Requests */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              {t('dashboard.highPriority')}
            </h2>
            <Link href="/requests" className="text-sm font-medium text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors">
              {t('dashboard.viewAll')} →
            </Link>
          </div>
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : urgentRequests.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-center">
              <CheckCircleIcon className="mx-auto h-8 w-8 text-emerald-400" />
              <p className="mt-2 text-sm text-[var(--text-muted)]">{t('dashboard.noHighPriority')}</p>
            </div>
          ) : (
            <RequestList requests={urgentRequests} showDeadline />
          )}
        </div>

        {/* Unassigned Requests */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
              <UserPlusIcon className="h-5 w-5 text-amber-400" />
              {t('dashboard.unassigned')}
            </h2>
            <Link href="/requests" className="text-sm font-medium text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors">
              {t('dashboard.viewAll')} →
            </Link>
          </div>
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : unassignedRequests.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-center">
              <CheckCircleIcon className="mx-auto h-8 w-8 text-emerald-400" />
              <p className="mt-2 text-sm text-[var(--text-muted)]">{t('dashboard.allAssigned')}</p>
            </div>
          ) : (
            <RequestList requests={unassignedRequests} />
          )}
        </div>
      </div>

      {/* Recent Users */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
            <UserGroupIcon className="h-5 w-5 text-cyan-400" />
            {t('dashboard.recentUsers')}
          </h2>
          <Link href="/admin/users" className="text-sm font-medium text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors">
            {t('dashboard.viewAll')} →
          </Link>
        </div>
        {loading ? (
          <LoadingSkeleton count={3} />
        ) : !users?.items.length ? (
          <EmptyState title={t('dashboard.noUsers')} />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
  );
}

/* ═══════════════════════════════════════════════════════
   STAFF DASHBOARD
   ═══════════════════════════════════════════════════════ */
function StaffDashboard({ userName }: { userName?: string | null }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestService
      .list({ pageSize: 50 })
      .then((res) => {
        if (res?.items) setRequests(res.items);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const myRequests = requests.filter((r) => r.assignedUser?.id === user?.id);

  const stats = {
    total: requests.length,
    actionable: myRequests.filter((r) => r.status === 'Pending' || r.status === 'MissingInfo').length,
    inProgress: myRequests.filter((r) => r.status === 'InProgress').length,
    done: myRequests.filter((r) => r.status === 'Done').length,
    overdue: myRequests.filter((r) => r.isOverdue).length,
  };

  const actionNeeded = myRequests.filter(
    (r) => r.status === 'Pending' || r.status === 'MissingInfo'
  );
  const inProgressList = myRequests.filter((r) => r.status === 'InProgress').slice(0, 5);
  const overdueList = myRequests.filter((r) => r.isOverdue).slice(0, 5);

  return (
    <div className="space-y-8" id="dashboard-page">
      <FadeIn direction="down" delay={0}>
        <div>
          <div className="flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-blue-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Staff Workspace</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)]">
            {t('dashboard.greeting')}, <span className="gradient-text">{userName || 'bạn'}</span>!
          </h1>
          <p className="mt-1 text-[var(--text-muted)]">{t('dashboard.staffSubtitle')}</p>
        </div>
      </FadeIn>

      <StaggerContainer staggerDelay={0.1} className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StaggerItem><StatCard icon={<DocumentTextIcon className="h-5 w-5" />} label={t('dashboard.totalRequests')} value={stats.total} color="text-[var(--accent-primary)]" bg="bg-[var(--accent-primary)]/10" /></StaggerItem>
        <StaggerItem><StatCard icon={<ClockIcon className="h-5 w-5" />} label={t('dashboard.myRequests')} value={stats.actionable} color="text-amber-400" bg="bg-amber-500/10" highlight={stats.actionable > 0} /></StaggerItem>
        <StaggerItem><StatCard icon={<ArrowTrendingUpIcon className="h-5 w-5" />} label={t('dashboard.inProgress')} value={stats.inProgress} color="text-blue-400" bg="bg-blue-500/10" /></StaggerItem>
        <StaggerItem><StatCard icon={<CheckCircleIcon className="h-5 w-5" />} label={t('dashboard.done')} value={stats.done} color="text-emerald-400" bg="bg-emerald-500/10" /></StaggerItem>
        <StaggerItem><StatCard icon={<FireIcon className="h-5 w-5" />} label={t('dashboard.overdue')} value={stats.overdue} color="text-red-400" bg="bg-red-500/10" highlight={stats.overdue > 0} /></StaggerItem>
      </StaggerContainer>

      {actionNeeded.length > 0 && (
        <div className="gradient-border rounded-2xl">
          <div className="flex items-center gap-4 rounded-2xl bg-[var(--surface-1)] p-5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--foreground)]">{actionNeeded.length} {t('dashboard.myRequests')}</h3>
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">{t('dashboard.pendingFeedback')}</p>
            </div>
            <Link href="/requests">
              <Button variant="gradient" size="sm">{t('dashboard.viewAll')}</Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue Requests — Staff */}
        {overdueList.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
                <FireIcon className="h-5 w-5 text-red-400" />
                {t('dashboard.overdueRequests')}
              </h2>
            </div>
            <RequestList requests={overdueList} showDeadline />
          </div>
        )}

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
              <ClockIcon className="h-5 w-5 text-amber-400" />
              {t('dashboard.myRequests')}
            </h2>
            <Link href="/requests" className="text-sm font-medium text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors">
              {t('dashboard.viewAll')} →
            </Link>
          </div>
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : actionNeeded.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-center">
              <CheckCircleIcon className="mx-auto h-8 w-8 text-emerald-400" />
              <p className="mt-2 text-sm text-[var(--text-muted)]">{t('dashboard.noRequestsYet')}</p>
            </div>
          ) : (
            <RequestList requests={actionNeeded.slice(0, 5)} showDeadline />
          )}
        </div>

        <div>
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
              <ArrowTrendingUpIcon className="h-5 w-5 text-blue-400" />
              {t('dashboard.inProgress')}
            </h2>
          </div>
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : inProgressList.length === 0 ? (
            <EmptyState
              icon={<DocumentTextIcon className="h-8 w-8" />}
              title={t('dashboard.noRequestsYet')}
              description={t('dashboard.pickFromQueue')}
            />
          ) : (
            <RequestList requests={inProgressList} showDeadline />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RECHARTS — Status Pie Chart
   ═══════════════════════════════════════════════════════ */
const STATUS_COLORS: Record<string, string> = {
  Draft: '#6B7280',
  Intake: '#F59E0B',
  Pending: '#3B82F6',
  MissingInfo: '#EF4444',
  InProgress: '#A855F7',
  Done: '#10B981',
  Cancelled: '#6B7280',
};

function StatusPieChartRecharts({ data }: { data: { status: string; count: number }[] }) {
  const { t } = useTranslation();
  const chartData = data.filter(d => d.count > 0).map(d => ({
    name: d.status,
    value: d.count,
    fill: STATUS_COLORS[d.status] || '#6B7280',
  }));

  if (chartData.length === 0) {
    return <p className="text-sm text-[var(--text-muted)] text-center py-8">{t('dashboard.noData')}</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} opacity={0.85} />
          ))}
        </Pie>
        <ReTooltip
          contentStyle={{
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--foreground)',
          }}
          formatter={(value, name) => [`${value}`, `${name}`]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ═══════════════════════════════════════════════════════
   RECHARTS — Daily Trend Bar Chart
   ═══════════════════════════════════════════════════════ */
function DailyTrendChartRecharts({ data }: { data: { date: string; created: number; completed: number }[] }) {
  const { t } = useTranslation();
  const hasData = data.some(d => d.created > 0 || d.completed > 0);
  if (!hasData) {
    return <p className="text-sm text-[var(--text-muted)] text-center py-8">{t('dashboard.noData')}</p>;
  }

  // Show only last 14 days labels for readability
  const chartData = data.map((d, i) => ({
    ...d,
    label: i % 3 === 0 ? d.date.slice(5) : '', // MM-DD every 3 days
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barGap={0} barSize={6}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={28}
        />
        <ReTooltip
          contentStyle={{
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--foreground)',
          }}
          labelFormatter={(_, payload) =>
            payload?.[0]?.payload?.date || ''
          }
        />
        <Bar dataKey="created" name={t('dashboard.created')} fill="var(--accent-primary)" opacity={0.7} radius={[2, 2, 0, 0]} />
        <Bar dataKey="completed" name={t('dashboard.completed')} fill="#10B981" opacity={0.8} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ═══════════════════════════════════════════════════════
   RECHARTS — Priority Breakdown
   ═══════════════════════════════════════════════════════ */
const PRIORITY_COLORS: Record<string, string> = {
  Urgent: '#EF4444',
  High: '#F97316',
  Medium: '#3B82F6',
  Low: '#22C55E',
};

function PriorityBarChart({ data }: { data: { priority: string; count: number }[] }) {
  const chartData = data.map(d => ({
    name: d.priority,
    value: d.count,
    fill: PRIORITY_COLORS[d.priority] || '#6B7280',
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} layout="vertical" barSize={20}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={60} />
        <ReTooltip
          contentStyle={{
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--foreground)',
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} opacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ═══════════════════════════════════════════════════════
   Staff Leaderboard
   ═══════════════════════════════════════════════════════ */
function StaffLeaderboard({ data }: { data: { userId: string; name: string | null; avatarUrl: string | null; assignedCount: number; completedCount: number; avgResolutionHours: number }[] }) {
  const { t } = useTranslation();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
            <th className="pb-2 font-medium">#</th>
            <th className="pb-2 font-medium">{t('dashboard.staffName')}</th>
            <th className="pb-2 font-medium text-center">{t('dashboard.assigned')}</th>
            <th className="pb-2 font-medium text-center">{t('dashboard.completedCol')}</th>
            <th className="pb-2 font-medium text-center">{t('dashboard.avgTime')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((staff, i) => (
            <tr key={staff.userId} className="border-b border-[var(--border)]/50 transition-colors hover:bg-[var(--surface-hover)]">
              <td className="py-2.5 text-[var(--text-muted)]">{i + 1}</td>
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <Avatar src={staff.avatarUrl ?? undefined} name={staff.name || '?'} size="xs" />
                  <span className="font-medium text-[var(--foreground)]">{staff.name || '—'}</span>
                </div>
              </td>
              <td className="py-2.5 text-center text-[var(--text-secondary)]">{staff.assignedCount}</td>
              <td className="py-2.5 text-center">
                <span className="font-semibold text-emerald-400">{staff.completedCount}</span>
              </td>
              <td className="py-2.5 text-center text-[var(--text-secondary)]">
                {staff.avgResolutionHours > 0 ? `${staff.avgResolutionHours}h` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{label}</p>
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
        <h3 className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--accent-primary)] transition-colors">{title}</h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{description}</p>
      </div>
    </Link>
  );
}

function DeadlineBadge({ dueDate, isOverdue }: { dueDate: string | null; isOverdue: boolean }) {
  const { t } = useTranslation();
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const now = new Date();
  const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/25 px-2 py-0.5 text-[10px] font-semibold text-red-400">
        <FireIcon className="h-3 w-3" />
        {t('dashboard.overdue')}
      </span>
    );
  }

  if (hoursLeft < 24 && hoursLeft > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
        <ClockIcon className="h-3 w-3" />
        {hoursLeft < 1 ? `${Math.max(1, Math.round(hoursLeft * 60))}m` : `${Math.round(hoursLeft)}h`}
      </span>
    );
  }

  return null;
}

function RequestList({ requests, showDeadline }: { requests: RequestDto[]; showDeadline?: boolean }) {
  const { language } = useLanguage();
  return (
    <StaggerContainer staggerDelay={0.07} className="space-y-2">
      {requests.map((req) => (
        <StaggerItem key={req.id}>
          <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.15, ease: 'easeOut' }}>
            <Link href={`/requests/${req.id}`} className={`flex items-center justify-between rounded-xl border bg-[var(--surface-1)] p-4 transition-all duration-200 hover:bg-[var(--surface-hover)] hover:border-[var(--glass-border)] ${req.isOverdue ? 'border-red-500/30' : 'border-[var(--border)]'}`}>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-[var(--foreground)]">{req.title}</h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  {req.client && <span className="font-medium">{req.client.name}</span>}
                  {req.client && <span>·</span>}
                  <span>{formatDate(req.createdAt, language)}</span>
                  {req.assignedUser && (
                    <>
                      <span>·</span>
                      <span className="text-[var(--accent-primary)]">→ {req.assignedUser.name}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                {showDeadline && <DeadlineBadge dueDate={req.dueDate} isOverdue={req.isOverdue} />}
                <PriorityBadge priority={req.priority} />
                <StatusBadge status={req.status} />
              </div>
            </Link>
          </motion.div>
        </StaggerItem>
      ))}
    </StaggerContainer>
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
