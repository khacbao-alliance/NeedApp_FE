'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  XMarkIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface StatusInfo {
  key: string;
  labelKey: string;
  descKey: string;
  color: string;        // text color class
  bg: string;           // background class
  dot: string;          // dot bg class
  canMoveTo: string[];  // status keys this can transition to
}

const STATUSES: StatusInfo[] = [
  {
    key: 'Intake',
    labelKey: 'status.intake',
    descKey: 'guide.status.intakeDesc',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
    dot: 'bg-sky-400',
    canMoveTo: ['Pending'],
  },
  {
    key: 'Pending',
    labelKey: 'status.pending',
    descKey: 'guide.status.pendingDesc',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    dot: 'bg-amber-400',
    canMoveTo: ['InProgress'],
  },
  {
    key: 'MissingInfo',
    labelKey: 'status.missingInfo',
    descKey: 'guide.status.missingInfoDesc',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    dot: 'bg-orange-400',
    canMoveTo: ['InProgress', 'Pending'],
  },
  {
    key: 'InProgress',
    labelKey: 'status.inProgress',
    descKey: 'guide.status.inProgressDesc',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    dot: 'bg-violet-400',
    canMoveTo: ['Done', 'MissingInfo', 'Pending'],
  },
  {
    key: 'Done',
    labelKey: 'status.done',
    descKey: 'guide.status.doneDesc',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-400',
    canMoveTo: ['InProgress'],
  },
];

const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.key, s]));

export function StatusGuide() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  const activeStatus = active ? STATUS_MAP[active] : null;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="group relative flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-indigo-500/40 hover:bg-indigo-500/5 hover:text-indigo-400 hover:shadow-sm hover:shadow-indigo-500/10"
        title={t('guide.title', 'Hướng dẫn trạng thái')}
        id="status-guide-btn"
      >
        {/* Animated sparkle icon */}
        <span className="relative flex h-3.5 w-3.5 items-center justify-center">
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" aria-hidden="true">
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </span>
        {t('guide.triggerLabel', 'Hướng dẫn')}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => { setOpen(false); setActive(null); }}
        />
      )}

      {/* Panel */}
      {open && (
        <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-2xl -translate-y-1/2 animate-fade-in sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 bg-[var(--surface-2)]/50">
              <div>
                <h2 className="text-base font-bold text-[var(--foreground)]">
                  {t('guide.title', 'Hướng dẫn quản lý trạng thái')}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {t('guide.subtitle', 'Nhấn vào từng trạng thái để xem chi tiết và luồng chuyển đổi')}
                </p>
              </div>
              <button
                onClick={() => { setOpen(false); setActive(null); }}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Flow diagram */}
            <div className="p-5 space-y-4">
              {/* Status cards */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {STATUSES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setActive(active === s.key ? null : s.key)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                      active === s.key
                        ? `${s.bg} shadow-md scale-[1.03]`
                        : 'border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] hover:scale-[1.02]'
                    }`}
                  >
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${s.dot}`} />
                    <span className={`text-[11px] font-semibold leading-tight ${active === s.key ? s.color : 'text-[var(--text-secondary)]'}`}>
                      {t(s.labelKey)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Detail panel */}
              {activeStatus ? (
                <div className={`rounded-xl border p-4 space-y-3 animate-fade-in ${activeStatus.bg}`}>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-3 w-3 rounded-full ${activeStatus.dot}`} />
                    <h3 className={`text-sm font-bold ${activeStatus.color}`}>
                      {t(activeStatus.labelKey)}
                    </h3>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {t(activeStatus.descKey)}
                  </p>

                  {activeStatus.canMoveTo.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        {t('guide.canMoveTo', 'Có thể chuyển sang')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {activeStatus.canMoveTo.map((targetKey) => {
                          const target = STATUS_MAP[targetKey];
                          if (!target) return null;
                          return (
                            <button
                              key={targetKey}
                              onClick={() => setActive(targetKey)}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all hover:scale-[1.04] ${target.bg} ${target.color}`}
                            >
                              <ArrowRightIcon className="h-2.5 w-2.5 opacity-70" />
                              {t(target.labelKey)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Default — show complete flow */
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                    {t('guide.flowTitle', 'Luồng trạng thái tiêu chuẩn')}
                  </p>
                  {/* Main flow line */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {(['Intake', 'Pending', 'InProgress', 'Done'] as const).map((key, i, arr) => {
                      const s = STATUS_MAP[key];
                      return (
                        <span key={key} className="flex items-center gap-1">
                          <button
                            onClick={() => setActive(key)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition-all hover:scale-[1.04] ${s.bg} ${s.color}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                            {t(s.labelKey)}
                          </button>
                          {i < arr.length - 1 && (
                            <ArrowRightIcon className="h-3 w-3 text-[var(--text-muted)]" />
                          )}
                        </span>
                      );
                    })}
                  </div>
                  {/* MissingInfo branch */}
                  <div className="flex items-center gap-1 pl-1 mt-1">
                    <span className="text-[10px] text-[var(--text-muted)] italic">
                      {t('guide.branchNote', 'Nhánh:')}
                    </span>
                    {(() => {
                      const ip = STATUS_MAP['InProgress'];
                      const mi = STATUS_MAP['MissingInfo'];
                      return (
                        <>
                          <button onClick={() => setActive('InProgress')} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${ip.bg} ${ip.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${ip.dot}`} />{t(ip.labelKey)}
                          </button>
                          <ArrowRightIcon className="h-3 w-3 text-[var(--text-muted)]" />
                          <button onClick={() => setActive('MissingInfo')} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${mi.bg} ${mi.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${mi.dot}`} />{t(mi.labelKey)}
                          </button>
                          <ArrowRightIcon className="h-3 w-3 text-[var(--text-muted)]" />
                          <button onClick={() => setActive('InProgress')} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${ip.bg} ${ip.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${ip.dot}`} />{t(ip.labelKey)}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Footer tip */}
              <p className="text-[11px] text-[var(--text-muted)] text-center">
                💡 {t('guide.tip', 'Ở chế độ Kanban, kéo thả để chuyển trạng thái. Trạng thái không hợp lệ sẽ bị từ chối tự động.')}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
