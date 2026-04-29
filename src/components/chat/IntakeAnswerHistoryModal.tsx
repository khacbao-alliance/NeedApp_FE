'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, ClockIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { messageService } from '@/services/messages';
import type { MessageEditHistoryDto } from '@/types';

interface IntakeAnswerHistoryModalProps {
  requestId: string;
  messageId: string;        // the IntakeAnswer message ID
  questionContent: string;  // shown in modal header for context
  onClose: () => void;
  onRestore: (value: string) => void;
}

export function IntakeAnswerHistoryModal({
  requestId,
  messageId,
  questionContent,
  onClose,
  onRestore,
}: IntakeAnswerHistoryModalProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [history, setHistory] = useState<MessageEditHistoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    messageService.getEditHistory(requestId, messageId)
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [requestId, messageId]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] shadow-2xl shadow-black/40 animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4 bg-[var(--surface-2)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex-shrink-0 rounded-lg bg-[var(--accent-primary)]/10 p-2">
                <ClockIcon className="h-4 w-4 text-[var(--accent-primary)]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  {t('chat.intakeForm.historyTitle', 'Lịch sử chỉnh sửa')}
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] truncate">{questionContent}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent-primary)]" />
                <p className="text-sm text-[var(--text-muted)]">{t('common.loading', 'Đang tải...')}</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
                <p className="text-sm text-red-400">{t('common.error', 'Đã xảy ra lỗi')}</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
                <div className="rounded-full bg-[var(--surface-2)] p-4">
                  <ClockIcon className="h-6 w-6 text-[var(--text-muted)]" />
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  {t('chat.intakeForm.noHistory', 'Chưa có lịch sử chỉnh sửa')}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {history.map((entry, idx) => (
                  <li key={entry.id} className="group p-4 hover:bg-[var(--surface-2)] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {/* Version label */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="inline-flex items-center rounded-full bg-[var(--surface-3)] text-[var(--text-muted)] px-1.5 py-0.5 text-[10px] font-semibold">
                            v{history.length - idx}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {formatDate(entry.editedAt, language)}
                          </span>
                          {entry.editedByName && (
                            <span className="text-[10px] text-[var(--text-muted)]">
                              · {entry.editedByName}
                            </span>
                          )}
                        </div>
                        {/* Previous content */}
                        <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed line-clamp-4">
                          {entry.previousContent}
                        </p>
                      </div>
                      {/* Restore button */}
                      <button
                        onClick={() => {
                          onRestore(entry.previousContent);
                          onClose();
                        }}
                        className="flex-shrink-0 flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] hover:border-[var(--accent-primary)]/30 transition-all"
                        title={t('chat.intakeForm.restore', 'Khôi phục')}
                      >
                        <ArrowUturnLeftIcon className="h-3 w-3" />
                        {t('chat.intakeForm.restore', 'Khôi phục')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--border)] px-5 py-3 bg-[var(--surface-2)]">
            <p className="text-[11px] text-[var(--text-muted)] text-center">
              {t('chat.intakeForm.historyNote', 'Lịch sử lưu trên server · Staff và Client đều xem được')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
