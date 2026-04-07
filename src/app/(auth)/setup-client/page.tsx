'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { clientService } from '@/services/clients';
import { invitationService } from '@/services/invitations';
import { authService } from '@/services/auth';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ApiRequestError } from '@/services/requests';
import type { PendingInvitationDto } from '@/types';
import {
  BuildingOffice2Icon,
  EnvelopeOpenIcon,
  PlusCircleIcon,
  ArrowPathIcon,
  ArrowRightStartOnRectangleIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

type Tab = 'create' | 'invitations';

export default function SetupClientPage() {
  const { t } = useTranslation();
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('create');

  // ── Create form state ──
  const [form, setForm] = useState({
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  // ── Invitation tab state ──
  const [invitations, setInvitations] = useState<PendingInvitationDto[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respondAction, setRespondAction] = useState<'accept' | 'decline' | null>(null);
  const [invError, setInvError] = useState('');

  const fetchInvitations = useCallback(async () => {
    setLoadingInvitations(true);
    setInvError('');
    try {
      const data = await invitationService.getPending();
      setInvitations(data);
      // Auto-switch to invitations tab if there are any
      if (data.length > 0) {
        setTab('invitations');
      }
    } catch {
      // Silently fail — user just sees empty state
    } finally {
      setLoadingInvitations(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      await clientService.create({
        name: form.name,
        description: form.description || undefined,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
      });
      const me = await authService.me();
      updateUser(me);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        if (err.errors) setFieldErrors(err.errors);
      } else {
        setError(t('auth.setupClient.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (invitationId: string, accept: boolean) => {
    setRespondingId(invitationId);
    setRespondAction(accept ? 'accept' : 'decline');
    setInvError('');
    try {
      await invitationService.respond(invitationId, accept);
      if (accept) {
        // User accepted → refresh user data and go to dashboard
        const me = await authService.me();
        updateUser(me);
        router.push('/dashboard');
      } else {
        // User declined → remove from list
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      }
    } catch {
      setInvError(
        accept
          ? t('auth.setupClient.acceptError')
          : t('auth.setupClient.declineError')
      );
    } finally {
      setRespondingId(null);
      setRespondAction(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const invitationCount = invitations.length;

  return (
    <div className="mx-auto w-full max-w-lg animate-slide-up" id="setup-client-page">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-8 shadow-xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-violet)]/15 to-[var(--accent-indigo)]/15">
            <BuildingOffice2Icon className="h-8 w-8 text-[var(--accent-violet)]" />
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">
            {t('auth.setupClient.title')}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            {t('auth.setupClient.subtitle')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-6 flex rounded-xl bg-[var(--surface-2)] p-1 gap-1" id="setup-tab-switcher">
          <button
            type="button"
            id="tab-create"
            onClick={() => setTab('create')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
              tab === 'create'
                ? 'bg-[var(--surface-1)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <PlusCircleIcon className="h-4 w-4" />
            {t('auth.setupClient.tabCreate')}
          </button>
          <button
            type="button"
            id="tab-invitations"
            onClick={() => { setTab('invitations'); fetchInvitations(); }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 relative ${
              tab === 'invitations'
                ? 'bg-[var(--surface-1)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <EnvelopeOpenIcon className="h-4 w-4" />
            {t('auth.setupClient.tabWait')}
            {invitationCount > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent-violet)] px-1.5 text-[10px] font-bold text-white">
                {invitationCount}
              </span>
            )}
          </button>
        </div>

        {/* ─── Tab: Create Organization ─── */}
        {tab === 'create' && (
          <div className="animate-fade-in">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                {t('auth.setupClient.createTitle')}
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {t('auth.setupClient.createSubtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" id="setup-client-form">
              <Input
                id="client-name"
                name="name"
                label={t('auth.setupClient.companyName')}
                placeholder={t('auth.setupClient.companyNameHint')}
                value={form.name}
                onChange={handleChange}
                required
                error={fieldErrors['Name']?.[0]}
              />

              <Textarea
                id="client-description"
                name="description"
                label={t('auth.setupClient.description')}
                placeholder={t('auth.setupClient.descriptionHint')}
                value={form.description}
                onChange={handleChange}
                rows={3}
                error={fieldErrors['Description']?.[0]}
              />

              <Input
                id="client-email"
                name="contactEmail"
                type="email"
                label={t('auth.setupClient.contactEmail')}
                placeholder="contact@company.com"
                value={form.contactEmail}
                onChange={handleChange}
                error={fieldErrors['ContactEmail']?.[0]}
              />

              <Input
                id="client-phone"
                name="contactPhone"
                label={t('auth.setupClient.phone')}
                placeholder="0901234567"
                value={form.contactPhone}
                onChange={handleChange}
                error={fieldErrors['ContactPhone']?.[0]}
              />

              {error && !Object.keys(fieldErrors).length && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button type="submit" loading={loading} variant="gradient" className="w-full mt-2" id="setup-client-submit">
                {t('auth.setupClient.submit')}
              </Button>
            </form>
          </div>
        )}

        {/* ─── Tab: Invitations ─── */}
        {tab === 'invitations' && (
          <div className="animate-fade-in">
            {/* Loading state */}
            {loadingInvitations && (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-violet)] border-t-transparent" />
              </div>
            )}

            {/* Has invitations */}
            {!loadingInvitations && invitations.length > 0 && (
              <>
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-[var(--foreground)]">
                    {t('auth.setupClient.invitationsTitle')}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {t('auth.setupClient.invitationsSubtitle')}
                  </p>
                </div>

                {invError && (
                  <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                    <p className="text-sm text-red-400">{invError}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition-all hover:border-[var(--accent-violet)]/30"
                      id={`invitation-${inv.id}`}
                    >
                      {/* Client info */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-indigo)]/10">
                          <UserGroupIcon className="h-5 w-5 text-[var(--accent-indigo)]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-[var(--foreground)] truncate">
                            {inv.client.name}
                          </h3>
                          {inv.client.description && (
                            <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
                              {inv.client.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mb-3">
                        <span>
                          {t('auth.setupClient.invitedBy')}: <span className="text-[var(--text-secondary)]">{inv.invitedBy.name || inv.invitedBy.email}</span>
                        </span>
                        <span>
                          {t('auth.setupClient.roleLabel')}: <span className="text-[var(--text-secondary)]">
                            {inv.role === 'Owner' ? t('auth.setupClient.roleOwner') : t('auth.setupClient.roleMember')}
                          </span>
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={respondingId === inv.id}
                          onClick={() => handleRespond(inv.id, true)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent-violet)] px-3 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--accent-violet)]/80 disabled:opacity-50"
                          id={`accept-${inv.id}`}
                        >
                          {respondingId === inv.id && respondAction === 'accept' ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <CheckIcon className="h-4 w-4" />
                          )}
                          {respondingId === inv.id && respondAction === 'accept'
                            ? t('auth.setupClient.accepting')
                            : t('auth.setupClient.accept')}
                        </button>
                        <button
                          type="button"
                          disabled={respondingId === inv.id}
                          onClick={() => handleRespond(inv.id, false)}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-all hover:border-red-500/30 hover:text-red-400 disabled:opacity-50"
                          id={`decline-${inv.id}`}
                        >
                          {respondingId === inv.id && respondAction === 'decline' ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <XMarkIcon className="h-4 w-4" />
                          )}
                          {respondingId === inv.id && respondAction === 'decline'
                            ? t('auth.setupClient.declining')
                            : t('auth.setupClient.decline')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* No invitations */}
            {!loadingInvitations && invitations.length === 0 && (
              <div className="text-center py-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-2)]">
                  <EnvelopeOpenIcon className="h-7 w-7 text-[var(--text-muted)]" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  {t('auth.setupClient.noInvitations')}
                </h3>
                <p className="mt-1.5 text-xs text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
                  {t('auth.setupClient.noInvitationsDesc')}
                </p>
              </div>
            )}

            {/* Bottom actions */}
            <div className="mt-5 flex flex-col gap-3">
              <Button
                variant="gradient"
                className="w-full"
                loading={loadingInvitations}
                onClick={fetchInvitations}
                id="refresh-invitations-btn"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${loadingInvitations ? 'animate-spin' : ''}`} />
                {t('auth.setupClient.refresh')}
              </Button>

              <button
                type="button"
                onClick={() => setTab('create')}
                className="text-sm text-[var(--accent-violet)] hover:text-[var(--accent-cyan)] transition-colors text-center py-2"
                id="switch-to-create-btn"
              >
                {t('auth.setupClient.orCreate')}
              </button>
            </div>
          </div>
        )}

        {/* Logout link */}
        <div className="mt-6 pt-4 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full text-sm text-[var(--text-muted)] hover:text-red-400 transition-colors py-1"
            id="setup-logout-btn"
          >
            <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
            {t('auth.setupClient.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
