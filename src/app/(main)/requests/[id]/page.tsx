'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { messageService } from '@/services/messages';
import { fileService } from '@/services/files';
import { requestService } from '@/services/requestsApi';
import { useAuth } from '@/hooks/useAuth';
import { usePolling } from '@/hooks/usePolling';
import { useChatSignalR } from '@/hooks/useChatSignalR';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { MissingInfoComposer } from '@/components/chat/MissingInfoComposer';
import { RequestStatusActions, AssignStaffAction, SelfAssignAction } from '@/components/chat/RequestActions';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import type { MessageDto, RequestDto, RequestStatus } from '@/types';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  SignalSlashIcon,
} from '@heroicons/react/24/outline';

export default function RequestChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, role } = useAuth();
  const requestId = params.id as string;

  const [request, setRequest] = useState<RequestDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showMissingInfo, setShowMissingInfo] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const wasNearBottomRef = useRef(true);

  // Determine if currently in intake flow
  const isIntake = request?.status === 'Intake';
  const lastMessage = messages[messages.length - 1];
  const currentIntakeQuestion =
    isIntake && lastMessage?.type === 'IntakeQuestion' ? lastMessage : null;

  // ══════════════════════════════════════════════════════
  // SignalR — real-time chat (enabled AFTER intake phase)
  // ══════════════════════════════════════════════════════
  const { isConnected, typingUsers, sendTyping } = useChatSignalR({
    requestId,
    enabled: !isIntake && !loading, // Only connect after intake + initial load
    onNewMessage: useCallback((message: MessageDto) => {
      setMessages((prev) => {
        // Dedupe by ID (may already exist from REST response)
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    }, []),
    onStatusChanged: useCallback((status: string) => {
      setRequest((prev) => prev ? { ...prev, status: status as RequestStatus } : null);
    }, []),
    onMessageDeleted: useCallback((messageId: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }, []),
  });

  // ── Fetch request details ──
  useEffect(() => {
    requestService
      .getById(requestId)
      .then(setRequest)
      .catch(() => {});
  }, [requestId]);

  // ── Fetch messages (initial load) ──
  const fetchMessages = useCallback(async () => {
    try {
      const res = await messageService.list(requestId, undefined, 50);
      setMessages(res.items);
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ════════════════════════════════════════════════════════
  // Polling — ONLY during Intake phase (REST-based flow)
  // After intake, SignalR takes over for real-time updates
  // ════════════════════════════════════════════════════════
  usePolling(
    async () => {
      try {
        const res = await messageService.list(requestId, undefined, 50);
        setMessages((prev) => {
          if (
            res.items.length !== prev.length ||
            res.items[res.items.length - 1]?.id !== prev[prev.length - 1]?.id
          ) {
            return res.items;
          }
          return prev;
        });
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      } catch {
        // ignore
      }
    },
    {
      interval: 3000,
      enabled: isIntake && !loading, // Only poll during Intake phase
      backgroundInterval: 60000,
    }
  );

  // ── Track scroll position ──
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      wasNearBottomRef.current =
        container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Auto-scroll ──
  useEffect(() => {
    if (messages.length === 0) return;
    if (isFirstLoad.current) {
      messagesEndRef.current?.scrollIntoView();
      isFirstLoad.current = false;
      return;
    }
    if (wasNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ── Load older messages ──
  const loadMore = async () => {
    if (!hasMore || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await messageService.list(requestId, nextCursor, 20);
      setMessages((prev) => [...res.items, ...prev]);
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Send message ──
  const handleSend = async (content: string) => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const type = isIntake ? 'IntakeAnswer' : 'Text';
      const sentMsg = await messageService.send(requestId, { content, type });

      // For Intake: append locally + re-fetch for next question  
      // For Chat: append locally (SignalR will dedupe if it arrives again)
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });

      if (type === 'IntakeAnswer') {
        setTimeout(async () => {
          await fetchMessages();
          const updatedReq = await requestService.getById(requestId);
          setRequest(updatedReq);
        }, 1000);
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  // ── Upload files ──
  const handleFileUpload = async (files: File[]) => {
    try {
      await fileService.upload(requestId, files);
      // In non-SignalR mode (intake), re-fetch. In SignalR mode, it arrives via event.
      if (isIntake) {
        await fetchMessages();
      }
    } catch {
      // ignore
    }
  };

  // ── Handle typing (debounced) ──
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleTypingInput = useCallback(() => {
    if (isIntake) return; // No typing during intake
    if (typingTimeoutRef.current) return; // Already sent recently
    sendTyping();
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000); // Throttle: max once per 2s
  }, [isIntake, sendTyping]);

  // ── Intake progress ──
  const intakeMeta = currentIntakeQuestion?.metadata as {
    orderIndex: number;
    totalQuestions: number;
  } | null;
  const intakeProgress = intakeMeta
    ? (intakeMeta.orderIndex / intakeMeta.totalQuestions) * 100
    : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden" id="chat-page">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 rounded-t-2xl">
        <Link
          href="/requests"
          className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] md:hidden"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <Link
          href="/requests"
          className="hidden rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] md:flex"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-[var(--foreground)]">
            {request?.title || 'Đang tải...'}
          </h1>
          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
            {request && (
              <>
                <StatusBadge status={request.status} />
                <PriorityBadge priority={request.priority} />
                {request.client && (
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {request.client.name}
                  </span>
                )}
                {request.assignedUser && (
                  <span className="text-[10px] text-[var(--accent-violet)]">
                    → {request.assignedUser.name}
                  </span>
                )}
                {/* SignalR connection status (only show after intake) */}
                {!isIntake && (
                  <span className={`inline-flex items-center gap-0.5 text-[10px] ${
                    isConnected ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {isConnected ? (
                      <SignalIcon className="h-3 w-3" />
                    ) : (
                      <SignalSlashIcon className="h-3 w-3" />
                    )}
                    {isConnected ? 'Live' : 'Đang kết nối...'}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Staff/Admin Actions */}
        {request && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <SelfAssignAction request={request} onUpdate={setRequest} />
            <AssignStaffAction request={request} onUpdate={setRequest} />
          </div>
        )}
      </div>

      {/* Status Actions Bar (Staff/Admin only) */}
      {request && (role === 'Staff' || role === 'Admin') && (
        <div className="border-b border-[var(--border)] bg-[var(--surface-1)] px-4 py-2">
          <RequestStatusActions request={request} onUpdate={(updated) => {
            setRequest(updated);
          }} />
        </div>
      )}

      {/* Intake Progress Bar */}
      {isIntake && intakeMeta && (
        <div className="border-b border-[var(--border)] bg-[var(--surface-1)] px-4 py-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Tiến trình tiếp nhận</span>
            <span>{intakeMeta.orderIndex + 1}/{intakeMeta.totalQuestions} câu hỏi</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-cyan)] transition-all duration-500"
              style={{ width: `${intakeProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-1"
      >
        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center py-2">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
            >
              {loadingMore ? (
                <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowPathIcon className="h-3.5 w-3.5" />
              )}
              Tải thêm tin nhắn cũ
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-violet)] border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-[var(--text-muted)]">Chưa có tin nhắn nào</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isOwnMessage={msg.sender?.id === user?.id}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 py-1 animate-fade-in">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              {typingUsers.map((u) => u.userName).join(', ')} đang nhập...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {request?.status === 'Done' || request?.status === 'Cancelled' ? (
        <div className="border-t border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            {request?.status === 'Done' ? '✅ Yêu cầu đã hoàn tất' : '❌ Yêu cầu đã bị hủy'}
          </p>
        </div>
      ) : showMissingInfo ? (
        <MissingInfoComposer
          onSend={async (content, questions) => {
            const sentMsg = await messageService.sendMissingInfo(requestId, { content, questions });
            setShowMissingInfo(false);
            // Append message immediately (SignalR will dedupe if it arrives again)
            setMessages((prev) => {
              if (prev.some((m) => m.id === sentMsg.id)) return prev;
              return [...prev, sentMsg];
            });
            // Refresh request status (changes to MissingInfo)
            const updatedReq = await requestService.getById(requestId);
            setRequest(updatedReq);
          }}
          onCancel={() => setShowMissingInfo(false)}
        />
      ) : (
        <>
          <ChatInput
            onSend={handleSend}
            onFileUpload={handleFileUpload}
            onTyping={handleTypingInput}
            placeholder={
              isIntake
                ? currentIntakeQuestion?.metadata
                  ? ((currentIntakeQuestion.metadata as { placeholder?: string }).placeholder || 'Nhập câu trả lời...')
                  : 'Nhập câu trả lời...'
                : 'Nhập tin nhắn...'
            }
            disabled={sending}
            isIntake={isIntake}
          />
          {/* Missing Info toggle (Staff/Admin only, not during Intake) */}
          {(role === 'Staff' || role === 'Admin') && !isIntake && (
            <div className="border-t border-[var(--border)] bg-[var(--surface-1)] px-4 py-1.5 flex justify-end">
              <button
                onClick={() => setShowMissingInfo(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium text-amber-400/60 transition-all hover:text-amber-400 hover:bg-amber-500/10"
              >
                <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                Yêu cầu bổ sung thông tin
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
