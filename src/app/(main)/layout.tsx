'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { ClientNavbar } from '@/components/layout/ClientNavbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { NotificationProvider } from '@/hooks/useNotifications';
import { NotificationToast } from '@/components/notifications/NotificationToast';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, hasClient, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Detect chat page: /requests/{uuid}
  const isChatPage = /^\/requests\/[a-f0-9-]+$/i.test(pathname);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (role === 'Client' && !hasClient) {
      router.replace('/setup-client');
    }
  }, [isAuthenticated, isLoading, hasClient, role, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent-violet)] border-t-transparent" />
          <p className="text-sm text-[var(--text-muted)]">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Client with hasClient → Navbar layout
  if (role === 'Client') {
    if (!hasClient) return null;
    return (
      <NotificationProvider>
        <NotificationToast>
          <div className="flex flex-col h-screen overflow-hidden">
            <ClientNavbar />
            <main className={`flex-1 min-h-0 ${isChatPage ? 'overflow-hidden' : 'overflow-y-auto'}`}>
              {isChatPage ? (
                children
              ) : (
                <>
                  <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 lg:px-8">
                    {children}
                  </div>
                  <Footer />
                </>
              )}
            </main>
          </div>
        </NotificationToast>
      </NotificationProvider>
    );
  }

  // Admin/Staff → Sidebar layout
  return (
    <NotificationProvider>
      <NotificationToast>
        <div className="flex h-screen overflow-hidden">
          <div className="hidden md:flex">
            <Sidebar />
          </div>

          <main className={`flex-1 min-h-0 ${isChatPage ? 'overflow-hidden' : 'overflow-y-auto pb-20 md:pb-0'}`}>
            {isChatPage ? (
              children
            ) : (
              <div className="px-6 py-6 lg:px-10">
                {children}
              </div>
            )}
          </main>

          <BottomNav />
        </div>
      </NotificationToast>
    </NotificationProvider>
  );
}
