'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useConversationSummary } from '@/hooks/useConversationSummary';
import type {
  ConversationSummaryDto,
  ConversationOverviewDto,
  IntakeSummaryDto,
  MissingInfoSummaryDto,
  AttachmentSummaryDto,
} from '@/types';
import {
  XMarkIcon,
  ArrowPathIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  ClockIcon,
  SparklesIcon,
  ClipboardDocumentListIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  PhotoIcon,
  DocumentIcon,
  TableCellsIcon,
  ArchiveBoxIcon,
  CogIcon,
  UsersIcon,
  CheckIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string, language: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(iso: string | null, language: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(contentType: string | null): React.ReactNode {
  const cls = 'h-4 w-4 text-[var(--text-muted)]';
  if (!contentType) return <DocumentIcon className={cls} />;
  if (contentType.startsWith('image/')) return <PhotoIcon className={cls} />;
  if (contentType === 'application/pdf') return <BookOpenIcon className={cls} />;
  if (contentType.includes('word') || contentType.includes('document')) return <DocumentTextIcon className={cls} />;
  if (contentType.includes('sheet') || contentType.includes('excel')) return <TableCellsIcon className={cls} />;
  if (contentType.includes('zip') || contentType.includes('rar')) return <ArchiveBoxIcon className={cls} />;
  return <DocumentIcon className={cls} />;
}

function roleBadgeClass(role: string | null): string {
  if (role === 'Admin') return 'text-red-400 bg-red-500/10';
  if (role === 'Staff') return 'text-violet-400 bg-violet-500/10';
  return 'text-cyan-400 bg-cyan-500/10';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
      <span className="text-[var(--accent-violet)]">{icon}</span>
      <span className="text-sm font-semibold text-[var(--foreground)]">{title}</span>
      {badge && <span className="ml-auto">{badge}</span>}
    </div>
  );
}

// ── Overview ──
function OverviewSection({ overview }: { overview: ConversationOverviewDto }) {
  const { t, i18n } = useTranslation();

  const roleLabel = (role: string | null) => {
    if (role === 'Admin') return 'Admin';
    if (role === 'Staff') return 'Staff';
    if (role === 'Client') return t('summary.roleClient');
    return role ?? '—';
  };

  const iconCls = 'h-4 w-4 text-[var(--accent-primary)]';
  const stats = [
    { label: t('summary.messages'), value: overview.totalMessages, icon: <ChatBubbleLeftRightIcon className={iconCls} /> },
    { label: t('summary.files'), value: overview.totalFilesSent, icon: <PaperClipIcon className={iconCls} /> },
    { label: t('summary.system'), value: overview.totalSystemMessages, icon: <CogIcon className={iconCls} /> },
    { label: t('summary.participants'), value: overview.participants.length, icon: <UsersIcon className={iconCls} /> },
  ];

  return (
    <SectionCard>
      <SectionHeader
        icon={<UserGroupIcon className="h-4 w-4" />}
        title={t('summary.overview')}
      />
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {stats.map((item) => (
            <div key={item.label} className="rounded-lg bg-[var(--surface-2)] px-3 py-2 flex items-center gap-2">
              <span className="flex-shrink-0">{item.icon}</span>
              <div>
                <div className="text-xs text-[var(--text-muted)]">{item.label}</div>
                <div className="text-sm font-bold text-[var(--foreground)]">{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        {(overview.firstMessageAt || overview.lastMessageAt) && (
          <div className="rounded-lg bg-[var(--surface-2)] px-3 py-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <ClockIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{formatDateShort(overview.firstMessageAt, i18n.language)} → {formatDateShort(overview.lastMessageAt, i18n.language)}</span>
          </div>
        )}

        {overview.participants.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{t('summary.participants')}</div>
            {overview.participants.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-[10px] font-bold text-[var(--foreground)]">
                  {(p.name ?? '?').charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-[var(--foreground)] flex-1 truncate">{p.name ?? t('summary.unknown')}</span>
                <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-medium ${roleBadgeClass(p.role)}`}>
                  {roleLabel(p.role)}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">{t('summary.messagesCount', { count: p.messageCount })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ── AI Summary ──
function AiSummarySection({ text }: { text: string }) {
  const { t } = useTranslation();
  const paragraphs = text.split('\n').filter((l) => l.trim());

  function renderLine(line: string) {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} className="font-semibold text-[var(--foreground)]">{part}</strong>
        : <span key={i}>{part}</span>
    );
  }

  return (
    <SectionCard>
      <SectionHeader
        icon={<SparklesIcon className="h-4 w-4" />}
        title={t('summary.aiSummary')}
        badge={
          <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-violet-500/15 text-violet-400 border border-violet-500/20">
            Gemini
          </span>
        }
      />
      <div className="p-4 space-y-2">
        {paragraphs.map((para, i) => (
          <p key={i} className="text-xs leading-relaxed text-[var(--text-secondary)]">
            {renderLine(para)}
          </p>
        ))}
      </div>
    </SectionCard>
  );
}

// ── Intake Q&A ──
function IntakeSection({ data }: { data: IntakeSummaryDto }) {
  const { t } = useTranslation();
  const allAnswered = data.answeredQuestions === data.totalQuestions;
  return (
    <SectionCard>
      <SectionHeader
        icon={<ClipboardDocumentListIcon className="h-4 w-4" />}
        title={t('summary.intakeTitle')}
        badge={
          <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${allAnswered ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'}`}>
            {data.answeredQuestions}/{data.totalQuestions}
            {allAnswered && <CheckIcon className="ml-0.5 inline h-3 w-3" />}
          </span>
        }
      />
      <div className="divide-y divide-[var(--border)]">
        {data.questionsAndAnswers.map((qa, i) => (
          <div key={i} className="px-4 py-3 space-y-1">
            <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1">
              <span className="text-violet-400">Q{i + 1}</span>
              <span className="flex-1">{qa.question}</span>
            </div>
            <div className={`text-xs leading-relaxed ${qa.answer ? 'text-[var(--foreground)]' : 'italic text-[var(--text-muted)]'}`}>
              {qa.answer ?? t('summary.unanswered')}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ── Missing Info ──
function MissingInfoSection({ items }: { items: MissingInfoSummaryDto[] }) {
  const { t, i18n } = useTranslation();
  return (
    <SectionCard>
      <SectionHeader
        icon={<ExclamationCircleIcon className="h-4 w-4 text-amber-400" />}
        title={t('summary.missingInfo')}
        badge={
          <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-amber-500/10 text-amber-400">
            {items.length}
          </span>
        }
      />
      <div className="divide-y divide-[var(--border)]">
        {items.map((item, i) => (
          <div key={i} className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-medium text-[var(--foreground)]">{item.requestedBy ?? 'Staff'}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[var(--text-muted)]">{formatDate(item.requestedAt, i18n.language)}</span>
                {item.isResolved ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400">
                    <CheckCircleIcon className="h-3 w-3" />
                    {t('summary.resolved')}
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400">{t('summary.waiting')}</span>
                )}
              </div>
            </div>
            {item.content && (
              <p className="text-xs text-[var(--text-secondary)] italic">{item.content}</p>
            )}
            {item.questions.length > 0 && (
              <ul className="space-y-0.5">
                {item.questions.map((q, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-xs text-[var(--text-muted)]">
                    <span className="mt-0.5 text-amber-400 flex-shrink-0">•</span>
                    {q}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}


// ── Attachments ──
function AttachmentsSection({ attachments }: { attachments: AttachmentSummaryDto[] }) {
  const { t, i18n } = useTranslation();
  return (
    <SectionCard>
      <SectionHeader
        icon={<PaperClipIcon className="h-4 w-4" />}
        title={t('summary.attachments')}
        badge={
          <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-[var(--surface-3)] text-[var(--text-muted)]">
            {attachments.length}
          </span>
        }
      />
      <div className="divide-y divide-[var(--border)] group">
        {attachments.map((a) => (
          <a 
            key={a.id} 
            href={a.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors group/item block w-full text-left"
          >
            <span className="flex-shrink-0">{fileIcon(a.contentType)}</span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-[var(--foreground)] truncate group-hover/item:text-[var(--accent-primary)] transition-colors">{a.fileName}</div>
              <div className="text-[10px] text-[var(--text-muted)]">
                {formatFileSize(a.fileSize)} · {a.uploadedBy ?? t('summary.unknown')} · {formatDate(a.uploadedAt, i18n.language)}
              </div>
            </div>
          </a>
        ))}
      </div>
    </SectionCard>
  );
}

// ── Skeleton ──
function SummarySkeletonLoader() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
        <div className="h-10 bg-[var(--surface-2)]" />
        <div className="p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-[var(--surface-2)]" />
            ))}
          </div>
          <div className="h-8 rounded-lg bg-[var(--surface-2)]" />
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => <div key={i} className="h-6 rounded bg-[var(--surface-2)]" />)}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
        <div className="h-10 bg-[var(--surface-2)]" />
        <div className="p-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`h-3 rounded bg-[var(--surface-2)] ${i === 4 ? 'w-3/4' : 'w-full'}`} />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
        <div className="h-10 bg-[var(--surface-2)]" />
        <div className="divide-y divide-[var(--border)]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-4 py-3 space-y-1.5">
              <div className="h-3 w-2/3 rounded bg-[var(--surface-2)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--surface-2)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Full Summary Content ──
function SummaryContent({ summary }: { summary: ConversationSummaryDto }) {
  const { t, i18n } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--border)] bg-gradient-to-br from-violet-500/5 to-cyan-500/5 px-4 py-3">
        <div className="text-sm font-semibold text-[var(--foreground)] truncate">{summary.requestTitle}</div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span>ID: {summary.requestId.slice(0, 8)}…</span>
          <span className="text-[var(--accent-violet)]">·</span>
          <span>{t('summary.createdAt', { date: formatDate(summary.generatedAt, i18n.language) })}</span>
        </div>
      </div>

      <OverviewSection overview={summary.overview} />

      {summary.aiSummary ? (
        <AiSummarySection text={summary.aiSummary} />
      ) : (
        <SectionCard>
          <SectionHeader icon={<SparklesIcon className="h-4 w-4" />} title={t('summary.aiSummary')} />
          <div className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
            {t('summary.aiUnavailable')}
          </div>
        </SectionCard>
      )}

      {summary.intakeSummary && (
        <IntakeSection data={summary.intakeSummary} />
      )}

      {summary.missingInfoRequests.length > 0 && (
        <MissingInfoSection items={summary.missingInfoRequests} />
      )}

      {summary.attachments.length > 0 && (
        <AttachmentsSection attachments={summary.attachments} />
      )}

      {summary.overview.totalMessages === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-10 text-center">
          <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">{t('summary.noMessages')}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Drawer Component ────────────────────────────────────────────────────

interface ConversationSummaryDrawerProps {
  requestId: string;
  onClose: () => void;
}

export function ConversationSummaryDrawer({ requestId, onClose }: ConversationSummaryDrawerProps) {
  const { t } = useTranslation();
  const { summary, isLoading, error, fetchSummary } = useConversationSummary(requestId);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={handleBackdropClick}
    >
      <div
        ref={drawerRef}
        className="relative flex flex-col h-full w-full max-w-md bg-[var(--background)] border-l border-[var(--border)] shadow-2xl"
        style={{ animation: 'slideInRight 0.22s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Drawer Header */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 flex-shrink-0">
          <SparklesIcon className="h-5 w-5 text-[var(--accent-violet)]" />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">{t('summary.title')}</h2>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{t('summary.powered')}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchSummary}
              disabled={isLoading}
              title={t('summary.refresh')}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <SummarySkeletonLoader />
          ) : error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-8 text-center space-y-3">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={fetchSummary}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 text-xs text-red-400 transition-colors"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
                {t('summary.retry')}
              </button>
            </div>
          ) : summary ? (
            <SummaryContent summary={summary} />
          ) : null}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0.4; }
          to   { transform: translateX(0);    opacity: 1;   }
        }
      ` }} />
    </div>
  );
}
