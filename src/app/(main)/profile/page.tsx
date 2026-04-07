'use client';

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { fileService } from '@/services/files';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  CameraIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  ArrowRightStartOnRectangleIcon,
  DocumentTextIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import { ClientMembersPanel } from '@/components/profile/ClientMembersPanel';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roleLabels = {
    Admin: t('profile.roleAdmin'),
    Staff: t('profile.roleStaff'),
    Client: t('profile.roleClient'),
  };

  if (!user) return null;

  const isOwner = user.client?.role === 'Owner';

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

  return (
    <div className="mx-auto max-w-2xl animate-fade-in" id="profile-page">
      {/* Cover gradient */}
      <div className="relative h-32 rounded-t-2xl bg-gradient-to-r from-[var(--accent-violet)] via-[var(--accent-indigo)] to-[var(--accent-cyan)] opacity-80" />

      {/* Profile Card */}
      <div className="relative -mt-16 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 pt-0">
        {/* Avatar */}
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
              className={`mt-1 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${user.role === 'Admin'
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

        {/* Personal Info */}
        <div className="mt-6 space-y-4">
          <InfoRow
            icon={<EnvelopeIcon className="h-5 w-5" />}
            label="Email"
            value={user.email}
          />
          <InfoRow
            icon={<BuildingOffice2Icon className="h-5 w-5" />}
            label={t('profile.businessProfile')}
            value={user.hasClient ? t('profile.setup') : t('profile.notSetup')}
            valueClass={user.hasClient ? 'text-emerald-400' : 'text-amber-400'}
          />
        </div>

        {/* Client Info */}
        {user.client && (
          <div className="mt-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] mb-3">
              <BuildingOffice2Icon className="h-4 w-4 text-[var(--accent-violet)]" />
              {t('profile.businessInfo')}
            </h2>
            <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
              <InfoRow
                icon={<BuildingOffice2Icon className="h-5 w-5" />}
                label={t('profile.companyName')}
                value={user.client.name}
              />
              {user.client.description && (
                <InfoRow
                  icon={<DocumentTextIcon className="h-5 w-5" />}
                  label={t('profile.description')}
                  value={user.client.description}
                />
              )}
              {user.client.contactEmail && (
                <InfoRow
                  icon={<EnvelopeIcon className="h-5 w-5" />}
                  label={t('profile.contactEmail')}
                  value={user.client.contactEmail}
                />
              )}
              {user.client.contactPhone && (
                <InfoRow
                  icon={<PhoneIcon className="h-5 w-5" />}
                  label={t('profile.phone')}
                  value={user.client.contactPhone}
                />
              )}
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

        {/* Members Panel — only for Client users who belong to a client */}
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
            onClick={logout}
            className="w-full"
          >
            <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
            {t('profile.logout')}
          </Button>
        </div>
      </div>
    </div>
  );
}

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
        <p className={`text-sm font-medium ${valueClass || 'text-[var(--foreground)]'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
