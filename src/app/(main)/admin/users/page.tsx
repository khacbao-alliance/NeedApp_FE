'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { userService, type CreateUserRequest, type UpdateUserRequest } from '@/services/users';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ApiRequestError } from '@/services/requests';
import type { UserDetailDto, UserRole, PaginatedResponse } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const roleOptions = [
  { value: 'Client', label: 'Client' },
  { value: 'Staff', label: 'Staff' },
  { value: 'Admin', label: 'Admin' },
];

const roleColors: Record<UserRole, string> = {
  Admin: 'bg-red-500/15 text-red-400',
  Staff: 'bg-blue-500/15 text-blue-400',
  Client: 'bg-emerald-500/15 text-emerald-400',
};

export default function AdminUsersPage() {
  const { role } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [data, setData] = useState<PaginatedResponse<UserDetailDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [page, setPage] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDetailDto | null>(null);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'Staff' as UserRole });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await userService.list({
        page,
        pageSize: 10,
        search: search || undefined,
        role: roleFilter || undefined,
      });
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter]);

  // Access control
  if (role !== 'Admin') {
    return (
      <EmptyState
        icon={<UserGroupIcon className="h-8 w-8" />}
        title={t('admin.users.noPermission')}
        description={t('admin.users.noPermissionDesc')}
      />
    );
  }

  const openCreate = () => {
    setEditingUser(null);
    setForm({ email: '', password: '', name: '', role: 'Staff' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (u: UserDetailDto) => {
    setEditingUser(u);
    setForm({ email: u.email, password: '', name: u.name || '', role: u.role });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      if (editingUser) {
        await userService.update(editingUser.id, {
          name: form.name || undefined,
          role: form.role,
        });
      } else {
        await userService.create({
          email: form.email,
          password: form.password,
          name: form.name,
          role: form.role,
        });
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else setError(t('admin.users.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await userService.delete(id);
      setDeleteConfirmId(null);
      fetchUsers();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="admin-users-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('admin.users.title')}</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {t('admin.users.subtitle')}
          </p>
        </div>
        <Button variant="gradient" onClick={openCreate}>
          <PlusIcon className="h-4 w-4" />
          {t('admin.users.addUser')}
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={t('admin.users.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-indigo)]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as UserRole | ''); setPage(1); }}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-4 pr-10 py-2.5 text-sm text-[var(--foreground)] outline-none appearance-none bg-[url('data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20fill=%27none%27%20viewBox=%270%200%2020%2020%27%3e%3cpath%20stroke=%27%236b7280%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%20stroke-width=%271.5%27%20d=%27M6%208l4%204%204-4%27/%3e%3c/svg%3e')] bg-[length:1.5em_1.5em] bg-[right_0.75rem_center] bg-no-repeat"
        >
          <option value="">{t('admin.users.allRoles')}</option>
          {roleOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-1)]">
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">{t('admin.users.colUser')}</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">{t('admin.users.colEmail')}</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">{t('admin.users.colRole')}</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">{t('admin.users.colDate')}</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]">{t('admin.users.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-8 animate-shimmer rounded" />
                  </td>
                </tr>
              ))
            ) : !data?.items.length ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState title={t('admin.users.noUsers')} className="py-8" />
                </td>
              </tr>
            ) : (
              data.items.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[var(--border)] bg-[var(--surface-1)] transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatarUrl ?? undefined} name={u.name || u.email} size="sm" />
                      <span className="font-medium text-[var(--foreground)]">{u.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${roleColors[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(u.createdAt, language)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)]"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(u.id)}
                        className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-[var(--text-muted)]">
            {t('admin.users.showing', { count: data.items.length, total: data.totalCount })}
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

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? t('admin.users.editTitle') : t('admin.users.createTitle')}
      >
        <div className="space-y-4">
          {!editingUser && (
            <Input
              id="user-email"
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          )}
          {!editingUser && (
            <PasswordInput
              id="user-password"
              label="Mật khẩu"
              placeholder={t('admin.users.passwordHint')}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
              minLength={6}
            />
          )}
          <Input
            id="user-name"
            label={t('admin.users.nameLabel')}
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Select
            id="user-role"
            label="Role"
            options={roleOptions}
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
          />

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="gradient" onClick={handleSave} loading={saving}>
              {editingUser ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteConfirmId}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
        title={t('confirm.deleteUser.title')}
        description={t('confirm.deleteUser.description')}
        confirmLabel={t('confirm.deleteUser.confirm')}
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
