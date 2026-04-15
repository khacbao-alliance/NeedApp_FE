'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { messageService } from '@/services/messages';
import { fileService } from '@/services/files';
import { requestService } from '@/services/requestsApi';
import { useAuth } from '@/hooks/useAuth';
import { usePolling } from '@/hooks/usePolling';
import { useChatSignalR } from '@/hooks/useChatSignalR';
import { useNotifications } from '@/hooks/useNotifications';
import { showErrorToast } from '@/components/ui/ErrorToast';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { MissingInfoComposer } from '@/components/chat/MissingInfoComposer';
import { RequestStatusActions, AssignStaffAction, SelfAssignAction } from '@/components/chat/RequestActions';
import { ConversationSummaryDrawer } from '@/components/chat/ConversationSummaryDrawer';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import type { MessageDto, RequestDto, RequestStatus, ReadReceiptDto } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  SignalSlashIcon,
  ChartBarIcon,
  ClockIcon,
  ChevronDownIcon,
  HandRaisedIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export default function RequestChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, role } = useAuth();
  const requestId = params.id as string;
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { setActiveRequestId } = useNotifications();

  const [request, setRequest] = useState<RequestDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showMissingInfo, setShowMissingInfo] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [staffNotAssigned, setStaffNotAssigned] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [readers, setReaders] = useState<ReadReceiptDto[]>([]);

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
    enabled: !isIntake && !loading && !staffNotAssigned, // Only connect after intake + initial load + assigned
    onNewMessage: useCallback((message: MessageDto) => {
      setMessages((prev) => {
        // Dedupe by ID (may already exist from REST response)
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      // Mark this new message as read immediately
      messageService.markRead(requestId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestId]),
    onStatusChanged: useCallback((status: string) => {
      setRequest((prev) => prev ? { ...prev, status: status as RequestStatus } : null);
    }, []),
    onMessageDeleted: useCallback((messageId: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }, []),
    onMessageRead: useCallback((receipt: ReadReceiptDto) => {
      setReaders((prev) => {
        const filtered = prev.filter((r) => r.userId !== receipt.userId);
        return [...filtered, receipt];
      });
    }, []),
  });

  // ── Fetch request details ──
  useEffect(() => {
    requestService
      .getById(requestId)
      .then(setRequest)
      .catch((err: unknown) => {
        // If 403 or 404, user doesn't have access
        const status = (err as { status?: number })?.status;
        if (status === 403 || status === 404) {
          setAccessDenied(true);
        }
      });
  }, [requestId]);

  // ── Register active request for notification suppression + mark read ──
  useEffect(() => {
    setActiveRequestId(requestId);
    // Mark all messages as read when entering chat (skip if staff not assigned)
    if (!staffNotAssigned) {
      messageService.markRead(requestId).catch(() => {});
    }
    return () => setActiveRequestId(null);
  }, [requestId, setActiveRequestId, staffNotAssigned]);

  // ── Fetch messages (initial load) ──
  const fetchMessages = useCallback(async () => {
    try {
      const res = await messageService.list(requestId, undefined, 50);
      setMessages(res.items);
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
      if (res.readers) setReaders(res.readers);
      // Mark as read whenever we load messages
      messageService.markRead(requestId).catch(() => {});
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 403 && role === 'Staff') {
        // BE returns 403 when staff is not yet a participant (not assigned).
        // Show the self-assign prompt instead of the generic access-denied screen.
        setStaffNotAssigned(true);
      } else if (status === 403 || status === 404) {
        setAccessDenied(true);
      }
    } finally {
      setLoading(false);
    }
  }, [requestId, role]);

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
      interval: 8000,
      enabled: isIntake && !loading && !staffNotAssigned, // Only poll during Intake phase
      backgroundInterval: 60000,
    }
  );

  // ── Track scroll position ──
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
      wasNearBottomRef.current = nearBottom;
      setShowScrollBtn(!nearBottom);
      if (nearBottom) setNewMsgCount(0);
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
    } else {
      // User is scrolled up — increment new message count
      setNewMsgCount((c) => c + 1);
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
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      showErrorToast(msg || t('common.error', 'Có lỗi xảy ra'));
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
      showErrorToast(t('common.error', 'Có lỗi xảy ra'));
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
  // orderIndex is 0-based, so question 1 = (0+1)/total = 1/total
  const intakeProgress = intakeMeta
    ? ((intakeMeta.orderIndex + 1) / intakeMeta.totalQuestions) * 100
    : 0;

  // ── Access denied UI ──
  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="rounded-full bg-red-500/10 p-4">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {t('errors.accessDenied', 'Không có quyền truy cập')}
        </h2>
        <p className="text-sm text-[var(--text-muted)] text-center max-w-sm">
          {t('errors.accessDeniedDesc', 'Bạn không có quyền xem nội dung yêu cầu này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.')}
        </p>
        <Link
          href="/requests"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[var(--accent-violet)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('common.backToRequests', 'Quay lại danh sách')}
        </Link>
      </div>
    );
  }

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
            {request?.title || t('common.loading')}
          </h1>
          {/* Meta row: badges + client→staff + date pushed right */}
          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
            {request && (
              <>
                <StatusBadge status={request.status} />
                <PriorityBadge priority={request.priority} />

                {/* Client pill */}
                {request.client && (
                  <span className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    request.isClientActive
                      ? 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)]'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    <UserCircleIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className={!request.isClientActive ? 'line-through' : ''}>{request.client.name}</span>
                    {!request.isClientActive && (
                      <span className="text-[10px] font-normal">({t('requests.list.clientDissolved')})</span>
                    )}
                  </span>
                )}

                {/* Arrow → Staff assignment */}
                {request.client && (
                  <ArrowRightIcon className="hidden sm:inline h-3 w-3 flex-shrink-0 text-[var(--text-muted)]" />
                )}

                {/* Staff assigned pill */}
                {request.assignedUser ? (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-xs font-medium text-[var(--accent-violet)]">
                    <UserCircleIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-violet-400/60 font-normal">Staff:</span>
                    <span className="font-semibold">{request.assignedUser.name || 'Staff'}</span>
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                    <UserCircleIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    {t('requests.list.notAssigned')}
                  </span>
                )}

                {/* Creation time — right after staff pill */}
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
                  <ClockIcon className="h-3 w-3" />
                  {formatDate(request.createdAt, language)}
                </span>

                {/* SignalR connection status */}
                {!isIntake && (
                  <span className={`inline-flex items-center gap-0.5 text-[10px] ${
                    isConnected ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {isConnected ? (
                      <SignalIcon className="h-3 w-3" />
                    ) : (
                      <SignalSlashIcon className="h-3 w-3" />
                    )}
                    <span className="hidden sm:inline">{isConnected ? t('chat.live') : t('chat.connecting')}</span>
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Summary Button + Staff/Admin Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Summary button — visible for all roles once request is loaded */}
          {request && (
            <button
              onClick={() => setShowSummary(true)}
              title="Xem tóm tắt cuộc hội thoại"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--accent-violet)] bg-violet-500/10 hover:bg-violet-500/20 transition-colors border border-violet-500/20"
            >
              <ChartBarIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('chat.summary', 'Tóm tắt')}</span>
            </button>
          )}
          {request && <SelfAssignAction request={request} onUpdate={(updated) => {
            setRequest(updated);
            // Staff just self-assigned → unlock messages
            if (staffNotAssigned) {
              setStaffNotAssigned(false);
              fetchMessages();
            }
          }} />}
          {request && <AssignStaffAction request={request} onUpdate={(updated) => {
            setRequest(updated);
            // Admin assigned this staff → unlock messages if needed
            if (staffNotAssigned && updated.assignedUser?.id === user?.id) {
              setStaffNotAssigned(false);
              fetchMessages();
            }
          }} />}
        </div>
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
            <span>{t('chat.intakeProgress')}</span>
            <span>{t('chat.intakeOf', { current: intakeMeta.orderIndex + 1, total: intakeMeta.totalQuestions })}</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-cyan)] transition-all duration-500"
              style={{ width: `${intakeProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* #7 — Missing Info Banner (Client sees a prompt to provide info) */}
      {request?.status === 'MissingInfo' && role === 'Client' && (
        <div className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2.5 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300">
            {t('chat.missingInfoBanner', 'Vui lòng bổ sung thông tin được yêu cầu bên dưới để tiếp tục xử lí.')}
          </p>
        </div>
      )}

      {/* Staff Not Assigned — pre-assignment prompt */}
      {staffNotAssigned ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 p-8">
          <div className="rounded-full bg-violet-500/10 p-4">
            <HandRaisedIcon className="h-8 w-8 text-[var(--accent-violet)]" />
          </div>
          <h2 className="text-base font-semibold text-[var(--foreground)] text-center">
            {t('chat.notAssignedTitle', 'Yêu cầu chưa được nhận xử lí')}
          </h2>
          <p className="text-sm text-[var(--text-muted)] text-center max-w-sm">
            {t('chat.notAssignedDesc', 'Bạn cần nhận xử lí yêu cầu này để xem tin nhắn và tham gia cuộc hội thoại.')}
          </p>
          {request && !request.assignedUser && (
            <SelfAssignAction request={request} onUpdate={(updated) => {
              setRequest(updated);
              setStaffNotAssigned(false);
              fetchMessages();
            }} />
          )}
        </div>
      ) : (
      /* Messages */
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
              {t('chat.loadMore')}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-violet)] border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-[var(--text-muted)]">{t('chat.empty')}</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            // Determine if this is the last message sent by the current user
            // (only last own message shows the seen tick)
            const isLastOwnMessage =
              msg.sender?.id === user?.id &&
              !messages.slice(idx + 1).some((m) => m.sender?.id === user?.id);
            return (
              <ChatBubble
                key={msg.id}
                message={msg}
                isOwnMessage={msg.sender?.id === user?.id}
                requestId={requestId}
                userId={user?.id}
                readers={readers}
                isLastOwnMessage={isLastOwnMessage}
                onReaction={async (messageId, emoji) => {
                  try {
                    const res = await messageService.toggleReaction(requestId, messageId, emoji);
                    // Optimistic update
                    setMessages((prev) => prev.map((m) => {
                      if (m.id !== messageId) return m;
                      const currentReactions = m.reactions || [];
                      if (res.added) {
                        const existing = currentReactions.find((r) => r.emoji === emoji);
                        if (existing) {
                          return { ...m, reactions: currentReactions.map((r) => r.emoji === emoji ? { ...r, count: res.count, userIds: [...r.userIds, user?.id || ''] } : r) };
                        }
                        return { ...m, reactions: [...currentReactions, { emoji, count: 1, userIds: [user?.id || ''] }] };
                      } else {
                        const updated = currentReactions.map((r) => r.emoji === emoji ? { ...r, count: res.count, userIds: r.userIds.filter((id) => id !== user?.id) } : r).filter((r) => r.count > 0);
                        return { ...m, reactions: updated.length > 0 ? updated : null };
                      }
                    }));
                  } catch { /* ignore */ }
                }}
              />
            );
          })
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
              {typingUsers.map((u) => u.userName).join(', ')} {t('chat.typing')}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* Scroll to bottom FAB */}
        {showScrollBtn && (
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              setNewMsgCount(0);
            }}
            className="absolute bottom-4 right-4 z-10 flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-xs font-medium text-[var(--foreground)] shadow-xl transition-all hover:bg-[var(--surface-2)] animate-fade-in"
          >
            <ChevronDownIcon className="h-4 w-4" />
            {newMsgCount > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-indigo)] px-1.5 text-[10px] font-bold text-white">
                {newMsgCount}
              </span>
            )}
          </button>
        )}
      </div>
      )}

      {/* Input */}
      {staffNotAssigned ? null : request?.status === 'Done' || request?.status === 'Cancelled' ? (
        <div className="border-t border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            {request?.status === 'Done' ? t('chat.doneStatus') : t('chat.cancelledStatus')}
          </p>
        </div>
      ) : request && !request.isClientActive ? (
        <div className="border-t border-red-500/20 bg-red-500/5 px-4 py-3 text-center">
          <p className="text-xs text-red-400">
            {t('chat.clientDissolvedStatus')}
          </p>
        </div>
      ) : role === 'Admin' ? (
        // Admin is observer-only — cannot send messages (not a participant)
        <div className="border-t border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            {t('chat.adminObserverStatus', 'Bạn đang xem với tư cách Admin. Chỉ Staff được phân công mới có thể nhắn tin.')}
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
                  ? ((currentIntakeQuestion.metadata as { placeholder?: string }).placeholder || t('chat.answerPlaceholder'))
                  : t('chat.answerPlaceholder')
                : t('chat.messagePlaceholder')
            }
            disabled={sending}
            isIntake={isIntake}
          />
          {/* Missing Info toggle — Staff only, not Admin, not during Intake */}
          {role === 'Staff' && !isIntake && (
            <div className="border-t border-[var(--border)] bg-[var(--surface-1)] px-4 py-1.5 flex justify-end">
              <button
                onClick={() => setShowMissingInfo(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-400 transition-all hover:bg-amber-500/10 hover:border-amber-500/30"
              >
                <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                {t('chat.missingInfoToggle')}
              </button>
            </div>
          )}
        </>
      )}
      {/* Conversation Summary Drawer */}
      {showSummary && (
        <ConversationSummaryDrawer
          requestId={requestId}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}
