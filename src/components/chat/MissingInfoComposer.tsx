'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  PlusCircleIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface MissingInfoComposerProps {
  onSend: (content: string, questions: string[]) => Promise<void>;
  onCancel: () => void;
}

export function MissingInfoComposer({ onSend, onCancel }: MissingInfoComposerProps) {
  const [content, setContent] = useState('');
  const [questions, setQuestions] = useState<string[]>(['']);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first question input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

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
      setError('Cần ít nhất 1 câu hỏi');
      return;
    }
    setError('');
    setSending(true);
    try {
      await onSend(content.trim(), validQuestions);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể gửi yêu cầu bổ sung';
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
  };

  return (
    <div className="border-t-2 border-amber-500/40 bg-gradient-to-t from-amber-500/[0.06] to-transparent animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/15">
            <ExclamationTriangleIcon className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <span className="text-xs font-semibold text-[var(--foreground)]">
            Yêu cầu bổ sung thông tin
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            — Client sẽ nhận được danh sách câu hỏi
          </span>
        </div>
        <button
          onClick={onCancel}
          className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Message input */}
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Lời nhắn <span className="normal-case font-normal">(không bắt buộc)</span>
          </label>
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="VD: Chúng tôi cần thêm một số thông tin để xử lý yêu cầu..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>

        {/* Questions list */}
        <div>
          <label className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Danh sách câu hỏi
            </span>
            {validCount > 0 && (
              <span className="text-[10px] text-amber-400">
                {validCount} câu hỏi
              </span>
            )}
          </label>
          <div className="space-y-1.5">
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
                  placeholder={i === 0 ? 'VD: Logo công ty có sẵn chưa?' : `Câu hỏi ${i + 1}...`}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/15"
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
            className="mt-1.5 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-amber-400/70 transition-colors hover:text-amber-400 hover:bg-amber-500/10"
          >
            <PlusCircleIcon className="h-3.5 w-3.5" />
            Thêm câu hỏi
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-[10px] text-[var(--text-muted)]">
            Enter để thêm câu hỏi • Backspace để xóa
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="rounded-lg px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            >
              Hủy
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
              Gửi ({validCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
