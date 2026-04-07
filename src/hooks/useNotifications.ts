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
import type { NotificationDto } from '@/types';

interface NotificationContextType {
  notifications: NotificationDto[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  latestRealTimeNotification: NotificationDto | null;
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
  fetchMore: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  refresh: async () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [latestRealTimeNotification, setLatestRealTimeNotification] = useState<NotificationDto | null>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const mountedRef = useRef(true);

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
    } catch {
      // silent
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => fetchNotifications(1), [fetchNotifications]);

  const fetchMore = useCallback(async () => {
    await fetchNotifications(page + 1);
  }, [fetchNotifications, page]);

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

    connection.on('NewNotification', (notification: NotificationDto) => {
      if (mountedRef.current) {
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
      connection.stop().catch(() => {});
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
