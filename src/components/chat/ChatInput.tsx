'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ChatInputProps {
  onSend: (content: string) => void;
  onFileUpload?: (files: File[]) => void;
  onTyping?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isIntake?: boolean;
}

export function ChatInput({
  onSend,
  onFileUpload,
  onTyping,
  placeholder,
  disabled = false,
  isIntake = false,
}: ChatInputProps) {
  const { t } = useTranslation();
  const effectivePlaceholder = placeholder ?? t('chat.messagePlaceholder');
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Refocus textarea when re-enabled after sending
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed && selectedFiles.length === 0) return;

    if (selectedFiles.length > 0 && onFileUpload) {
      onFileUpload(selectedFiles);
      setSelectedFiles([]);
    }

    if (trimmed) {
      onSend(trimmed);
      setContent('');
    }

    // Reset textarea height and refocus after re-render
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping?.();
    // Auto-resize
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface-1)] p-4">
      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg bg-[var(--surface-2)] px-3 py-1.5 text-xs"
            >
              <span className="max-w-[120px] truncate text-[var(--text-secondary)]">
                {file.name}
              </span>
              <button
                onClick={() => removeFile(i)}
                className="text-[var(--text-muted)] hover:text-red-400"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* File upload button */}
        {!isIntake && onFileUpload && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 h-[40px] w-[40px] flex items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              disabled={disabled}
            >
              <PaperClipIcon className="h-5 w-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
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
          disabled={disabled || (!content.trim() && selectedFiles.length === 0)}
          className={cn(
            'flex-shrink-0 h-[40px] w-[40px] flex items-center justify-center rounded-xl transition-all duration-200',
            content.trim() || selectedFiles.length > 0
              ? 'btn-gradient text-white'
              : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
          )}
          id="send-message"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
