'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { MessageDto } from '@/types';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';

interface ChatInputProps {
  onSend: (content: string, replyToId?: string) => void;
  onFileUpload?: (files: File[]) => Promise<void> | void;
  onTyping?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isIntake?: boolean;
  replyToMessage?: MessageDto | null;
  onCancelReply?: () => void;
}

export function ChatInput({
  onSend,
  onFileUpload,
  onTyping,
  placeholder,
  disabled = false,
  isIntake = false,
  replyToMessage,
  onCancelReply,
}: ChatInputProps) {
  const { t } = useTranslation();
  const effectivePlaceholder = placeholder ?? t('chat.messagePlaceholder');
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Refocus textarea when re-enabled after sending or reply set
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled, replyToMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    const filesToSend = [...selectedFiles];
    if (!trimmed && filesToSend.length === 0) return;
    if (isSending) return;

    // ── Clear the input IMMEDIATELY so user sees feedback right away ──
    setContent('');
    setSelectedFiles([]);
    onCancelReply?.();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setIsSending(true);
    try {
      // Upload files first, wait for completion, so they appear in chat before text
      if (filesToSend.length > 0 && onFileUpload) {
        await onFileUpload(filesToSend);
      }
      // Then send text message
      if (trimmed) {
        onSend(trimmed, replyToMessage?.id);
      }
    } finally {
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape' && replyToMessage) {
      onCancelReply?.();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping?.();
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
    }
    // Increment key to force-remount the input, allowing re-selection
    // of the same file or re-opening dialog after cancel
    setFileInputKey((k) => k + 1);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface-1)]">
      {/* Reply context bar */}
      {replyToMessage && (
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 animate-fade-in relative">
          <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[var(--accent-indigo)]"></div>
          <div className="flex items-center gap-3 w-full pl-2 overflow-hidden">
            <ArrowUturnLeftIcon className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[var(--foreground)]">
                  {t('chat.replyingTo', 'Đang trả lời')} {replyToMessage.sender?.name || 'Unknown'}
                </span>
              </div>
              <p className="text-[12px] text-[var(--text-muted)] truncate" title={replyToMessage.content || undefined}>
                {replyToMessage.content || '📎 File đính kèm'}
              </p>
            </div>
            <button
              onClick={onCancelReply}
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
              title="Huỷ"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-[var(--surface-2)] px-3 py-1.5 text-xs">
                <span className="max-w-[120px] truncate text-[var(--text-secondary)]">{file.name}</span>
                <button onClick={() => removeFile(i)} className="text-[var(--text-muted)] hover:text-red-400">
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* File upload button */}
          {onFileUpload && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 h-[40px] w-[40px] flex items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                disabled={disabled}
              >
                <PaperClipIcon className="h-5 w-5" />
              </button>
              <input key={fileInputKey} ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
            </>
          )}

          {/* Text input */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={effectivePlaceholder}
              disabled={disabled}
              rows={1}
              autoFocus
              className={cn(
                'w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200',
                'bg-[var(--surface-2)] border-[var(--border)] text-[var(--foreground)] placeholder-[var(--text-muted)]',
                'focus:border-[var(--accent-indigo)] focus:ring-1 focus:ring-[var(--accent-indigo)]/50',
                isIntake && 'border-[var(--accent-indigo)]/30 bg-[var(--accent-indigo)]/5',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              id="chat-input"
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={disabled || isSending || (!content.trim() && selectedFiles.length === 0)}
            className={cn(
              'flex-shrink-0 h-[40px] w-[40px] flex items-center justify-center rounded-xl transition-all duration-200',
              (content.trim() || selectedFiles.length > 0) && !isSending
                ? 'btn-gradient text-white'
                : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
            )}
            id="send-message"
          >
            {isSending ? (
              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <PaperAirplaneIcon className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
