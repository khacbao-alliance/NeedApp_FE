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
import { IntakeFormPanel } from '@/components/chat/IntakeFormPanel';
import { RequestStatusActions, AssignStaffAction, SelfAssignAction } from '@/components/chat/RequestActions';
import { ConversationSummaryDrawer } from '@/components/chat/ConversationSummaryDrawer';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import type { MessageDto, RequestDto, RequestStatus, ReadReceiptDto } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  SignalSlashIcon,
  ChartBarIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HandRaisedIcon,
  UserCircleIcon,
  FireIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
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
  const [replyToMessage, setReplyToMessage] = useState<MessageDto | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [staffNotAssigned, setStaffNotAssigned] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [readers, setReaders] = useState<ReadReceiptDto[]>([]);
  const [showHeaderMeta, setShowHeaderMeta] = useState(false); // Issue 8: mobile header meta toggle

  // ── In-chat search ──
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]); // message IDs
  const [searchIndex, setSearchIndex] = useState(0);
  const [searching, setSearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const wasNearBottomRef = useRef(true);
  const shouldScrollRef = useRef(false); // tracks whether we want auto-scroll (for ResizeObserver)

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
    enabled: !loading && !staffNotAssigned, // Connect as soon as page loads — active in ALL phases
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
    onMessageEdited: useCallback((edited: MessageDto) => {
      setMessages((prev) => prev.map((m) => m.id === edited.id ? { ...m, content: edited.content, isEdited: edited.isEdited, editedAt: edited.editedAt } : m));
    }, []),
    onMessagePinned: useCallback((messageId: string, isPinned: boolean) => {
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, isPinned } : m));
    }, []),
  });

  // ── Fetch request details ──
  useEffect(() => {
    requestService
      .getById(requestId)
      .then(setRequest)
      .catch((err: unknown) => {
        const status = (err as { status?: number })?.status;
        if (status === 403) {
          setAccessDenied(true);
        } else if (status === 404) {
          setNotFound(true);
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
      } else if (status === 403) {
        setAccessDenied(true);
      } else if (status === 404) {
        setNotFound(true);
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
      enabled: false, // SignalR now handles intake phase too — this polling is no longer needed
      backgroundInterval: 60000,
    }
  );

  // ── Fallback polling — when SignalR is not connected (non-intake) ──
  // Detects pin/edit/new-message changes that SignalR missed.
  usePolling(
    useCallback(async () => {
      try {
        const res = await messageService.list(requestId, undefined, 50);
        setMessages((prev) => {
          const changed =
            res.items.length !== prev.length ||
            res.items.some((m) => {
              const old = prev.find((p) => p.id === m.id);
              return !old || old.isPinned !== m.isPinned || old.isEdited !== m.isEdited || old.content !== m.content;
            });
          return changed ? res.items : prev;
        });
      } catch { /* ignore */ }
    }, [requestId]),
    {
      interval: 30000, // 30s fallback for any missed SignalR events (edits, pins, new messages)
      enabled: !isConnected && !loading && !staffNotAssigned,
      backgroundInterval: 120000,
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
      // User was near bottom → auto-scroll to new message
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setNewMsgCount(0);
      // Let ResizeObserver keep scrolling for up to 2s (for images loading)
      shouldScrollRef.current = true;
      const t = setTimeout(() => { shouldScrollRef.current = false; }, 2000);
      return () => clearTimeout(t);
    } else {
      // User is scrolled up reading old messages → show badge, don’t disturb
      setNewMsgCount((c) => c + 1);
      shouldScrollRef.current = false;
    }
  }, [messages]);

  // ── ResizeObserver: cuộn đến cuối khi ảnh/nội dung load xong làm tăng chiều cao container ──
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      if (shouldScrollRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

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

  // ── Edit message ──
  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const updated = await messageService.editMessage(requestId, messageId, newContent);
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, content: updated.content, isEdited: updated.isEdited, editedAt: updated.editedAt } : m));
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      showErrorToast(msg || t('common.error', 'Có lỗi xảy ra'));
    }
  };

  // ── Pin message ──
  const handlePinMessage = async (messageId: string) => {
    // Optimistic toggle so the banner updates immediately
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, isPinned: !m.isPinned } : m));
    try {
      const updated = await messageService.pinMessage(requestId, messageId);
      // Reconcile with server truth after API confirms
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, isPinned: updated.isPinned } : m));
    } catch (err: unknown) {
      // Revert optimistic update
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, isPinned: !m.isPinned } : m));
      const msg = (err as { message?: string })?.message;
      showErrorToast(msg || t('common.error', 'Có lỗi xảy ra'));
    }
  };

  // ── Send message ──
  const handleSend = async (content: string, replyToId?: string) => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const type = isIntake ? 'IntakeAnswer' : 'Text';
      const sentMsg = await messageService.send(requestId, { content, type, replyToId });

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

  // ── Not Found UI ──
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="rounded-full bg-[var(--surface-2)] p-4">
          <DocumentTextIcon className="h-8 w-8 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {t('errors.requestNotFound', 'Không tìm thấy yêu cầu')}
        </h2>
        <p className="text-sm text-[var(--text-muted)] text-center max-w-sm">
          {t('errors.requestNotFoundDesc', 'Yêu cầu này không tồn tại hoặc đã bị xóa. Thông báo liên quan có thể đã lỗi thời.')}
        </p>
        <Link
          href="/requests"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('common.backToRequests', 'Quay lại danh sách')}
        </Link>
      </div>
    );
  }

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
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
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
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold text-[var(--foreground)]">
              {request?.title || t('common.loading')}
            </h1>
            {/* Mobile: toggle meta row */}
            {request && (
              <button
                onClick={() => setShowHeaderMeta(!showHeaderMeta)}
                className="md:hidden flex-shrink-0 rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                title={showHeaderMeta ? 'Ẩn chi tiết' : 'Xem chi tiết'}
              >
                <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${showHeaderMeta ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
          {/* Meta row: visible always on desktop (md+), toggle on mobile */}
          <div className={`mt-0.5 flex items-center gap-2 flex-wrap ${
            showHeaderMeta ? 'flex' : 'hidden md:flex'
          }`}>
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
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-2.5 py-0.5 text-xs font-medium text-[var(--accent-primary)]">
                    <UserCircleIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-[var(--accent-primary)]/60 font-normal">Staff:</span>
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

                {/* Deadline badge */}
                {request.dueDate && (
                  <DeadlineBadge dueDate={request.dueDate} isOverdue={request.isOverdue} />
                )}

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
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 transition-colors border border-[var(--accent-primary)]/20"
            >
              <ChartBarIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('chat.summary', 'Tóm tắt')}</span>
            </button>
          )}
          {/* Chat search toggle */}
          {request && (
            <button
              onClick={() => { setChatSearchOpen(!chatSearchOpen); setChatSearchQuery(''); setSearchResults([]); }}
              title={t('chat.searchMessages', 'Tìm tin nhắn')}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors border ${
                chatSearchOpen
                  ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/20'
                  : 'text-[var(--text-secondary)] bg-[var(--surface-2)] border-[var(--border)] hover:text-[var(--foreground)]'
              }`}
            >
              <MagnifyingGlassIcon className="h-3.5 w-3.5" />
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

      {/* ── In-Chat Search Bar ── */}
      {chatSearchOpen && (
        <div className="border-b border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 flex items-center gap-2 animate-fade-in">
          <MagnifyingGlassIcon className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
          <input
            type="text"
            value={chatSearchQuery}
            onChange={(e) => setChatSearchQuery(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && chatSearchQuery.trim()) {
                setSearching(true);
                try {
                  const results = await requestService.searchMessages(requestId, chatSearchQuery.trim());
                  const ids = results.map(m => m.id);
                  setSearchResults(ids);
                  setSearchIndex(0);
                  // Scroll to first result
                  if (ids.length > 0) {
                    document.getElementById(`msg-${ids[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                } catch { /* ignore */ }
                finally { setSearching(false); }
              }
            }}
            placeholder={t('chat.searchPlaceholder', 'Tìm trong cuộc hội thoại...')}
            className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none"
            autoFocus
          />
          {searching && <ArrowPathIcon className="h-4 w-4 text-[var(--text-muted)] animate-spin" />}
          {searchResults.length > 0 && (
            <>
              <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                {searchIndex + 1}/{searchResults.length}
              </span>
              <button
                onClick={() => {
                  const prev = (searchIndex - 1 + searchResults.length) % searchResults.length;
                  setSearchIndex(prev);
                  document.getElementById(`msg-${searchResults[prev]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <ChevronUpIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  const next = (searchIndex + 1) % searchResults.length;
                  setSearchIndex(next);
                  document.getElementById(`msg-${searchResults[next]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </button>
            </>
          )}
          {chatSearchQuery && searchResults.length === 0 && !searching && (
            <span className="text-xs text-[var(--text-muted)]">{t('chat.noResults', 'Không tìm thấy')}</span>
          )}
          <button
            onClick={() => { setChatSearchOpen(false); setChatSearchQuery(''); setSearchResults([]); }}
            className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

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
              className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-500"
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
          <div className="rounded-full bg-[var(--accent-primary)]/10 p-4">
            <HandRaisedIcon className="h-8 w-8 text-[var(--accent-primary)]" />
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
      <>
      {/* Pinned messages banner */}
      {(() => {
        const pinned = messages.filter((m) => m.isPinned);
        if (!pinned.length) return null;
        return (
          <div className="mx-4 mt-3 mb-1 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg shadow-sm animate-fade-in flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-2)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--text-muted)]">
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                <path fillRule="evenodd" clipRule="evenodd" d="M13.5 17v5a1.5 1.5 0 0 1-3 0v-5h3Z" />
              </svg>
              <span className="text-[11px] font-semibold text-[var(--foreground)] uppercase tracking-wide">
                {t('chat.pinnedMessages', 'Tin nhắn đã ghim')}
              </span>
              <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-3)] text-[var(--text-secondary)] border border-[var(--border)]">
                {pinned.length}
              </span>
            </div>
            <div className="max-h-[80px] overflow-y-auto px-1 py-1 space-y-0.5 scrollbar-thin scrollbar-thumb-[var(--border)]">
              {pinned.map((m) => (
                <button key={m.id} onClick={() => document.getElementById(`msg-${m.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="block w-full text-left text-sm hover:bg-[var(--surface-2)] px-2 py-1.5 rounded transition-colors group flex items-baseline gap-2">
                  <span className="font-semibold text-[var(--text-secondary)] flex-shrink-0 text-[13px]">{m.sender?.name || 'Unknown'}:</span>
                  <span className="text-[var(--text-muted)] group-hover:text-[var(--foreground)] line-clamp-1 break-all whitespace-normal text-[13px]">{m.content || '📎 File đính kèm'}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })()}
      {/* Messages + FAB scroll button wrapper */}
      <div className="relative flex-1 min-h-0 flex flex-col">
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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-[var(--text-muted)]">{t('chat.empty')}</p>
          </div>
        ) : (
          messages
            .filter((m) => m.type !== 'IntakeQuestion' && m.type !== 'IntakeAnswer')
            .map((msg, idx, filteredArray) => {
            // Determine if this is the last message sent by the current user
            // (only last own message shows the seen tick)
            const isLastOwnMessage =
              msg.sender?.id === user?.id &&
              !filteredArray.slice(idx + 1).some((m) => m.sender?.id === user?.id);
            const isSearchMatch = searchResults.includes(msg.id);
            const isCurrentSearchTarget = searchResults[searchIndex] === msg.id;
            return (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={`transition-all duration-300 rounded-lg ${
                  isCurrentSearchTarget
                    ? 'ring-2 ring-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                    : isSearchMatch
                    ? 'ring-1 ring-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/[0.02]'
                    : ''
                }`}
              >
                <ChatBubble
                  message={msg}
                  isOwnMessage={msg.sender?.id === user?.id}
                  requestId={requestId}
                  userId={user?.id}
                  readers={readers}
                  isLastOwnMessage={isLastOwnMessage}
                  canPin={true} // Since Intake messages are separated, we can always allow pinning for text messages
                  onReply={(m) => setReplyToMessage(m)}
                  onEdit={handleEditMessage}
                  onPin={handlePinMessage}
                  onReaction={async (messageId, emoji) => {
                    try {
                      const res = await messageService.toggleReaction(requestId, messageId, emoji);
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
                  onImageLoad={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                />
              </div>
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
      </div>

      {/* Scroll to bottom FAB — shows when user scrolls up */}
      {showScrollBtn && (
        <button
          onClick={() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setNewMsgCount(0);
          }}
          className="absolute bottom-6 right-6 z-20 flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-1)] shadow-2xl shadow-black/20 px-3.5 py-2.5 text-xs font-medium text-[var(--foreground)] transition-all hover:bg-[var(--surface-2)] hover:shadow-black/30 animate-fade-in backdrop-blur-sm"
          >
            <ChevronDownIcon className="h-4 w-4" />
            {newMsgCount > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--accent-primary)] px-1.5 text-[10px] font-bold text-white">
                {newMsgCount}
              </span>
            )}
          </button>
        )}
      </div>
      </>
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
      ) : role === 'Staff' && request?.assignedUser && request.assignedUser.id !== user?.id ? (
        // Staff viewing a request assigned to another staff — cannot send messages
        <div className="border-t border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            {t('chat.staffNotParticipant', 'Bạn không phải là staff được phân công cho yêu cầu này.')}
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
        <div className="flex flex-col flex-shrink-0">
          {messages.some(m => m.type === 'IntakeQuestion') && (
            <IntakeFormPanel
              messages={messages}
              requestId={requestId}
              // Issue 4: Always show intake panel — only lock on terminal states
              isReadOnly={request?.status === 'Done' || request?.status === 'Cancelled'}
              onAnswerSubmit={async (content, questionMessageId) => {
                const sentMsg = await messageService.send(requestId, {
                  content,
                  type: 'IntakeAnswer',
                  replyToId: questionMessageId,
                });
                setMessages((prev) => [...prev, sentMsg]);
              }}
              onAnswerEdit={handleEditMessage}
            />
          )}
          <ChatInput
            onSend={handleSend}
            onFileUpload={handleFileUpload}
            onTyping={handleTypingInput}
            replyToMessage={replyToMessage}
            onCancelReply={() => setReplyToMessage(null)}
            placeholder={t('chat.messagePlaceholder')}
            disabled={sending}
            isIntake={false}
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
        </div>
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

function DeadlineBadge({ dueDate, isOverdue }: { dueDate: string; isOverdue: boolean }) {
  const due = new Date(dueDate);
  const now = new Date();
  const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/15 border border-red-500/25 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
        <FireIcon className="h-3 w-3" />
        <span className="hidden sm:inline">Overdue</span>
      </span>
    );
  }

  if (hoursLeft > 0 && hoursLeft < 24) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
        <ClockIcon className="h-3 w-3" />
        {hoursLeft < 1 ? `${Math.max(1, Math.round(hoursLeft * 60))}m` : `${Math.round(hoursLeft)}h`}
      </span>
    );
  }

  // Show due date for non-urgent
  const daysLeft = Math.ceil(hoursLeft / 24);
  return (
    <span className="hidden sm:inline-flex items-center gap-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
      <ClockIcon className="h-3 w-3" />
      {daysLeft}d left
    </span>
  );
}
