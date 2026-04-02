'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { userService, type CreateUserRequest, type UpdateUserRequest } from '@/services/users';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
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
        title="Không có quyền truy cập"
        description="Chỉ Admin mới có thể quản lý người dùng"
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
      else setError('Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return;
    try {
      await userService.delete(id);
      fetchUsers();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="admin-users-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Người dùng</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Quản lý tất cả người dùng trong hệ thống
          </p>
        </div>
        <Button variant="gradient" onClick={openCreate}>
          <PlusIcon className="h-4 w-4" />
          Thêm người dùng
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Tìm theo email hoặc tên..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-indigo)]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as UserRole | ''); setPage(1); }}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none"
        >
          <option value="">Tất cả roles</option>
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
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Người dùng</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Email</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Role</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Ngày tạo</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]">Thao tác</th>
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
                  <EmptyState title="Không có người dùng" className="py-8" />
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
                  <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)]"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
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
            Hiển thị {data.items.length} / {data.totalCount} người dùng
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
        title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
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
              placeholder="Tối thiểu 6 ký tự"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
              minLength={6}
            />
          )}
          <Input
            id="user-name"
            label="Tên"
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
              Hủy
            </Button>
            <Button variant="gradient" onClick={handleSave} loading={saving}>
              {editingUser ? 'Cập nhật' : 'Tạo'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
