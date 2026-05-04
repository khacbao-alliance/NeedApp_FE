'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ExclamationTriangleIcon,
  PlusCircleIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface MissingInfoComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (content: string, questions: string[]) => Promise<void>;
}

export function MissingInfoComposer({ isOpen, onClose, onSend }: MissingInfoComposerProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [questions, setQuestions] = useState<string[]>(['']);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first question input on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setQuestions(['']);
      setError('');
    }
  }, [isOpen]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, '']);
    setTimeout(() => {
      const lastIdx = questions.length; // new item index
      inputRefs.current[lastIdx]?.focus();
    }, 50);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    // Focus previous input
    setTimeout(() => {
      const focusIdx = Math.max(0, index - 1);
      inputRefs.current[focusIdx]?.focus();
    }, 50);
  };

  const updateQuestion = (index: number, value: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? value : q)));
  };

  const validCount = questions.filter((q) => q.trim()).length;

  const handleSubmit = async () => {
    const validQuestions = questions.map((q) => q.trim()).filter(Boolean);
    if (validQuestions.length === 0) {
      setError(t('chat.missingInfo.needOneQuestion'));
      return;
    }
    setError('');
    setSending(true);
    try {
      await onSend(content.trim(), validQuestions);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('chat.missingInfo.cannotSend');
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // If this question has content, add a new one
      if (questions[index].trim()) {
        addQuestion();
      } else if (validCount > 0) {
        // Submit if at least one valid question exists
        handleSubmit();
      }
    }
    if (e.key === 'Backspace' && !questions[index] && questions.length > 1) {
      e.preventDefault();
      removeQuestion(index);
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

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
          className="pointer-events-auto w-full md:max-w-[540px] max-h-[90vh] md:max-h-[80vh] bg-[var(--surface-1)] md:rounded-2xl rounded-t-2xl border border-[var(--border)] shadow-2xl shadow-black/30 flex flex-col animate-slide-up overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-2)] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15">
                <ExclamationTriangleIcon className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {t('chat.missingInfo.title')}
                </span>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {t('chat.missingInfo.clientReceive')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--foreground)]"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
            {/* Message input */}
            <div>
              <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {t('chat.missingInfo.messageLabel')} <span className="normal-case font-normal"></span>
              </label>
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('chat.missingInfo.messagePlaceholder')}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            {/* Questions list */}
            <div>
              <label className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {t('chat.missingInfo.questionListLabel')}
                </span>
                {validCount > 0 && (
                  <span className="text-[10px] text-amber-400">
                    {t('chat.missingInfo.questionCount', { count: validCount })}
                  </span>
                )}
              </label>
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <div key={i} className="group flex items-center gap-2">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[10px] font-semibold tabular-nums text-amber-400/70 bg-amber-500/10">
                      {i + 1}
                    </span>
                    <input
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      value={q}
                      onChange={(e) => updateQuestion(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, i)}
                      placeholder={i === 0 ? t('chat.missingInfo.questionPlaceholder') : t('chat.missingInfo.questionNPlaceholder', { n: i + 1 })}
                      className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/15"
                    />
                    {questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(i)}
                        tabIndex={-1}
                        className="rounded-md p-1 text-[var(--text-muted)] opacity-0 transition-all group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addQuestion}
                className="mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-amber-400/70 transition-colors hover:text-amber-400 hover:bg-amber-500/10"
              >
                <PlusCircleIcon className="h-3.5 w-3.5" />
                {t('chat.missingInfo.addQuestion')}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Footer actions — fixed at bottom */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--border)] bg-[var(--surface-2)] flex-shrink-0">
            <p className="text-[10px] text-[var(--text-muted)]">
              {t('chat.missingInfo.hint')}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--foreground)]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={sending || validCount === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md hover:shadow-amber-500/20 disabled:opacity-40 disabled:shadow-none"
              >
                {sending ? (
                  <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PaperAirplaneIcon className="h-3.5 w-3.5" />
                )}
                {t('chat.missingInfo.sendBtn', { count: validCount })}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
