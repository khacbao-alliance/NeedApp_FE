'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  HubConnectionBuilder,
  HubConnection,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { getAccessToken, normalizeEnums } from '@/services/requests';
import type { MessageDto, ReadReceiptDto } from '@/types';

interface UseChatSignalROptions {
  requestId: string;
  /** false = don't connect (e.g. during intake phase) */
  enabled?: boolean;
  /** Called when a new message arrives via SignalR */
  onNewMessage?: (message: MessageDto) => void;
  /** Called when request status changes */
  onStatusChanged?: (status: string) => void;
  /** Called when a message is deleted */
  onMessageDeleted?: (messageId: string) => void;
  /** Called when a participant marks as read */
  onMessageRead?: (receipt: ReadReceiptDto) => void;
  /** Called when a message is edited */
  onMessageEdited?: (message: MessageDto) => void;
  /** Called when a message is pinned/unpinned */
  onMessagePinned?: (messageId: string, isPinned: boolean) => void;
}

interface TypingUser {
  userId: string;
  userName: string;
}

/**
 * Hook to manage SignalR connection for real-time chat.
 * 
 * - Connects to the chat hub with JWT auth
 * - Auto-reconnects with exponential backoff
 * - Joins/leaves request room automatically
 * - Handles typing indicators with auto-clear
 * 
 * Usage:
 * ```ts
 * const { isConnected, typingUsers, sendTyping } = useChatSignalR({
 *   requestId,
 *   enabled: request?.status !== 'Intake',
 *   onNewMessage: (msg) => setMessages(prev => [...prev, msg]),
 *   onStatusChanged: (status) => ...,
 * });
 * ```
 */
export function useChatSignalR({
  requestId,
  enabled = true,
  onNewMessage,
  onStatusChanged,
  onMessageDeleted,
  onMessageRead,
  onMessageEdited,
  onMessagePinned,
}: UseChatSignalROptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const connectionRef = useRef<HubConnection | null>(null);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Keep latest callbacks in refs to avoid re-creating connection on every render
  const onNewMessageRef = useRef(onNewMessage);
  const onStatusChangedRef = useRef(onStatusChanged);
  const onMessageDeletedRef = useRef(onMessageDeleted);
  const onMessageReadRef = useRef(onMessageRead);
  const onMessageEditedRef = useRef(onMessageEdited);
  const onMessagePinnedRef = useRef(onMessagePinned);

  useEffect(() => { onNewMessageRef.current = onNewMessage; }, [onNewMessage]);
  useEffect(() => { onStatusChangedRef.current = onStatusChanged; }, [onStatusChanged]);
  useEffect(() => { onMessageDeletedRef.current = onMessageDeleted; }, [onMessageDeleted]);
  useEffect(() => { onMessageReadRef.current = onMessageRead; }, [onMessageRead]);
  useEffect(() => { onMessageEditedRef.current = onMessageEdited; }, [onMessageEdited]);
  useEffect(() => { onMessagePinnedRef.current = onMessagePinned; }, [onMessagePinned]);

  // ── Build & manage connection ──
  useEffect(() => {
    if (!enabled || !requestId) return;

    const token = getAccessToken();
    if (!token) return;

    // Hub URL: strip /api from API URL, add /hubs/chat
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:44399/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    const hubUrl = `${baseUrl}/hubs/chat`;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => getAccessToken() || '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    // ── Server → Client events ──

    connection.on('NewMessage', (message: MessageDto) => {
      onNewMessageRef.current?.(normalizeEnums(message));
    });

    connection.on('MessageDeleted', ({ messageId }: { messageId: string }) => {
      onMessageDeletedRef.current?.(messageId);
    });

    connection.on('RequestStatusChanged', (data: { status: string | number }) => {
      // status might be a number from backend
      const normalized = normalizeEnums(data);
      onStatusChangedRef.current?.(String(normalized.status));
    });

    connection.on('UserTyping', ({ userId, userName }: { userId: string; userName: string }) => {
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === userId)) return prev;
        return [...prev, { userId, userName }];
      });

      // Clear typing after 3s
      const existing = typingTimeoutsRef.current.get(userId);
      if (existing) clearTimeout(existing);
      const timeout = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        typingTimeoutsRef.current.delete(userId);
      }, 3000);
      typingTimeoutsRef.current.set(userId, timeout);
    });

    connection.on('MessageEdited', (message: MessageDto) => {
      onMessageEditedRef.current?.(normalizeEnums(message));
    });

    connection.on('MessagePinned', ({ messageId, isPinned }: { messageId: string; isPinned: boolean }) => {
      onMessagePinnedRef.current?.(messageId, isPinned);
    });

    connection.on('Error', (error: string) => {
      console.error('[SignalR] Hub error:', error);
    });

    connection.on('MessageRead', (data: { userId: string; lastReadAt: string }) => {
      onMessageReadRef.current?.({ userId: data.userId, lastReadAt: data.lastReadAt });
    });

    connection.on('JoinedRequest', (reqId: string) => {
      console.debug('[SignalR] Joined request room:', reqId);
    });

    connection.on('LeftRequest', (reqId: string) => {
      console.debug('[SignalR] Left request room:', reqId);
    });

    // ── Connection lifecycle ──

    connection.onreconnecting(() => {
      setIsConnected(false);
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      // Re-join room after reconnect
      connection.invoke('JoinRequest', requestId).catch(() => {});
    });

    connection.onclose(() => {
      setIsConnected(false);
    });

    // ── Start ──

    connection
      .start()
      .then(() => {
        setIsConnected(true);
        return connection.invoke('JoinRequest', requestId);
      })
      .catch((err) => {
        console.error('[SignalR] Connection failed:', err);
      });

    // ── Cleanup ──

    return () => {
      // Clear all typing timeouts
      typingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      typingTimeoutsRef.current.clear();
      setTypingUsers([]);

      if (connection.state === HubConnectionState.Connected) {
        connection
          .invoke('LeaveRequest', requestId)
          .catch(() => {})
          .finally(() => connection.stop());
      } else {
        connection.stop();
      }
      connectionRef.current = null;
    };
  }, [requestId, enabled]);

  // ── Send typing indicator (debounced externally) ──
  const sendTyping = useCallback(() => {
    const conn = connectionRef.current;
    if (conn?.state === HubConnectionState.Connected) {
      conn.invoke('SendTyping', requestId).catch(() => {});
    }
  }, [requestId]);

  return {
    isConnected,
    typingUsers,
    sendTyping,
  };
}
