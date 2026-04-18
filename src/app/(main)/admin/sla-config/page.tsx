'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { slaConfigService } from '@/services/slaConfigApi';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { showErrorToast } from '@/components/ui/ErrorToast';
import { ApiRequestError } from '@/services/requests';
import type { SlaConfigDto } from '@/types';
import {
  ClockIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  FireIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
} from '@heroicons/react/24/outline';

const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'] as const;
const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  Urgent: <FireIcon className="h-5 w-5 text-red-400" />,
  High:   <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />,
  Medium: <ArrowUpCircleIcon className="h-5 w-5 text-blue-400" />,
  Low:    <ArrowDownCircleIcon className="h-5 w-5 text-emerald-400" />,
};
const PRIORITY_COLORS: Record<string, string> = {
  Urgent: 'border-red-500/30 bg-red-500/5',
  High:   'border-orange-500/30 bg-orange-500/5',
  Medium: 'border-blue-500/30 bg-blue-500/5',
  Low:    'border-emerald-500/30 bg-emerald-500/5',
};
const DEFAULT_HOURS: Record<string, number> = {
  Urgent: 4,
  High: 24,
  Medium: 72,
  Low: 168,
};

interface FormItem {
  priority: string;
  deadlineHours: number;
  description: string;
}

export default function SlaConfigPage() {
  const { role } = useAuth();
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<SlaConfigDto[]>([]);
  const [form, setForm] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    slaConfigService
      .getAll()
      .then((data) => {
        setConfigs(data);
        // Build form: if DB has config for a priority, use it; else use defaults
        const items = PRIORITIES.map((p) => {
          const existing = data.find((c) => c.priority === p);
          return {
            priority: p,
            deadlineHours: existing?.deadlineHours ?? DEFAULT_HOURS[p],
            description: existing?.description ?? '',
          };
        });
        setForm(items);
      })
      .catch(() => {
        // No configs yet — use defaults
        setForm(
          PRIORITIES.map((p) => ({
            priority: p,
            deadlineHours: DEFAULT_HOURS[p],
            description: '',
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (role !== 'Admin') {
    return (
      <EmptyState
        icon={<ShieldCheckIcon className="h-8 w-8" />}
        title={t('admin.sla.noPermission', 'Không có quyền')}
        description={t('admin.sla.noPermissionDesc', 'Chỉ Admin mới có thể cấu hình SLA.')}
      />
    );
  }

  const updateField = (index: number, field: keyof FormItem, value: string | number) => {
    setForm((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
    setSaved(false);
  };

  const formatDisplay = (hours: number): string => {
    if (hours < 24) return `${hours} ${t('admin.sla.hours', 'giờ')}`;
    const days = Math.round(hours / 24 * 10) / 10;
    return `${days} ${t('admin.sla.days', 'ngày')} (${hours}h)`;
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const result = await slaConfigService.update({
        configs: form.map((item) => ({
          priority: item.priority,
          deadlineHours: item.deadlineHours,
          description: item.description || undefined,
        })),
      });
      setConfigs(result);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      if (err instanceof ApiRequestError) showErrorToast(err.message);
      else showErrorToast(t('admin.sla.error', 'Lỗi khi lưu cấu hình SLA'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(
      PRIORITIES.map((p) => ({
        priority: p,
        deadlineHours: DEFAULT_HOURS[p],
        description: '',
      }))
    );
    setSaved(false);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="sla-config-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {t('admin.sla.title', 'Cấu hình SLA')}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {t('admin.sla.subtitle', 'Thiết lập thời hạn deadline tự động cho từng mức ưu tiên')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            {t('admin.sla.resetDefault', 'Đặt lại mặc định')}
          </Button>
          <Button variant="gradient" onClick={handleSave} loading={saving}>
            {saved ? (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                {t('admin.sla.saved', 'Đã lưu!')}
              </>
            ) : (
              t('admin.sla.save', 'Lưu cấu hình')
            )}
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="flex items-start gap-3">
          <ClockIcon className="h-5 w-5 flex-shrink-0 text-blue-400 mt-0.5" />
          <div className="text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--foreground)]">{t('admin.sla.howItWorks', 'Cách hoạt động')}</p>
            <p className="mt-1">
              {t('admin.sla.howItWorksDesc', 'Khi Client tạo request mới, hệ thống sẽ tự động đặt deadline dựa trên mức ưu tiên mà Client chọn. Bạn có thể tùy chỉnh thời hạn (số giờ) cho từng mức bên dưới.')}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl animate-shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {form.map((item, index) => (
            <div
              key={item.priority}
              className={`rounded-xl border p-5 transition-all duration-200 hover:shadow-sm ${PRIORITY_COLORS[item.priority]}`}
            >
              <div className="flex items-center gap-3 mb-4">
                {PRIORITY_ICONS[item.priority]}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    {t(`requests.new.priority${item.priority}`, item.priority)}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatDisplay(item.deadlineHours)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                    {t('admin.sla.deadlineHours', 'Thời hạn (giờ)')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={720}
                      step={1}
                      value={item.deadlineHours}
                      onChange={(e) => updateField(index, 'deadlineHours', Number(e.target.value))}
                      className="flex-1 accent-[var(--accent-primary)]"
                    />
                    <input
                      type="number"
                      min={1}
                      max={720}
                      value={item.deadlineHours}
                      onChange={(e) => updateField(index, 'deadlineHours', Math.max(1, Number(e.target.value)))}
                      className="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-center text-[var(--foreground)] outline-none focus:border-[var(--accent-primary)]"
                    />
                    <span className="text-xs text-[var(--text-muted)]">h</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                    {t('admin.sla.description', 'Ghi chú (tùy chọn)')}
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateField(index, 'description', e.target.value)}
                    placeholder={t('admin.sla.descPlaceholder', 'VD: Ticket khẩn cấp cần xử lý ngay')}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-[var(--accent-primary)]" />
          {t('admin.sla.preview', 'Xem trước')}
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
              <th className="pb-2 font-medium">{t('admin.sla.priorityCol', 'Mức ưu tiên')}</th>
              <th className="pb-2 font-medium text-center">{t('admin.sla.deadlineCol', 'Deadline')}</th>
              <th className="pb-2 font-medium text-center">{t('admin.sla.daysCol', 'Ngày')}</th>
              <th className="pb-2 font-medium">{t('admin.sla.noteCol', 'Ghi chú')}</th>
            </tr>
          </thead>
          <tbody>
            {form.map((item) => (
              <tr key={item.priority} className="border-b border-[var(--border)]/50">
                <td className="py-2.5">
                  <span className="flex items-center gap-2">
                    {PRIORITY_ICONS[item.priority]}
                    <span className="font-medium text-[var(--foreground)]">
                      {t(`requests.new.priority${item.priority}`, item.priority)}
                    </span>
                  </span>
                </td>
                <td className="py-2.5 text-center font-mono text-[var(--text-secondary)]">
                  {item.deadlineHours}h
                </td>
                <td className="py-2.5 text-center text-[var(--text-secondary)]">
                  {(item.deadlineHours / 24).toFixed(1)}d
                </td>
                <td className="py-2.5 text-xs text-[var(--text-muted)] truncate max-w-[200px]">
                  {item.description || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
