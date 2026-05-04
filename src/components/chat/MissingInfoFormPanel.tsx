'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { MessageDto, MissingInfoMetadata } from '@/types';

interface MissingInfoQuestion {
  id: string;
  question: string;
  answered: boolean;
  answer?: string;
}

interface MissingInfoFormPanelProps {
  messages: MessageDto[];
  requestId: string;
  isOpen: boolean;
  onClose: () => void;
  isReadOnly?: boolean;
  onAnswer: (messageId: string, questionId: string, answer: string) => Promise<void>;
}

function parseMissingInfoData(messages: MessageDto[]): {
  messageId: string;
  content: string | null;
  questions: MissingInfoQuestion[];
  senderName: string | null;
} | null {
  // Find the latest MissingInfo message
  const missingInfoMsg = [...messages]
    .reverse()
    .find((m) => m.type === 'MissingInfo');

  if (!missingInfoMsg) return null;

  const meta = missingInfoMsg.metadata as MissingInfoMetadata | null;
  if (!meta?.questions) return null;

  return {
    messageId: missingInfoMsg.id,
    content: missingInfoMsg.content,
    questions: meta.questions.map((q) => ({
      id: q.id,
      question: q.question,
      answered: q.answered,
      answer: q.answer,
    })),
    senderName: missingInfoMsg.sender?.name || null,
  };
}

// ── Single Question Card ────────────────────────────────────────────────────
interface QuestionCardProps {
  question: MissingInfoQuestion;
  questionNumber: number;
  isReadOnly?: boolean;
  onSubmit: (answer: string) => Promise<void>;
}

function QuestionCard({ question, questionNumber, isReadOnly, onSubmit }: QuestionCardProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState('');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback((ta: HTMLTextAreaElement) => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, []);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      autoResize(textareaRef.current);
    }
  }, [isEditing, autoResize]);

  const handleStartEdit = () => {
    setDraftValue(question.answer || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDraftValue('');
  };

  const handleSave = async () => {
    const trimmed = draftValue.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSubmit(trimmed);
      setIsEditing(false);
      setDraftValue('');
    } catch {
      // keep editing on error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={cn(
        'group rounded-xl border transition-all duration-200',
        isReadOnly
          ? 'border-[var(--border)] bg-[var(--surface-2)] opacity-80'
          : question.answered
          ? isEditing
            ? 'border-amber-500/50 bg-amber-500/5 shadow-sm shadow-amber-500/5'
            : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border)]/80'
          : 'border-amber-500/20 bg-[var(--surface-2)]'
      )}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <span
            className={cn(
              'flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold mt-0.5',
              question.answered && !isEditing
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-amber-500/10 text-amber-400'
            )}
          >
            {question.answered && !isEditing ? (
              <CheckIcon className="h-3.5 w-3.5" />
            ) : (
              questionNumber
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--foreground)] leading-snug">
              {question.question}
            </p>
          </div>
        </div>

        {/* Edit button for answered state */}
        {question.answered && !isEditing && !isReadOnly && (
          <button
            onClick={handleStartEdit}
            title={t('common.edit', 'Chỉnh sửa')}
            className="rounded-lg p-1.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-all"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Answered content (view mode) */}
      {question.answered && !isEditing && (
        <div className="px-4 pb-3.5">
          <div className="rounded-lg bg-[var(--surface-1)] border border-[var(--border)] px-3 py-2.5">
            <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
              {question.answer}
            </p>
          </div>
        </div>
      )}

      {/* Textarea (new answer or edit mode) */}
      {(!question.answered || isEditing) && !isReadOnly && (
        <div className="px-4 pb-3.5">
          <textarea
            ref={textareaRef}
            value={draftValue}
            onChange={(e) => {
              setDraftValue(e.target.value);
              autoResize(e.target);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
              if (e.key === 'Escape' && isEditing) handleCancelEdit();
            }}
            disabled={saving}
            rows={2}
            placeholder={t('chat.missingInfo.answerPlaceholder', 'Nhập câu trả lời...')}
            className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 disabled:opacity-60"
          />

          <div className="flex items-center justify-end gap-1.5 mt-2">
            {isEditing && (
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-3)] transition-colors"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
                {t('common.cancel', 'Hủy')}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !draftValue.trim()}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                saving || !draftValue.trim()
                  ? 'bg-[var(--surface-3)] text-[var(--text-muted)] cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 shadow-sm shadow-amber-500/20'
              )}
            >
              {saving ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : isEditing ? (
                <CheckIcon className="h-3.5 w-3.5" />
              ) : (
                <PaperAirplaneIcon className="h-3.5 w-3.5" />
              )}
              {saving
                ? t('chat.intakeForm.saving', 'Đang lưu...')
                : isEditing
                ? t('common.save', 'Lưu')
                : t('chat.intakeForm.submitAnswer', 'Gửi')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MissingInfoFormPanel({
  messages,
  requestId,
  isOpen,
  onClose,
  isReadOnly,
  onAnswer,
}: MissingInfoFormPanelProps) {
  const { t } = useTranslation();
  const data = parseMissingInfoData(messages);

  if (!data || !isOpen) return null;

  const { messageId, content, questions, senderName } = data;
  const answeredCount = questions.filter((q) => q.answered).length;
  const totalCount = questions.length;
  const progress = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto w-full md:max-w-[600px] max-h-[90vh] md:max-h-[80vh] bg-[var(--surface-1)] md:rounded-2xl rounded-t-2xl border border-[var(--border)] shadow-2xl shadow-black/30 flex flex-col animate-slide-up overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-2)] flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {answeredCount === totalCount ? (
                <div className="flex-shrink-0 rounded-xl bg-emerald-500/10 p-2">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                </div>
              ) : (
                <div className="flex-shrink-0 rounded-xl bg-amber-500/10 p-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {t('chat.missingInfo.title', 'Yêu cầu bổ sung thông tin')}
                </p>
                {senderName && (
                  <p className="text-[11px] text-[var(--text-muted)] font-normal">
                    {t('chat.missingInfo.requestedBy', 'Yêu cầu bởi {{name}}', { name: senderName })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                answeredCount === totalCount
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              )}>
                {answeredCount === totalCount && (
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                )}
                {answeredCount}/{totalCount}
              </span>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-[var(--surface-3)] flex-shrink-0">
            <div
              className="h-full bg-amber-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content description */}
          {content && (
            <div className="px-5 py-3 border-b border-[var(--border)] bg-amber-500/5">
              <p className="text-sm text-[var(--foreground)] leading-relaxed">{content}</p>
            </div>
          )}

          {/* Question cards — scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-2.5">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                questionNumber={idx + 1}
                isReadOnly={isReadOnly}
                onSubmit={async (answer) => {
                  await onAnswer(messageId, q.id, answer);
                }}
              />
            ))}

            {answeredCount === totalCount && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center animate-fade-in mt-4">
                <p className="text-sm font-medium text-emerald-400 flex items-center justify-center gap-1.5">
                  <CheckCircleIcon className="h-5 w-5" />
                  {t('chat.missingInfo.allDone', 'Đã trả lời tất cả câu hỏi bổ sung!')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Helper: compute missing info stats from messages ──
export function getMissingInfoStats(messages: MessageDto[]): {
  answeredCount: number;
  totalCount: number;
  hasQuestions: boolean;
} {
  const data = parseMissingInfoData(messages);
  if (!data) return { answeredCount: 0, totalCount: 0, hasQuestions: false };
  const answeredCount = data.questions.filter((q) => q.answered).length;
  return { answeredCount, totalCount: data.questions.length, hasQuestions: data.questions.length > 0 };
}
