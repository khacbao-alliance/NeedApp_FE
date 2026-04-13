'use client';

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { fileService } from '@/services/files';
import { userService } from '@/services/users';
import { clientService } from '@/services/clients';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ApiRequestError } from '@/services/requests';
import {
  CameraIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  ArrowRightStartOnRectangleIcon,
  DocumentTextIcon,
  PhoneIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { ClientMembersPanel } from '@/components/profile/ClientMembersPanel';

// ─── Reusable editable field ──────────────────────────────────────────────────

function EditableInfoRow({
  icon,
  label,
  value,
  placeholder,
  onSave,
  valueClass,
  readonly,
  type = 'text',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder?: string;
  onSave?: (newValue: string) => Promise<void>;
  valueClass?: string;
  readonly?: boolean;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleEdit = () => {
    setDraft(value);
    setError('');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    setError('');
    try {
      await onSave(draft.trim());
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft(value);
    setError('');
  };

  return (
    <div className="rounded-xl bg-[var(--surface-2)] p-4 transition-all">
      <div className="flex items-center gap-3">
        <span className="flex-shrink-0 text-[var(--text-muted)]">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text-muted)]">{label}</p>
          {editing ? (
            <input
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              autoFocus
              className="mt-1 w-full rounded-lg border border-[var(--accent-indigo)] bg-[var(--surface-3)] px-2 py-1 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--accent-violet)] transition-all"
            />
          ) : (
            <p className={`text-sm font-medium ${valueClass || 'text-[var(--foreground)]'}`}>
              {value || <span className="text-[var(--text-muted)] italic text-sm">{placeholder || '—'}</span>}
            </p>
          )}
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>

        {!readonly && onSave && (
          <div className="flex-shrink-0 flex items-center gap-1">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                  title="Save"
                >
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                  ) : (
                    <CheckIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)] transition-colors"
                  title="Cancel"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors"
                title="Edit"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Static info row ──────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] p-4">
      <span className="text-[var(--text-muted)] flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-[var(--text-muted)]">{label}</p>
        <p className={`text-sm font-medium truncate ${valueClass || 'text-[var(--foreground)]'}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteAvatarConfirm, setShowDeleteAvatarConfirm] = useState(false);
  const [showDeleteClientConfirm, setShowDeleteClientConfirm] = useState(false);
  const [showLeaveClientConfirm, setShowLeaveClientConfirm] = useState(false);
  const [processingClient, setProcessingClient] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roleLabels: Record<string, string> = {
    Admin: t('profile.roleAdmin'),
    Staff: t('profile.roleStaff'),
    Client: t('profile.roleClient'),
  };

  if (!user) return null;

  const isOwner = user.client?.role === 'Owner';

  // ── Flash message helper ──
  const flashMsg = (type: 'success' | 'error', text: string) => {
    setAvatarMsg({ type, text });
    setTimeout(() => setAvatarMsg(null), 3000);
  };

  // ── Avatar upload ──
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await fileService.uploadAvatar(file);
      updateUser({ avatarUrl: res.avatarUrl });
      flashMsg('success', t('profile.avatarUpdated'));
    } catch {
      flashMsg('error', t('profile.avatarUpdateError'));
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  // ── Avatar delete ──
  const handleAvatarDelete = async () => {
    setDeleting(true);
    setShowDeleteAvatarConfirm(false);
    try {
      await fileService.deleteAvatar();
      updateUser({ avatarUrl: null });
      flashMsg('success', t('profile.avatarDeleted'));
    } catch {
      flashMsg('error', t('profile.avatarDeleteError'));
    } finally {
      setDeleting(false);
    }
  };

  // ── Save name ──
  const handleSaveName = async (newName: string) => {
    const updated = await userService.updateProfile({ name: newName });
    updateUser({ name: updated.name });
  };

  // ── Save client fields ──
  const makeClientSaver = (field: 'name' | 'description' | 'contactEmail' | 'contactPhone') =>
    async (newValue: string) => {
      if (!user.client) return;
      const updated = await clientService.update(user.client.id, { [field]: newValue });
      updateUser({
        client: {
          ...user.client,
          name: updated.name,
          description: updated.description,
          contactEmail: updated.contactEmail,
          contactPhone: updated.contactPhone,
        },
      });
    };

  // ── Delete entire client (Owner only) ──
  const handleDeleteClient = async () => {
    setShowDeleteClientConfirm(false);
    setProcessingClient(true);
    try {
      await clientService.deleteMyClient();
      updateUser({ hasClient: false, client: undefined });
      router.replace('/setup-client');
    } catch {
      flashMsg('error', t('profile.clientActionError'));
    } finally {
      setProcessingClient(false);
    }
  };

  // ── Leave client (Member only) ──
  const handleLeaveClient = async () => {
    setShowLeaveClientConfirm(false);
    setProcessingClient(true);
    try {
      await clientService.leaveClient();
      updateUser({ hasClient: false, client: undefined });
      router.replace('/setup-client');
    } catch {
      flashMsg('error', t('profile.clientActionError'));
    } finally {
      setProcessingClient(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl animate-fade-in" id="profile-page">
      {/* ── Profile Card ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6">

        {/* Avatar + Name */}
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative group/avatar flex-shrink-0">
            <Avatar
              src={user.avatarUrl ?? undefined}
              name={user.name || user.email}
              size="xl"
              className="ring-2 ring-[var(--border)]"
            />
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || deleting}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/30 disabled:opacity-50"
                title={t('profile.changeAvatar')}
              >
                {uploading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <CameraIcon className="h-4 w-4" />
                )}
              </button>
              {user.avatarUrl && (
                <button
                  onClick={() => setShowDeleteAvatarConfirm(true)}
                  disabled={deleting || uploading}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-red-500/50 disabled:opacity-50"
                  title={t('profile.removeAvatar')}
                >
                  {deleting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          {/* Name + role */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[var(--foreground)] leading-tight">
              {user.name || t('profile.unnamed')}
            </h1>
            <span
              className={`mt-1.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                user.role === 'Admin'
                  ? 'bg-red-500/15 text-red-400'
                  : user.role === 'Staff'
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'bg-emerald-500/15 text-emerald-400'
              }`}
            >
              <ShieldCheckIcon className="h-3.5 w-3.5" />
              {roleLabels[user.role]}
            </span>
          </div>

          {/* Flash message */}
          {avatarMsg && (
            <div
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium animate-fade-in ${
                avatarMsg.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-red-500/15 text-red-400'
              }`}
            >
              {avatarMsg.type === 'success' ? (
                <CheckCircleIcon className="h-4 w-4" />
              ) : (
                <ExclamationCircleIcon className="h-4 w-4" />
              )}
              {avatarMsg.text}
            </div>
          )}
        </div>

        {/* ── Info sections: 2-column for Client, full-width for Admin/Staff ── */}
        <div className={`mt-6 grid grid-cols-1 gap-6 ${user.client ? 'lg:grid-cols-2' : ''}`}>
          {/* Personal Info */}
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--foreground)] mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/15">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-[var(--accent-indigo)]" />
              </span>
              {t('profile.personalInfo')}
            </h2>
            {/* For Admin/Staff (no client): 2-col row grid to fill width */}
            <div className={`grid gap-3 ${!user.client ? 'sm:grid-cols-2' : ''}`}>
              <InfoRow
                icon={<EnvelopeIcon className="h-5 w-5" />}
                label="Email"
                value={user.email}
              />
              <EditableInfoRow
                icon={<ShieldCheckIcon className="h-5 w-5" />}
                label={t('profile.displayName')}
                value={user.name || ''}
                placeholder={t('profile.namePlaceholder')}
                onSave={handleSaveName}
              />
              <InfoRow
                icon={<BuildingOffice2Icon className="h-5 w-5" />}
                label={t('profile.businessProfile')}
                value={user.hasClient ? t('profile.setup') : t('profile.notSetup')}
                valueClass={user.hasClient ? 'text-emerald-400' : 'text-amber-400'}
              />
            </div>
          </div>

          {/* Business Info (Client only) */}
          {user.client && (
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--foreground)] mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/15">
                  <BuildingOffice2Icon className="h-3.5 w-3.5 text-[var(--accent-violet)]" />
                </span>
                {t('profile.businessInfo')}
                {isOwner && (
                  <span className="ml-auto text-[10px] font-normal text-[var(--text-muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full">
                    {t('profile.ownerCanEdit')}
                  </span>
                )}
              </h2>
              <div className="space-y-3">
                <EditableInfoRow
                  icon={<BuildingOffice2Icon className="h-5 w-5" />}
                  label={t('profile.companyName')}
                  value={user.client.name}
                  placeholder={t('profile.companyNamePlaceholder')}
                  onSave={isOwner ? makeClientSaver('name') : undefined}
                  readonly={!isOwner}
                />
                <EditableInfoRow
                  icon={<DocumentTextIcon className="h-5 w-5" />}
                  label={t('profile.description')}
                  value={user.client.description || ''}
                  placeholder={t('profile.descriptionPlaceholder')}
                  onSave={isOwner ? makeClientSaver('description') : undefined}
                  readonly={!isOwner}
                />
                <EditableInfoRow
                  icon={<EnvelopeIcon className="h-5 w-5" />}
                  label={t('profile.contactEmail')}
                  value={user.client.contactEmail || ''}
                  placeholder="contact@company.com"
                  type="email"
                  onSave={isOwner ? makeClientSaver('contactEmail') : undefined}
                  readonly={!isOwner}
                />
                <EditableInfoRow
                  icon={<PhoneIcon className="h-5 w-5" />}
                  label={t('profile.phone')}
                  value={user.client.contactPhone || ''}
                  placeholder="+84 XXX XXX XXX"
                  type="tel"
                  onSave={isOwner ? makeClientSaver('contactPhone') : undefined}
                  readonly={!isOwner}
                />
                {user.client.role && (
                  <InfoRow
                    icon={<ShieldCheckIcon className="h-5 w-5" />}
                    label={t('profile.role')}
                    value={user.client.role === 'Owner' ? t('profile.owner') : t('profile.member')}
                    valueClass={user.client.role === 'Owner' ? 'text-[var(--accent-violet)]' : undefined}
                  />
                )}
                {/* Danger zone — delete/leave org */}
                <div className="mt-4 flex justify-end">
                  {isOwner ? (
                    <button
                      id="delete-client-btn"
                      onClick={() => setShowDeleteClientConfirm(true)}
                      disabled={processingClient}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/10 hover:border-red-500/50 disabled:opacity-50"
                    >
                      {processingClient ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                      ) : (
                        <TrashIcon className="h-3.5 w-3.5" />
                      )}
                      {t('profile.deleteClientBtn')}
                    </button>
                  ) : (
                    <button
                      id="leave-client-btn"
                      onClick={() => setShowLeaveClientConfirm(true)}
                      disabled={processingClient}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 px-4 py-2 text-xs font-semibold text-amber-400 transition-all hover:bg-amber-500/10 hover:border-amber-500/50 disabled:opacity-50"
                    >
                      {processingClient ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                      ) : (
                        <ArrowRightStartOnRectangleIcon className="h-3.5 w-3.5" />
                      )}
                      {t('profile.leaveClientBtn')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Members Panel (Client only) */}
        {user.role === 'Client' && user.client && (
          <div className="mt-6 border-t border-[var(--border)] pt-6">
            <ClientMembersPanel
              clientId={user.client.id}
              currentUserId={user.id}
              isOwner={isOwner}
            />
          </div>
        )}

        {/* Logout */}
        <div className="mt-6 border-t border-[var(--border)] pt-5 flex justify-end">
          <Button
            variant="danger"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
            {t('profile.logout')}
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        onConfirm={logout}
        onCancel={() => setShowLogoutConfirm(false)}
        title={t('confirm.logout.title')}
        description={t('confirm.logout.description')}
        confirmLabel={t('confirm.logout.confirm')}
        variant="warning"
      />

      <ConfirmModal
        open={showDeleteAvatarConfirm}
        onConfirm={handleAvatarDelete}
        onCancel={() => setShowDeleteAvatarConfirm(false)}
        title={t('profile.deleteAvatarTitle')}
        description={t('profile.deleteAvatarDesc')}
        confirmLabel={t('profile.deleteAvatarConfirm')}
        variant="danger"
      />

      <ConfirmModal
        open={showDeleteClientConfirm}
        onConfirm={handleDeleteClient}
        onCancel={() => setShowDeleteClientConfirm(false)}
        title={t('profile.deleteClientTitle')}
        description={t('profile.deleteClientDesc')}
        confirmLabel={t('profile.deleteClientConfirm')}
        variant="danger"
      />

      <ConfirmModal
        open={showLeaveClientConfirm}
        onConfirm={handleLeaveClient}
        onCancel={() => setShowLeaveClientConfirm(false)}
        title={t('profile.leaveClientTitle')}
        description={t('profile.leaveClientDesc')}
        confirmLabel={t('profile.leaveClientConfirm')}
        variant="warning"
      />
    </div>
  );
}
