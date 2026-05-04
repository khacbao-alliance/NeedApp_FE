'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import type { MessageDto, IntakeQuestionMetadata, MissingInfoMetadata, ReadReceiptDto } from '@/types';
import { formatDate } from '@/lib/utils';
import { FileAttachment } from './FileAttachment';
import {
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  FaceSmileIcon,
  CheckIcon,
  PencilIcon,
  ArrowUturnLeftIcon,
  XMarkIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';

// Thumbtack icon — cleaner style from Lucide
function PinIcon({ className, filled = false }: { className?: string; filled?: boolean }) {
  if (filled) {
    return (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
        <path fillRule="evenodd" clipRule="evenodd" d="M13.5 17v5a1.5 1.5 0 0 1-3 0v-5h3Z"></path>
      </svg>
    )
  }
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22"></line>
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
    </svg>
  );
}

interface ChatBubbleProps {
  message: MessageDto;
  isOwnMessage: boolean;
  requestId?: string;
  userId?: string;
  readers?: ReadReceiptDto[];
  isLastOwnMessage?: boolean;
  onReaction?: (messageId: string, emoji: string) => void;
  onReply?: (message: MessageDto) => void;
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
  onPin?: (messageId: string) => Promise<void>;
  onImageLoad?: () => void;
  /** Whether the current user can pin (Staff/Admin) */
  canPin?: boolean;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '✅'];
const EDIT_WINDOW_MS = 15 * 60 * 1000;

// ── Lightweight markdown renderer ────────────────────────────────────────────
// Supports: **bold**, *italic*, `code`, ```code block```, line breaks
function MarkdownContent({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3);
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      result.push(
        <pre key={i} className="mt-1 mb-1 rounded-lg bg-black/30 px-3 py-2 text-xs font-mono overflow-x-auto whitespace-pre">
          {lang && <span className="block text-[10px] text-[var(--text-muted)] mb-1">{lang}</span>}
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    result.push(<span key={i}>{renderInline(line)}{i < lines.length - 1 ? <br /> : null}</span>);
    i++;
  }

  return <span className={className}>{result}</span>;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Regex order: inline code first, then bold, then italic
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith('`')) {
      parts.push(<code key={match.index} className="rounded bg-black/25 px-1 py-0.5 font-mono text-[0.8em]">{token.slice(1, -1)}</code>);
    } else if (token.startsWith('**')) {
      parts.push(<strong key={match.index} className="font-bold">{token.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={match.index} className="italic">{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ── Reaction Pills ─────────────────────────────────────────────────────────
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

// ── Reaction Picker ────────────────────────────────────────────────────────
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
        <FaceSmileIcon className="h-4 w-4" />
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

// ── Reply preview inside bubble ────────────────────────────────────────────
function ReplyPreview({ message, isOwn }: { message: MessageDto; isOwn: boolean }) {
  const { t } = useTranslation();
  const { replyTo } = message;
  if (!replyTo) return null;
  return (
    <div
      className={cn(
        'mb-2 flex flex-col gap-0.5 border-l-[3px] pl-2 px-1 py-0.5 text-xs transition-colors cursor-pointer',
        isOwn
          ? 'border-white/30 hover:border-white/50'
          : 'border-[var(--accent-indigo)]/30 hover:border-[var(--accent-indigo)]'
      )}
      onClick={() => document.getElementById(`msg-${replyTo.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
      role="button"
      tabIndex={0}
      title={t('chat.goToOriginal', 'Đi tới tin nhắn gốc')}
    >
      <p className={cn('font-semibold truncate text-[11px]', isOwn ? 'text-white/90' : 'text-[var(--text-secondary)]')}>
        {replyTo.senderName || 'Unknown'}
      </p>
      <p className={cn('truncate line-clamp-1', isOwn ? 'text-white/70' : 'text-[var(--text-muted)]')}>
        {replyTo.content || <><PaperClipIcon className="inline h-3 w-3" /> {t('chat.fileAttachment')}</>}
      </p>
    </div>
  );
}

// ── Message action buttons (hover toolbar) ─────────────────────────────────
function MessageActions({
  message,
  isOwnMessage,
  canEdit,
  canPin,
  onReply,
  onEdit,
  onPin,
  onReaction,
}: {
  message: MessageDto;
  isOwnMessage: boolean;
  canEdit: boolean;
  canPin: boolean;
  onReply?: (m: MessageDto) => void;
  onEdit?: () => void;
  onPin?: () => void;
  onReaction?: (messageId: string, emoji: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className={cn('flex items-center gap-0.5', isOwnMessage && 'flex-row-reverse')}>
      {onReply && (
        <button
          onClick={() => onReply(message)}
          className="opacity-0 group-hover:opacity-100 rounded-full p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-all"
          title="Reply"
        >
          <ArrowUturnLeftIcon className="h-4 w-4" />
        </button>
      )}
      {canEdit && onEdit && (
        <button
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 rounded-full p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-all"
          title="Edit"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      )}
      {canPin && onPin && (
        <button
          onClick={onPin}
          className={cn(
            'rounded-full p-1 transition-all',
            message.isPinned
              ? 'opacity-100 text-[var(--accent-violet)] bg-[var(--accent-violet)]/10 hover:bg-[var(--accent-violet)]/20 shadow-sm'
              : 'opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]'
          )}
          title={message.isPinned ? t('chat.unpin') : t('chat.pin')}
        >
          <PinIcon className="h-4 w-4" filled={message.isPinned} />
        </button>
      )}
      <ReactionPicker messageId={message.id} onReaction={onReaction} />
    </div>
  );
}

// ── Inline edit ────────────────────────────────────────────────────────────
function InlineEdit({ initial, onSave, onCancel }: {
  initial: string;
  onSave: (val: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
  }, []);

  const save = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === initial.trim()) { onCancel(); return; }
    setSaving(true);
    try { await onSave(trimmed); } finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => { setValue(e.target.value); const ta = e.target; ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'; }}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === 'Escape') onCancel(); }}
        disabled={saving}
        rows={1}
        className="w-full resize-none rounded-lg bg-black/20 px-2 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-white/30"
      />
      <div className="flex items-center gap-1.5 justify-end">
        <button onClick={onCancel} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/60 hover:text-white/80 transition-colors">
          <XMarkIcon className="h-3 w-3" /> Huỷ
        </button>
        <button onClick={save} disabled={saving || !value.trim()} className="flex items-center gap-1 rounded-lg bg-white/20 px-2.5 py-1 text-xs text-white hover:bg-white/30 transition-colors disabled:opacity-50">
          <CheckIcon className="h-3 w-3" /> Lưu
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function ChatBubble({
  message,
  isOwnMessage,
  requestId,
  userId,
  onReaction,
  onReply,
  onEdit,
  onPin,
  onImageLoad,
  canPin = false,
  readers = [],
  isLastOwnMessage = false,
}: ChatBubbleProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { type, content, sender, files, createdAt, metadata } = message;
  const [isEditing, setIsEditing] = useState(false);

  const canEdit = isOwnMessage
    && (type === 'Text' || type === 'IntakeAnswer')
    && !!onEdit
    && (Date.now() - new Date(createdAt).getTime() < EDIT_WINDOW_MS);

  const handleEdit = async (newContent: string) => {
    await onEdit?.(message.id, newContent);
    setIsEditing(false);
  };

  // ── Translate system message content ──
  const translateSystemMessage = (raw: string | null): string => {
    if (!raw) return '';
    const statusLabel = (status: string): string => {
      const map: Record<string, string> = {
        Draft: t('status.draft'), Intake: t('status.intake'), Pending: t('status.pending'),
        MissingInfo: t('status.missingInfo'), InProgress: t('status.inProgress'),
        Done: t('status.done'), Cancelled: t('status.cancelled'),
      };
      return map[status] || status;
    };
    const statusMatch = raw.match(/^Status changed from "(.+)" to "(.+)"\.$/);
    if (statusMatch) return t('chat.systemMsg.statusChanged', { from: statusLabel(statusMatch[1]), to: statusLabel(statusMatch[2]) });
    const assignMatch = raw.match(/^Request assigned to "(.+)"\.$/);
    if (assignMatch) return t('chat.systemMsg.assigned', { name: assignMatch[1] });
    const unassignMatch = raw.match(/^"(.+)" has been unassigned from this request\.$/);
    if (unassignMatch) return t('chat.systemMsg.unassigned', { name: unassignMatch[1] });
    const createMatch = raw.match(/^Request "(.+)" has been created\.$/);
    if (createMatch) return t('chat.systemMsg.created', { title: createMatch[1] });
    if (raw.startsWith('All intake questions have been answered')) return t('chat.systemMsg.intakeComplete');
    return raw;
  };

  // ── System messages ──
  if (type === 'System') {
    return (
      <div className="flex justify-center py-2 animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-4 py-1.5 text-xs text-[var(--text-muted)]">
          <InformationCircleIcon className="h-3.5 w-3.5" />
          {translateSystemMessage(content)}
        </div>
      </div>
    );
  }

  // ── Intake Question ──
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
              <p className="mt-1 text-xs text-[var(--text-muted)] italic">{meta.placeholder}</p>
            )}
          </div>
          <p className="mt-1 px-1 text-[10px] text-[var(--text-muted)]"
            title={new Date(createdAt).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}>
            {formatDate(createdAt, language)}
          </p>
        </div>
      </div>
    );
  }

  // ── Missing Info ──
  if (type === 'MissingInfo') {
    const meta = metadata as MissingInfoMetadata | null;
    const totalQ = meta?.questions?.length || 0;
    const answeredQ = meta?.questions?.filter((q) => q.answered).length || 0;
    return (
      <div className="flex justify-start py-1 animate-fade-in">
        <div className="max-w-[80%]">
          <div className="flex items-end gap-2">
            {sender && <Avatar src={sender.avatarUrl ?? undefined} name={sender.name || 'Staff'} size="sm" />}
            <div className="rounded-2xl rounded-bl-md bg-amber-500/10 border border-amber-500/20 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">{t('chat.missingInfo.title')}</span>
                </div>
                {totalQ > 0 && (
                  <span className="text-[10px] text-[var(--text-muted)] tabular-nums">{answeredQ}/{totalQ}</span>
                )}
              </div>
              {content && <p className="mb-3 text-sm text-[var(--foreground)]">{content}</p>}
              {meta?.questions && meta.questions.length > 0 && (
                <>
                  {content && <div className="mb-3 border-t border-amber-500/15" />}
                  <div className="space-y-2">
                    {meta.questions.map((q, idx) => (
                      <div key={q.id} className="flex items-start gap-2.5">
                        <span className={cn(
                          'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold tabular-nums',
                          q.answered ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/15 text-amber-400/70'
                        )}>
                          {q.answered ? <CheckIcon className="h-3 w-3" /> : idx + 1}
                        </span>
                        <span className={cn('text-sm leading-5', q.answered ? 'text-[var(--text-muted)] line-through' : 'text-[var(--foreground)]')}>
                          {q.question}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="mt-1 px-1 text-[10px] text-[var(--text-muted)]"
            title={new Date(createdAt).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}>
            {sender?.name} · {formatDate(createdAt, language)}
          </p>
        </div>
      </div>
    );
  }

  // ── Regular messages (Text, File, IntakeAnswer) ──
  return (
    <div className={cn('flex py-1 animate-fade-in', isOwnMessage ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[80%]', isOwnMessage ? 'items-end' : 'items-start')}>
        {/* Pin indicator */}
        {message.isPinned && (
          <div className={cn('mb-1 flex items-center gap-1.5 text-[10px] font-medium', isOwnMessage ? 'text-white/70 justify-end' : 'text-[var(--text-muted)] justify-start')}>
            <PinIcon className="h-3 w-3" filled={true} />
            <span>{t('chat.pinned', 'Đã ghim')}</span>
          </div>
        )}

        <div className={cn('flex items-end gap-2 group', isOwnMessage && 'flex-row-reverse')}>
          {!isOwnMessage && sender && (
            <Avatar src={sender.avatarUrl ?? undefined} name={sender.name || 'User'} size="sm" />
          )}
          <div className="min-w-0">
            <div
              className={cn(
                'rounded-2xl px-4 py-2.5',
                isOwnMessage
                  ? 'rounded-br-md bg-[var(--accent-indigo)] text-white'
                  : 'rounded-bl-md bg-[var(--surface-2)] text-[var(--foreground)]',
                type === 'IntakeAnswer' && !isOwnMessage && 'bg-[var(--accent-indigo)]/5 border border-[var(--accent-indigo)]/20',
                message.isPinned && 'ring-1 ring-[var(--accent-violet)]/30'
              )}
              title={new Date(createdAt).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}
            >
              {!isOwnMessage && sender && (
                <p className="mb-0.5 text-xs font-semibold text-[var(--accent-violet)]">{sender.name}</p>
              )}
              {type === 'IntakeAnswer' && !isOwnMessage && (
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-violet)] opacity-70">
                  {t('chat.answer')}
                </p>
              )}

              {/* Reply preview */}
              <ReplyPreview message={message} isOwn={isOwnMessage} />

              {/* Content: inline edit or markdown render */}
              {isEditing ? (
                <InlineEdit
                  initial={content || ''}
                  onSave={handleEdit}
                  onCancel={() => setIsEditing(false)}
                />
              ) : content ? (
                <p className="text-sm whitespace-pre-wrap">
                  <MarkdownContent text={content} />
                </p>
              ) : null}

              {files.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {files.map((file) => (
                    <FileAttachment key={file.id} file={file} isOwn={isOwnMessage} onImageLoad={onImageLoad} />
                  ))}
                </div>
              )}

              {/* Edited indicator */}
              {message.isEdited && !isEditing && (
                <p className={cn('mt-0.5 text-[10px]', isOwnMessage ? 'text-white/50' : 'text-[var(--text-muted)]')}>
                  ({t('chat.edited')})
                </p>
              )}
            </div>
            <ReactionPills message={message} userId={userId} onReaction={onReaction} />
          </div>

          {/* Action buttons */}
          {!isEditing && (type === 'Text' || type === 'IntakeAnswer' || type === 'File') && (
            <MessageActions
              message={message}
              isOwnMessage={isOwnMessage}
              canEdit={canEdit}
              canPin={canPin}
              onReply={onReply}
              onEdit={() => setIsEditing(true)}
              onPin={onPin ? () => onPin(message.id) : undefined}
              onReaction={onReaction}
            />
          )}
        </div>

        <p className={cn(
          'mt-1 px-1 text-[10px] text-[var(--text-muted)] flex items-center gap-0.5',
          isOwnMessage ? 'justify-end' : 'justify-start'
        )}>
          {formatDate(createdAt, language)}
          {/* Read receipt tick marks — only on own messages, only on last sent */}
          {isOwnMessage && isLastOwnMessage && (() => {
            const msgTime = new Date(message.createdAt).getTime();
            const seenBy = readers.filter(
              (r) => r.userId !== userId && new Date(r.lastReadAt).getTime() >= msgTime
            );
            const isSeen = seenBy.length > 0;
            return (
              <span
                className={cn('ml-0.5 font-bold tracking-tight', isSeen ? 'text-[var(--accent-violet)]' : 'text-[var(--text-muted)]')}
                title={isSeen ? 'Đã xem' : 'Đã gửi'}
              >
                {isSeen ? <><CheckIcon className="inline h-3 w-3" /><CheckIcon className="inline h-3 w-3 -ml-1.5" /></> : <CheckIcon className="inline h-3 w-3" />}
              </span>
            );
          })()}
        </p>
      </div>
    </div>
  );
}
