'use client';

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
          <p className="text-xs text-[var(--text-muted)]">{label}</p>
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
              {value || <span className="text-[var(--text-muted)] italic">{placeholder || '—'}</span>}
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
      <span className="text-[var(--text-muted)]">{icon}</span>
      <div>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className={`text-sm font-medium ${valueClass || 'text-[var(--foreground)]'}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roleLabels: Record<string, string> = {
    Admin: t('profile.roleAdmin'),
    Staff: t('profile.roleStaff'),
    Client: t('profile.roleClient'),
  };

  if (!user) return null;

  const isOwner = user.client?.role === 'Owner';

  // ── Avatar upload ──
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await fileService.uploadAvatar(file);
      updateUser({ avatarUrl: res.avatarUrl });
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
    e.target.value = '';
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

  return (
    <div className="mx-auto max-w-2xl animate-fade-in" id="profile-page">
      {/* Cover gradient */}
      <div className="relative h-32 rounded-t-2xl bg-gradient-to-r from-[var(--accent-violet)] via-[var(--accent-indigo)] to-[var(--accent-cyan)] opacity-80" />

      {/* Profile Card */}
      <div className="relative -mt-16 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 pt-0">
        {/* Avatar + name header */}
        <div className="flex items-end gap-4 -mt-8">
          <div className="relative">
            <Avatar
              src={user.avatarUrl ?? undefined}
              name={user.name || user.email}
              size="xl"
              className="ring-4 ring-[var(--surface-1)]"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-indigo)] text-white shadow-lg transition-all hover:bg-[var(--accent-violet)] disabled:opacity-50"
            >
              {uploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CameraIcon className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div className="pb-2">
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              {user.name || t('profile.unnamed')}
            </h1>
            <span
              className={`mt-1 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
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
        </div>

        {/* ── Personal Info Section ── */}
        <div className="mt-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] mb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/15">
              <ShieldCheckIcon className="h-3.5 w-3.5 text-[var(--accent-indigo)]" />
            </span>
            {t('profile.personalInfo')}
          </h2>
          <div className="space-y-3 group">
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

        {/* ── Client Info Section ── */}
        {user.client && (
          <div className="mt-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] mb-3">
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
            <div className="space-y-3 group">
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
            </div>
          </div>
        )}

        {/* Members Panel */}
        {user.role === 'Client' && user.client && (
          <div className="mt-6">
            <ClientMembersPanel
              clientId={user.client.id}
              currentUserId={user.id}
              isOwner={isOwner}
            />
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 border-t border-[var(--border)] pt-6">
          <Button
            variant="danger"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full"
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
    </div>
  );
}
