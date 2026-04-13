'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useClientMembers } from '@/hooks/useClientMembers';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import type { ClientMemberDto, ClientRole } from '@/types';
import {
  UserPlusIcon,
  TrashIcon,
  ArrowPathIcon,
  StarIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string, language: string): string {
  return new Date(iso).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: ClientRole }) {
  const { t } = useTranslation();
  if (role === 'Owner') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
        <StarIconSolid className="h-3 w-3" />
        {t('profile.owner')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-[var(--surface-3)] text-[var(--text-muted)] border border-[var(--border)]">
      <UserIcon className="h-3 w-3" />
      {t('profile.member')}
    </span>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({
  member,
  isCurrentUser,
  isOwner,
  onRemove,
  removing,
}: {
  member: ClientMemberDto;
  isCurrentUser: boolean;
  isOwner: boolean;
  onRemove: (member: ClientMemberDto) => void;
  removing: boolean;
}) {
  const { t, i18n } = useTranslation();
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] p-3 group transition-colors hover:bg-[var(--surface-3)]">
      <Avatar
        src={member.avatarUrl ?? undefined}
        name={member.name || member.email || '?'}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[var(--foreground)] truncate">
            {member.name ?? t('members.noName')}
          </span>
          <RoleBadge role={member.role} />
          {isCurrentUser && (
            <span className="text-[10px] text-[var(--accent-violet)] font-medium rounded-full px-1.5 py-0.5 bg-violet-500/10">
              {t('members.you')}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3 flex-wrap">
          {member.email && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] truncate">
              <EnvelopeIcon className="h-3 w-3 flex-shrink-0" />
              {member.email}
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
            <CalendarDaysIcon className="h-3 w-3 flex-shrink-0" />
            {formatDate(member.joinedAt, i18n.language)}
          </span>
        </div>
      </div>

      {isOwner && !isCurrentUser && (
        <button
          onClick={() => onRemove(member)}
          disabled={removing}
          title={t('members.removeTitle')}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30"
        >
          {removing ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            <TrashIcon className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteMemberModal({
  open,
  onClose,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: ClientRole) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ClientRole>('Member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setEmail('');
    setRole('Member');
    setError(null);
    onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onInvite(email.trim(), role);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('common.error');
      if (msg.includes('No user found with email')) {
        setError(t('members.errorNoAccount'));
      } else if (msg.includes('already belongs to another client')) {
        setError(t('members.errorOtherClient'));
      } else if (msg.includes('already a member')) {
        setError(t('members.errorAlreadyMember'));
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={t('members.inviteTitle')} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            Email <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              autoFocus
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-9 pr-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-violet)] focus:ring-1 focus:ring-[var(--accent-violet)] transition-colors"
            />
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            {t('members.inviteRole')}
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as ClientRole)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent-violet)] focus:ring-1 focus:ring-[var(--accent-violet)] transition-colors"
          >
            <option value="Member">{t('profile.member')}</option>
            <option value="Owner">{t('profile.owner')}</option>
          </select>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 px-3 py-2.5">
          <ExclamationTriangleIcon className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-400/80 leading-relaxed">
            {t('members.inviteNote')}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-500/5 border border-red-500/20 px-3 py-2.5">
            <p className="text-xs text-red-400 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-violet)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlusIcon className="h-4 w-4" />
            )}
            {isLoading ? t('members.inviting') : t('members.inviteBtn')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Confirm Remove Modal ─────────────────────────────────────────────────────

function ConfirmRemoveModal({
  member,
  onConfirm,
  onCancel,
  isLoading,
}: {
  member: ClientMemberDto | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Modal open={!!member} onClose={onCancel} title={t('members.removeTitle')} size="sm">
      {member && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {t('members.removeConfirmBefore')}{' '}
            <span className="font-semibold text-[var(--foreground)]">
              {member.name ?? member.email}
            </span>{' '}
            {t('members.removeConfirmAfter')}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {t('members.removeWarning')}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <TrashIcon className="h-4 w-4" />
              )}
              {isLoading ? t('members.removing') : t('common.delete')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

interface ClientMembersPanelProps {
  clientId: string;
  currentUserId: string;
  isOwner: boolean;
}

export function ClientMembersPanel({
  clientId,
  currentUserId,
  isOwner,
}: ClientMembersPanelProps) {
  const { t } = useTranslation();
  const { members, isLoading, error, refetch, invite, remove } = useClientMembers(clientId);
  const [showInvite, setShowInvite] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<ClientMemberDto | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleInvite(email: string, role: ClientRole) {
    await invite(email, role);
  }

  async function handleConfirmRemove() {
    if (!pendingRemove) return;
    setRemovingId(pendingRemove.userId);
    try {
      await remove(pendingRemove.userId);
      setPendingRemove(null);
    } catch {
      // ignore
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/15">
            <StarIcon className="h-3.5 w-3.5 text-[var(--accent-violet)]" />
          </span>
          {t('members.title')}
          {!isLoading && (
            <span className="text-xs text-[var(--text-muted)] font-normal">
              ({members.length})
            </span>
          )}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={refetch}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-40"
            title={t('members.refresh')}
          >
            <ArrowPathIcon className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {isOwner && (
            <button
              onClick={() => setShowInvite(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-violet)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <UserPlusIcon className="h-3.5 w-3.5" />
              {t('members.invite')}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--surface-2)]" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-4 text-center">
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-xs text-red-400 hover:underline"
          >
            {t('members.tryAgain')}
          </button>
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">{t('members.noMembers')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {members.map((member) => (
              <MemberRow
                key={member.userId}
                member={member}
                isCurrentUser={member.userId === currentUserId}
                isOwner={isOwner}
                onRemove={setPendingRemove}
                removing={removingId === member.userId}
              />
            ))}
          </div>
          {!isOwner && (
            <p className="text-center text-[11px] text-[var(--text-muted)] pt-1">
              {t('members.ownerOnly')}
            </p>
          )}
        </>
      )}

      <InviteMemberModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        onInvite={handleInvite}
      />

      <ConfirmRemoveModal
        member={pendingRemove}
        onConfirm={handleConfirmRemove}
        onCancel={() => setPendingRemove(null)}
        isLoading={!!removingId}
      />
    </>
  );
}
