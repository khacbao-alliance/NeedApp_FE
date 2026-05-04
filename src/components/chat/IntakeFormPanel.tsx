'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircleIcon,
  PencilSquareIcon,
  ClockIcon,
  PaperAirplaneIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { MessageDto, IntakeQuestionMetadata } from '@/types';
import { IntakeAnswerHistoryModal } from './IntakeAnswerHistoryModal';

interface QuestionItem {
  questionId: string;
  messageId: string;
  content: string;
  orderIndex: number;
  isRequired: boolean;
  placeholder: string | null;
  totalQuestions: number;
}

interface AnswerItem {
  questionId: string;
  messageId: string; // answer message ID (for editing)
  content: string;
  isEdited: boolean;
}

interface IntakeFormPanelProps {
  messages: MessageDto[];
  requestId: string;
  isOpen: boolean;
  onClose: () => void;
  isReadOnly?: boolean; // kept for future use (e.g. cancelled/done requests)
  onAnswerSubmit: (content: string, questionMessageId: string) => Promise<void>;
  onAnswerEdit: (messageId: string, newContent: string) => Promise<void>;
}

function parseIntakeData(messages: MessageDto[]): {
  questions: QuestionItem[];
  answers: Map<string, AnswerItem>;
} {
  const questions: QuestionItem[] = [];
  const answerMessages: MessageDto[] = [];

  for (const msg of messages) {
    if (msg.type === 'IntakeQuestion') {
      const meta = msg.metadata as IntakeQuestionMetadata | null;
      if (!meta) continue;
      questions.push({
        questionId: meta.questionId,
        messageId: msg.id,
        content: msg.content || '',
        orderIndex: meta.orderIndex,
        isRequired: meta.isRequired,
        placeholder: meta.placeholder,
        totalQuestions: meta.totalQuestions,
      });
    } else if (msg.type === 'IntakeAnswer') {
      answerMessages.push(msg);
    }
  }

  // Sort questions by orderIndex
  questions.sort((a, b) => a.orderIndex - b.orderIndex);

  // Sort answers by date for the sequential fallback
  answerMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const answeredByQuestion = new Map<string, AnswerItem>();
  
  // Track which questions have been answered via fallback to avoid overwriting explicit replyToId
  let fallbackIndex = 0;

  for (const msg of answerMessages) {
    let q: QuestionItem | undefined;

    // 1. Explicit mapping via replyToId (supports answering in any order)
    if (msg.replyToId) {
      q = questions.find((ques) => ques.messageId === msg.replyToId);
    } 
    // 2. Fallback to sequential mapping for old data
    else {
      q = questions[fallbackIndex];
      fallbackIndex++;
    }

    if (q) {
      const item: AnswerItem = {
        questionId: q.questionId,
        messageId: msg.id,
        content: msg.content || '',
        isEdited: msg.isEdited || false,
      };
      answeredByQuestion.set(q.questionId, item);
    }
  }

  return { questions, answers: answeredByQuestion };
}

// ── Single Question Card ────────────────────────────────────────────────────
interface QuestionCardProps {
  question: QuestionItem;
  answer: AnswerItem | undefined;
  questionNumber: number;
  requestId: string;
  isReadOnly?: boolean;
  onSubmit: (content: string) => Promise<void>;
  onEdit: (messageId: string, newContent: string) => Promise<void>;
  onOptimisticAnswer: (questionId: string, content: string) => void;
}

function QuestionCard({
  question,
  answer,
  questionNumber,
  requestId,
  isReadOnly,
  onSubmit,
  onEdit,
  onOptimisticAnswer,
}: QuestionCardProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAnswered = !!answer;

  // Auto-resize textarea — only resize, don't auto-focus
  const autoResize = useCallback((ta: HTMLTextAreaElement) => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, []);

  // Only focus textarea when user enters edit mode explicitly
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      autoResize(textareaRef.current);
    }
  }, [isEditing, autoResize]);

  const handleStartEdit = () => {
    setDraftValue(answer?.content || '');
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
    // Optimistic update: show answer immediately before API returns
    if (!isAnswered) {
      onOptimisticAnswer(question.questionId, trimmed);
    }
    try {
      if (isAnswered && isEditing) {
        await onEdit(answer!.messageId, trimmed);
        setIsEditing(false);
      } else {
        await onSubmit(trimmed);
      }
      setDraftValue('');
    } catch {
      // On error, revert optimistic update by clearing
      setSaving(false);
      return;
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = (value: string) => {
    setDraftValue(value);
    if (!isEditing) setIsEditing(true);
  };

  return (
    <>
      <div
        className={cn(
          'group rounded-xl border transition-all duration-200',
          isReadOnly
            ? 'border-[var(--border)] bg-[var(--surface-2)] opacity-80'
            : isAnswered
            ? isEditing
              ? 'border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/5 shadow-sm shadow-[var(--accent-primary)]/5'
              : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border)]/80'
            : 'border-[var(--accent-primary)]/20 bg-[var(--surface-2)]'
        )}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            {/* Question number badge */}
            <span
              className={cn(
                'flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold mt-0.5',
                isAnswered && !isEditing
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
              )}
            >
              {isAnswered && !isEditing ? (
                <CheckIcon className="h-3.5 w-3.5" />
              ) : (
                questionNumber
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--foreground)] leading-snug">
                {question.content}
              </p>
              {question.placeholder && !isAnswered && (
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)] italic">
                  {question.placeholder}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons for answered state */}
          {isAnswered && !isEditing && !isReadOnly && (
            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* History button */}
              <button
                onClick={() => setShowHistory(true)}
                title={t('chat.intakeForm.viewHistory', 'Xem lịch sử')}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--accent-primary)] transition-colors"
              >
                <ClockIcon className="h-4 w-4" />
              </button>
              {/* Edit button */}
              <button
                onClick={handleStartEdit}
                title={t('chat.intakeForm.editAnswer', 'Chỉnh sửa')}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Answered content (view mode) */}
        {isAnswered && !isEditing && (
          <div className="px-4 pb-3.5">
            <div className="rounded-lg bg-[var(--surface-1)] border border-[var(--border)] px-3 py-2.5">
              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
                {answer!.content}
              </p>
              {answer!.isEdited && (
                <p className="mt-1 flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                  <PencilSquareIcon className="h-3 w-3" /> {t('chat.edited', 'đã chỉnh sửa')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Textarea (new answer or edit mode) — hidden when read-only and not answered */}
        {(!isAnswered || isEditing) && !isReadOnly && (
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
              placeholder={
                isEditing
                  ? answer?.content || question.placeholder || t('chat.intakeForm.editPlaceholder', 'Chỉnh sửa câu trả lời...')
                  : question.placeholder || t('chat.answerPlaceholder', 'Nhập câu trả lời...')
              }
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent-primary)]/50 focus:ring-1 focus:ring-[var(--accent-primary)]/20 disabled:opacity-60"
            />

            {/* Action row */}
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
                    : 'bg-[var(--accent-primary)] text-white hover:opacity-90 shadow-sm shadow-[var(--accent-primary)]/20'
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

      {/* History modal */}
      {showHistory && answer && (
        <IntakeAnswerHistoryModal
          requestId={requestId}
          messageId={answer.messageId}
          questionContent={question.content}
          onClose={() => setShowHistory(false)}
          onRestore={handleRestore}
        />
      )}
    </>
  );
}

export function IntakeFormPanel({
  messages,
  requestId,
  isOpen,
  onClose,
  isReadOnly,
  onAnswerSubmit,
  onAnswerEdit,
}: IntakeFormPanelProps) {
  const { t } = useTranslation();
  const { questions, answers: serverAnswers } = parseIntakeData(messages);
  // Optimistic answers: keyed by questionId, overrides serverAnswers while saving
  const [optimisticAnswers, setOptimisticAnswers] = useState<Map<string, string>>(new Map());

  // Merge server answers with optimistic ones (server answers win once they arrive)
  const answers = new Map(serverAnswers);
  for (const [qId, content] of optimisticAnswers) {
    if (!serverAnswers.has(qId)) {
      answers.set(qId, { questionId: qId, messageId: '', content, isEdited: false });
    } else {
      // Server has answered, remove optimistic
      optimisticAnswers.delete(qId);
    }
  }

  const answeredCount = questions.filter((q) => answers.has(q.questionId)).length;
  const totalCount = questions.length;
  const progress = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  if (questions.length === 0 || !isOpen) return null;

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
          {/* Modal Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-2)] flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {answeredCount === totalCount ? (
                <div className="flex-shrink-0 rounded-xl bg-emerald-500/10 p-2">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                </div>
              ) : (
                <div className="flex-shrink-0 rounded-xl bg-[var(--accent-primary)]/10 p-2">
                  <ExclamationCircleIcon className="h-5 w-5 text-[var(--accent-primary)]" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {t('chat.intakeForm.title', 'Câu hỏi tiếp nhận')}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] font-normal">
                  {t('chat.intakeForm.subtitle', 'Không bắt buộc — có thể điền bất cứ lúc nào')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                answeredCount === totalCount
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20'
              )}>
                {answeredCount === totalCount ? (
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                ) : null}
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
              className="h-full bg-[var(--accent-primary)] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question cards — scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-2.5">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.questionId}
                question={q}
                answer={answers.get(q.questionId)}
                questionNumber={idx + 1}
                requestId={requestId}
                isReadOnly={isReadOnly}
                onOptimisticAnswer={(questionId, content) => {
                  setOptimisticAnswers((prev) => new Map(prev).set(questionId, content));
                }}
                onSubmit={async (content) => {
                  await onAnswerSubmit(content, q.messageId);
                }}
                onEdit={async (messageId, newContent) => {
                  await onAnswerEdit(messageId, newContent);
                }}
              />
            ))}

            {answeredCount === totalCount && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center animate-fade-in mt-4">
                <p className="text-sm font-medium text-emerald-400 flex items-center justify-center gap-1.5">
                  <CheckCircleIcon className="h-5 w-5" />
                  {t('chat.intakeForm.allDone', 'Bạn đã trả lời tất cả câu hỏi!')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Helper: compute intake stats from messages (used by trigger button) ──
export function getIntakeStats(messages: MessageDto[]): { answeredCount: number; totalCount: number; hasQuestions: boolean } {
  const { questions, answers } = parseIntakeData(messages);
  const answeredCount = questions.filter((q) => answers.has(q.questionId)).length;
  return { answeredCount, totalCount: questions.length, hasQuestions: questions.length > 0 };
}
