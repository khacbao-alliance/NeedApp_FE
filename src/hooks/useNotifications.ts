'use client';

import { createElement } from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr';
import type { HubConnection } from '@microsoft/signalr';
import { getAccessToken } from '@/services/requests';
import { notificationService } from '@/services/notifications';
import { useAuth } from '@/hooks/useAuth';
import type { NotificationDto, NotificationType } from '@/types';

const NOTIFICATION_TYPE_MAP: NotificationType[] = [
  'NewMessage', 'MissingInfo', 'StatusChange', 'Assignment', 'NewRequest', 'Invitation', 'IntakeAnswerEdited',
];

function normalizeNotification(raw: Record<string, unknown>): NotificationDto {
  const type = typeof raw.type === 'number'
    ? (NOTIFICATION_TYPE_MAP[raw.type] ?? raw.type)
    : raw.type;
  return { ...raw, type } as NotificationDto;
}

interface NotificationContextType {
  notifications: NotificationDto[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  latestRealTimeNotification: NotificationDto | null;
  activeRequestId: string | null;
  setActiveRequestId: (id: string | null) => void;
  fetchMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  isLoading: false,
  latestRealTimeNotification: null,
  activeRequestId: null,
  setActiveRequestId: () => { },
  fetchMore: async () => { },
  markAsRead: async () => { },
  markAllAsRead: async () => { },
  refresh: async () => { },
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [latestRealTimeNotification, setLatestRealTimeNotification] = useState<NotificationDto | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const mountedRef = useRef(true);
  const pageRef = useRef(1);

  const fetchNotifications = useCallback(async (pageNum = 1) => {
    try {
      setIsLoading(true);
      const [notifs, countResult] = await Promise.all([
        notificationService.getAll(pageNum, 20),
        notificationService.getUnreadCount(),
      ]);
      if (!mountedRef.current) return;
      if (pageNum === 1) {
        setNotifications(notifs);
      } else {
        setNotifications(prev => [...prev, ...notifs]);
      }
      setUnreadCount(countResult.count);
      setPage(pageNum);
      pageRef.current = pageNum;
    } catch {
      // silent
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => fetchNotifications(1), [fetchNotifications]);

  const fetchMore = useCallback(async () => {
    await fetchNotifications(pageRef.current + 1);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }, []);

  // When user enters a chat page, mark all notifications for that request as read
  const handleSetActiveRequestId = useCallback(async (id: string | null) => {
    setActiveRequestId(id);
    if (!id) return;
    try {
      await notificationService.markAsReadByRequest(id);
      // Update local state: mark matching notifications as read
      setNotifications(prev => {
        const changed = prev.filter(n => n.referenceId === id && !n.isRead).length;
        if (changed > 0) {
          // Update unread count separately to avoid nested state update issues
          setUnreadCount(c => Math.max(0, c - changed));
        }
        return prev.map(n =>
          n.referenceId === id && !n.isRead ? { ...n, isRead: true } : n
        );
      });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!isAuthenticated) return;

    const token = getAccessToken();
    if (!token) return;

    fetchNotifications(1);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:44399/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    const hubUrl = `${baseUrl}/hubs/notifications`;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => getAccessToken() || '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.None)
      .build();

    connectionRef.current = connection;

    connection.on('NewNotification', (raw: NotificationDto) => {
      if (mountedRef.current) {
        // SignalR sends raw data with numeric enums — normalize to string enums
        const notification = normalizeNotification(raw as unknown as Record<string, unknown>);
        setNotifications(prev => [notification, ...prev]);
        setLatestRealTimeNotification(notification);
      }
    });

    connection.on('UnreadCountChanged', ({ count }: { count: number }) => {
      if (mountedRef.current) setUnreadCount(count);
    });

    connection.onreconnecting(() => { if (mountedRef.current) setIsConnected(false); });
    connection.onreconnected(() => {
      if (mountedRef.current) { setIsConnected(true); fetchNotifications(1); }
    });
    connection.onclose(() => { if (mountedRef.current) setIsConnected(false); });

    connection
      .start()
      .then(() => { if (mountedRef.current) setIsConnected(true); })
      .catch(() => { /* backend may not be running */ });

    return () => {
      mountedRef.current = false;
      connectionRef.current = null;
      connection.stop().catch(() => { });
    };
  }, [isAuthenticated, fetchNotifications]);

  // Use createElement instead of JSX to avoid needing .tsx extension
  return createElement(
    NotificationContext.Provider,
    {
      value: {
        notifications,
        unreadCount,
        isConnected,
        isLoading,
        latestRealTimeNotification,
        activeRequestId,
        setActiveRequestId: handleSetActiveRequestId,
        fetchMore,
        markAsRead,
        markAllAsRead,
        refresh,
      },
    },
    children
  );
}

/**
 * Hook to use the shared notification context.
 * Must be used within a NotificationProvider.
 */
export function useNotifications() {
  return useContext(NotificationContext);
}
