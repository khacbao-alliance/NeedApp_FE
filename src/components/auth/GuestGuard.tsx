'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// Pages where authenticated users should not be allowed
const GUEST_ONLY = ['/login', '/register'];

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, role, hasClient } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isGuestOnly = GUEST_ONLY.includes(pathname);

  useEffect(() => {
    if (!isGuestOnly || isLoading || !isAuthenticated) return;
    if (role === 'Client') {
      router.replace(hasClient ? '/' : '/setup-client');
    } else {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, role, hasClient, router, isGuestOnly]);

  // Block guest-only pages when authenticated (middleware handles server-side,
  // this handles client-side navigation fallback)
  if (isGuestOnly && (isLoading || isAuthenticated)) return null;

  return <>{children}</>;
}
