'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import type { MessageDto, IntakeQuestionMetadata, MissingInfoMetadata } from '@/types';
import { formatDate } from '@/lib/utils';
import { FileAttachment } from './FileAttachment';
import {
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface ChatBubbleProps {
  message: MessageDto;
  isOwnMessage: boolean;
  requestId?: string;
  userId?: string;
  onReaction?: (messageId: string, emoji: string) => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '✅'];

function ReactionPills({ message, userId, onReaction }: {
  message: MessageDto;
  userId?: string;
  onReaction?: (messageId: string, emoji: string) => void;
}) {
  if (!message.reactions?.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {message.reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => onReaction?.(message.id, r.emoji)}
          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] transition-all border ${
            userId && r.userIds.includes(userId)
              ? 'bg-[var(--accent-violet)]/15 border-[var(--accent-violet)]/30 text-[var(--accent-violet)]'
              : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-3)]'
          }`}
        >
          <span>{r.emoji}</span>
          <span className="tabular-nums">{r.count}</span>
        </button>
      ))}
    </div>
  );
}

function ReactionPicker({ messageId, onReaction }: {
  messageId: string;
  onReaction?: (messageId: string, emoji: string) => void;
}) {
  const [show, setShow] = useState(false);
  if (!onReaction) return null;
  return (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className="opacity-0 group-hover:opacity-100 rounded-full p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-all text-xs"
        title="React"
      >
        😊
      </button>
      {show && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShow(false)} />
          <div className="absolute bottom-full mb-1 z-20 flex gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-1.5 py-1 shadow-xl animate-fade-in">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { onReaction(messageId, emoji); setShow(false); }}
                className="rounded-lg p-1 text-sm hover:bg-[var(--surface-2)] transition-colors hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ChatBubble({ message, isOwnMessage, requestId, userId, onReaction }: ChatBubbleProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { type, content, sender, files, createdAt, metadata } = message;

  // System messages
  if (type === 'System') {
    return (
      <div className="flex justify-center py-2 animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-4 py-1.5 text-xs text-[var(--text-muted)]">
          <InformationCircleIcon className="h-3.5 w-3.5" />
          {content}
        </div>
      </div>
    );
  }

  // Intake Question
  if (type === 'IntakeQuestion') {
    const meta = metadata as IntakeQuestionMetadata | null;
    return (
      <div className="flex justify-start py-1 animate-fade-in">
        <div className="max-w-[80%]">
          <div className="rounded-2xl rounded-tl-md bg-[var(--accent-indigo)]/10 border border-[var(--accent-indigo)]/20 p-4">
            <div className="mb-2 flex items-center gap-2">
              <QuestionMarkCircleIcon className="h-4 w-4 text-[var(--accent-violet)]" />
              <span className="text-xs font-semibold text-[var(--accent-violet)]">
                {t('chat.intakeQuestion')}
                {meta && ` (${meta.orderIndex + 1}/${meta.totalQuestions})`}
              </span>
              {meta?.isRequired && (
                <span className="text-xs text-red-400">{t('chat.requiredMark')}</span>
              )}
            </div>
            <p className="text-sm text-[var(--foreground)]">{content}</p>
            {meta?.placeholder && (
              <p className="mt-1 text-xs text-[var(--text-muted)] italic">
                {meta.placeholder}
              </p>
            )}
          </div>
          <p className="mt-1 px-1 text-[10px] text-[var(--text-muted)]">
            {formatDate(createdAt, language)}
          </p>
        </div>
      </div>
    );
  }

  // Missing Info
  if (type === 'MissingInfo') {
    const meta = metadata as MissingInfoMetadata | null;
    const totalQ = meta?.questions?.length || 0;
    const answeredQ = meta?.questions?.filter((q) => q.answered).length || 0;
    return (
      <div className="flex justify-start py-1 animate-fade-in">
        <div className="max-w-[80%]">
          <div className="flex items-end gap-2">
            {sender && (
              <Avatar
                src={sender.avatarUrl ?? undefined}
                name={sender.name || 'Staff'}
                size="sm"
              />
            )}
            <div className="rounded-2xl rounded-bl-md bg-amber-500/10 border border-amber-500/20 p-4">
              {/* Header */}
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">
                    {t('chat.missingInfo.title')}
                  </span>
                </div>
                {totalQ > 0 && (
                  <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                    {answeredQ}/{totalQ}
                  </span>
                )}
              </div>

              {/* Content message */}
              {content && (
                <p className="mb-3 text-sm text-[var(--foreground)]">{content}</p>
              )}

              {/* Questions */}
              {meta?.questions && meta.questions.length > 0 && (
                <>
                  {content && (
                    <div className="mb-3 border-t border-amber-500/15" />
                  )}
                  <div className="space-y-2">
                    {meta.questions.map((q, idx) => (
                      <div key={q.id} className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold tabular-nums',
                            q.answered
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-400/70'
                          )}
                        >
                          {q.answered ? '✓' : idx + 1}
                        </span>
                        <span
                          className={cn(
                            'text-sm leading-5',
                            q.answered
                              ? 'text-[var(--text-muted)] line-through'
                              : 'text-[var(--foreground)]'
                          )}
                        >
                          {q.question}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="mt-1 px-1 text-[10px] text-[var(--text-muted)]">
            {sender?.name} · {formatDate(createdAt, language)}
          </p>
        </div>
      </div>
    );
  }

  // Regular messages (Text, File, IntakeAnswer)
  return (
    <div
      className={cn(
        'flex py-1 animate-fade-in',
        isOwnMessage ? 'justify-end' : 'justify-start'
      )}
    >
      <div className={cn('max-w-[80%]', isOwnMessage ? 'items-end' : 'items-start')}>
        <div className={cn('flex items-end gap-2 group', isOwnMessage && 'flex-row-reverse')}>
          {!isOwnMessage && sender && (
            <Avatar
              src={sender.avatarUrl ?? undefined}
              name={sender.name || 'User'}
              size="sm"
            />
          )}
          <div>
            <div
              className={cn(
                'rounded-2xl px-4 py-2.5',
                isOwnMessage
                  ? 'rounded-br-md bg-[var(--accent-indigo)] text-white'
                  : 'rounded-bl-md bg-[var(--surface-2)] text-[var(--foreground)]',
                type === 'IntakeAnswer' && !isOwnMessage && 'bg-[var(--accent-indigo)]/5 border border-[var(--accent-indigo)]/20'
              )}
            >
              {!isOwnMessage && sender && (
                <p className="mb-0.5 text-xs font-semibold text-[var(--accent-violet)]">
                  {sender.name}
                </p>
              )}
              {type === 'IntakeAnswer' && !isOwnMessage && (
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-violet)] opacity-70">
                  {t('chat.answer')}
                </p>
              )}
              {content && (
                <p className="text-sm whitespace-pre-wrap">{content}</p>
              )}
              {files.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {files.map((file) => (
                    <FileAttachment key={file.id} file={file} isOwn={isOwnMessage} />
                  ))}
                </div>
              )}
            </div>
            <ReactionPills message={message} userId={userId} onReaction={onReaction} />
          </div>
          <ReactionPicker messageId={message.id} onReaction={onReaction} />
        </div>
        <p
          className={cn(
            'mt-1 px-1 text-[10px] text-[var(--text-muted)]',
            isOwnMessage && 'text-right'
          )}
        >
          {formatDate(createdAt, language)}
        </p>
      </div>
    </div>
  );
}
