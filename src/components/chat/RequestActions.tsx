'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { requestService } from '@/services/requestsApi';
import { userService } from '@/services/users';
import { useAuth } from '@/hooks/useAuth';
import type { RequestDto, RequestStatus, UserDetailDto } from '@/types';
import {
  PlayIcon,
  CheckCircleIcon,
  PauseIcon,
  XMarkIcon,
  ArrowPathIcon,
  UserPlusIcon,
  UserMinusIcon,
  ChevronDownIcon,
  HandRaisedIcon,
} from '@heroicons/react/24/outline';

/* ─── Valid Transitions ─── */
function getStatusTransitions(t: (key: string) => string) {
  return {
    Pending: [
      { status: 'InProgress', label: t('requestActions.startProcessing'), icon: <PlayIcon className="h-3.5 w-3.5" />, variant: 'primary' },
      { status: 'Cancelled', label: t('requestActions.cancel'), icon: <XMarkIcon className="h-3.5 w-3.5" />, variant: 'danger' },
    ],
    InProgress: [
      { status: 'Done', label: t('requestActions.complete'), icon: <CheckCircleIcon className="h-3.5 w-3.5" />, variant: 'success' },
      { status: 'Pending', label: t('requestActions.pause'), icon: <PauseIcon className="h-3.5 w-3.5" />, variant: 'warning' },
      { status: 'Cancelled', label: t('requestActions.cancel'), icon: <XMarkIcon className="h-3.5 w-3.5" />, variant: 'danger' },
    ],
    MissingInfo: [
      { status: 'InProgress', label: t('requestActions.continue'), icon: <PlayIcon className="h-3.5 w-3.5" />, variant: 'primary' },
      { status: 'Cancelled', label: t('requestActions.cancel'), icon: <XMarkIcon className="h-3.5 w-3.5" />, variant: 'danger' },
    ],
    Done: [
      { status: 'InProgress', label: t('requestActions.reopen'), icon: <ArrowPathIcon className="h-3.5 w-3.5" />, variant: 'warning' },
    ],
  } as Record<string, { status: RequestStatus; label: string; icon: React.ReactNode; variant: string }[]>;
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: 'bg-[var(--accent-indigo)]/15 text-[var(--accent-violet)] hover:bg-[var(--accent-indigo)]/25',
  success: 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25',
  warning: 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25',
  danger: 'bg-red-500/15 text-red-400 hover:bg-red-500/25',
};

/* ─── Status Actions ─── */
export function RequestStatusActions({
  request,
  onUpdate,
}: {
  request: RequestDto;
  onUpdate: (updated: RequestDto) => void;
}) {
  const { t } = useTranslation();
  const { role } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const STATUS_TRANSITIONS = getStatusTransitions(t);

  // Only Staff/Admin can change status
  if (role !== 'Staff' && role !== 'Admin') return null;

  const actions = STATUS_TRANSITIONS[request.status] ?? [];
  if (actions.length === 0) return null;

  const handleStatusChange = async (newStatus: RequestStatus) => {
    setUpdating(true);
    setError('');
    try {
      const updated = await requestService.updateStatus(request.id, newStatus);
      onUpdate(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('requestActions.cannotChangeStatus');
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {actions.map((action) => (
        <button
          key={action.status}
          onClick={() => handleStatusChange(action.status)}
          disabled={updating}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${VARIANT_CLASSES[action.variant]} disabled:opacity-50`}
        >
          {updating ? (
            <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
          ) : (
            action.icon
          )}
          {action.label}
        </button>
      ))}
      {error && (
        <span className="text-[10px] text-red-400 animate-fade-in">{error}</span>
      )}
    </div>
  );
}

/* ─── Self-Assign (Staff) ─── */
export function SelfAssignAction({
  request,
  onUpdate,
}: {
  request: RequestDto;
  onUpdate: (updated: RequestDto) => void;
}) {
  const { t } = useTranslation();
  const { role } = useAuth();
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  // Only show for Staff on unassigned requests
  if (role !== 'Staff') return null;
  if (request.assignedUser) return null;
  if (request.status === 'Done' || request.status === 'Cancelled' || request.status === 'Intake') return null;

  const handleSelfAssign = async () => {
    setAssigning(true);
    setError('');
    try {
      const updated = await requestService.selfAssign(request.id);
      onUpdate(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('requestActions.cannotSelfAssign');
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSelfAssign}
        disabled={assigning}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--accent-indigo)] to-[var(--accent-violet)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md hover:shadow-[var(--accent-indigo)]/20 disabled:opacity-50"
      >
        {assigning ? (
          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <HandRaisedIcon className="h-3.5 w-3.5" />
        )}
        {t('requestActions.selfAssign')}
      </button>
      {error && (
        <span className="text-[10px] text-red-400 animate-fade-in">{error}</span>
      )}
    </div>
  );
}

/* ─── Assign Staff (Admin only) ─── */
export function AssignStaffAction({
  request,
  onUpdate,
}: {
  request: RequestDto;
  onUpdate: (updated: RequestDto) => void;
}) {
  const { t } = useTranslation();
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [staffList, setStaffList] = useState<UserDetailDto[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  // Only Admin can assign
  if (role !== 'Admin') return null;

  // Don't show for terminal statuses
  if (request.status === 'Done' || request.status === 'Cancelled') return null;

  const loadStaff = async () => {
    if (staffList.length > 0) return; // Already loaded
    setLoadingStaff(true);
    try {
      const res = await userService.list({ pageSize: 100 });
      // Filter to Staff/Admin only
      setStaffList(res.items.filter((u) => u.role === 'Staff' || u.role === 'Admin'));
    } catch {
      // ignore
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleAssign = async (staffUserId: string) => {
    setAssigning(true);
    setError('');
    try {
      const updated = await requestService.assign(request.id, staffUserId);
      onUpdate(updated);
      setOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('requestActions.cannotAssign');
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    setAssigning(true);
    setError('');
    try {
      const updated = await requestService.unassign(request.id);
      onUpdate(updated);
      setOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('requestActions.cannotUnassign');
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) loadStaff();
        }}
        className="inline-flex items-center gap-1 rounded-lg bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)] hover:bg-[var(--surface-3)]"
      >
        <UserPlusIcon className="h-3.5 w-3.5" />
        {request.assignedUser ? t('requestActions.changeStaff') : t('requestActions.assignStaff')}
        <ChevronDownIcon className="h-3 w-3" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-1.5 shadow-xl animate-fade-in">
            {loadingStaff ? (
              <div className="flex items-center justify-center py-4">
                <ArrowPathIcon className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
              </div>
            ) : staffList.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[var(--text-muted)]">{t('requestActions.noStaff')}</p>
            ) : (
              <>
                {staffList.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => handleAssign(staff.id)}
                    disabled={assigning || staff.id === request.assignedUser?.id}
                    className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50 ${
                      staff.id === request.assignedUser?.id ? 'bg-[var(--accent-indigo)]/10 text-[var(--accent-violet)]' : 'text-[var(--foreground)]'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{staff.name || staff.email}</p>
                      <p className="text-[var(--text-muted)] truncate">{staff.email}</p>
                    </div>
                    {staff.id === request.assignedUser?.id && (
                      <span className="text-[10px] text-[var(--accent-violet)]">{t('requestActions.current')}</span>
                    )}
                  </button>
                ))}

                {/* Unassign option */}
                {request.assignedUser && (
                  <>
                    <div className="my-1 border-t border-[var(--border)]" />
                    <button
                      onClick={handleUnassign}
                      disabled={assigning}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <UserMinusIcon className="h-3.5 w-3.5" />
                      {t('requestActions.unassign', { name: request.assignedUser.name || 'Staff' })}
                    </button>
                  </>
                )}
              </>
            )}
            {error && (
              <p className="px-3 py-1 text-[10px] text-red-400">{error}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
