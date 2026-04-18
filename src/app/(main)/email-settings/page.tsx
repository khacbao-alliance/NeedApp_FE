'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/users';
import type { EmailPreferenceDto } from '@/services/users';
import {
  EnvelopeIcon,
  BellAlertIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentPlusIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

export default function EmailSettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [prefs, setPrefs] = useState<EmailPreferenceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const fetchPrefs = useCallback(async () => {
    try {
      const data = await userService.getEmailPreferences();
      setPrefs(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  const update = async (patch: Partial<EmailPreferenceDto>) => {
    if (!prefs) return;
    const updated = { ...prefs, ...patch };
    setPrefs(updated);
    setSaving(true);
    try {
      await userService.updateEmailPreferences(updated);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch {
      setPrefs(prefs); // revert
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const toggleItems = [
    {
      key: 'onAssignment' as const,
      icon: <BellAlertIcon className="h-5 w-5" />,
      color: 'text-blue-400 bg-blue-500/15',
      label: t('emailSettings.onAssignment', 'Khi được gán yêu cầu'),
      desc: t('emailSettings.onAssignmentDesc', 'Nhận email khi có request mới được gán cho bạn'),
    },
    {
      key: 'onStatusChange' as const,
      icon: <ClockIcon className="h-5 w-5" />,
      color: 'text-violet-400 bg-violet-500/15',
      label: t('emailSettings.onStatusChange', 'Khi trạng thái thay đổi'),
      desc: t('emailSettings.onStatusChangeDesc', 'Nhận email khi trạng thái request thay đổi'),
    },
    {
      key: 'onOverdue' as const,
      icon: <ExclamationTriangleIcon className="h-5 w-5" />,
      color: 'text-red-400 bg-red-500/15',
      label: t('emailSettings.onOverdue', 'Cảnh báo quá hạn'),
      desc: t('emailSettings.onOverdueDesc', 'Nhận email khi request quá deadline'),
    },
    {
      key: 'onNewRequest' as const,
      icon: <DocumentPlusIcon className="h-5 w-5" />,
      color: 'text-emerald-400 bg-emerald-500/15',
      label: t('emailSettings.onNewRequest', 'Request mới'),
      desc: t('emailSettings.onNewRequestDesc', 'Nhận email khi có request mới được tạo'),
    },
  ];

  return (
    <div className="mx-auto max-w-2xl animate-fade-in" id="email-settings-page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <EnvelopeIcon className="h-5 w-5 text-amber-400" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              {t('emailSettings.title', 'Cài đặt Email')}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {t('emailSettings.subtitle', 'Tùy chỉnh loại email thông báo bạn muốn nhận')}
            </p>
          </div>

          {/* Saving indicator */}
          <div className="ml-auto">
            {saving && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] animate-fade-in">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
                {t('emailSettings.saving', 'Đang lưu...')}
              </span>
            )}
            {savedMsg && !saving && (
              <span className="text-xs text-emerald-400 font-medium animate-fade-in">
                ✓ {t('emailSettings.saved', 'Đã lưu')}
              </span>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-12 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
            {t('common.loading')}
          </div>
        </div>
      ) : prefs ? (
        <div className="space-y-4">
          {/* ── Event Notifications ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                {t('emailSettings.eventNotifications', 'Thông báo sự kiện')}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t('emailSettings.eventNotificationsDesc', 'Chọn loại sự kiện bạn muốn nhận email thông báo')}
              </p>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {toggleItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[var(--surface-2)]/50"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${item.color}`}>
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)]">{item.label}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => update({ [item.key]: !prefs[item.key] })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      prefs[item.key]
                        ? 'bg-[var(--accent-primary)]'
                        : 'bg-[var(--surface-3)]'
                    }`}
                    role="switch"
                    aria-checked={prefs[item.key]}
                    id={`toggle-${item.key}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      prefs[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Digest Section ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                {t('emailSettings.digestTitle', 'Email tóm tắt định kỳ')}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t('emailSettings.digestDesc', 'Nhận bản tóm tắt tổng hợp tất cả request đang xử lý')}
              </p>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center gap-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 flex-shrink-0">
                  <CalendarDaysIcon className="h-5 w-5 text-indigo-400" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {t('emailSettings.digestFrequencyLabel', 'Tần suất gửi')}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {prefs.digestFrequency === 'None'
                      ? t('emailSettings.digestOff', 'Bạn chưa bật email tóm tắt')
                      : prefs.digestFrequency === 'Daily'
                      ? t('emailSettings.digestDailyInfo', 'Gửi mỗi ngày lúc 8:00 sáng (UTC)')
                      : t('emailSettings.digestWeeklyInfo', 'Gửi mỗi thứ Hai lúc 8:00 sáng (UTC)')}
                  </p>
                </div>
                <select
                  value={prefs.digestFrequency}
                  onChange={(e) => update({ digestFrequency: e.target.value as 'None' | 'Daily' | 'Weekly' })}
                  className="appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--foreground)] outline-none transition-all focus:border-[var(--accent-indigo)] focus:ring-1 focus:ring-[var(--accent-indigo)]/50 cursor-pointer"
                  id="digest-frequency"
                >
                  <option value="None">{t('emailSettings.digestNone', 'Không gửi')}</option>
                  <option value="Daily">{t('emailSettings.digestDaily', 'Hàng ngày')}</option>
                  <option value="Weekly">{t('emailSettings.digestWeekly', 'Hàng tuần')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Info note */}
          <div className="rounded-xl bg-[var(--surface-2)]/50 border border-[var(--border)]/50 px-5 py-3">
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              💡 {t('emailSettings.note', 'Email mời tham gia tổ chức sẽ luôn được gửi và không thể tắt. Thay đổi được lưu tự động.')}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
