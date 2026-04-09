'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AuthResponse, UserDto, UserRole } from '@/types';
import { authService } from '@/services/auth';
import { clearTokens, getAccessToken, getRefreshToken, isTokenExpired, setTokens } from '@/services/requests';

interface AuthContextType {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasClient: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (data: { email: string; password: string; name?: string }) => Promise<AuthResponse>;
  googleLogin: (idToken: string) => Promise<AuthResponse>;
  logout: () => void;
  updateUser: (user: Partial<UserDto>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_CACHE_KEY = 'user_cache';

function getCachedUser(): UserDto | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as UserDto) : null;
  } catch {
    return null;
  }
}

function setCachedUser(user: UserDto | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_CACHE_KEY);
  }
}

// Lightweight cookies read by middleware to redirect authenticated users
// away from /login and /register before React even renders (no flash).
function setAuthCookies(role: string, hasClient: boolean) {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  document.cookie = `auth_flag=1; path=/; SameSite=Lax; max-age=${maxAge}`;
  document.cookie = `auth_role=${role}; path=/; SameSite=Lax; max-age=${maxAge}`;
  document.cookie = `auth_has_client=${hasClient ? '1' : '0'}; path=/; SameSite=Lax; max-age=${maxAge}`;
}

function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'auth_flag=; path=/; max-age=0';
  document.cookie = 'auth_role=; path=/; max-age=0';
  document.cookie = 'auth_has_client=; path=/; max-age=0';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setCachedUser(null);
      setUser(null);
      setIsLoading(false);
      return;
    }

    const cached = getCachedUser();
    if (cached) {
      setUser(cached);
      setIsLoading(false);
      setAuthCookies(cached.role, cached.hasClient);

      // Token still valid + cache exists: skip API call entirely.
      // This prevents race conditions when reloading rapidly with refresh token rotation.
      if (!isTokenExpired(token)) {
        return;
      }
    }

    // Token expired or no cache — verify with API (triggers refresh if needed)
    authService
      .me()
      .then((userData) => {
        setUser(userData);
        setCachedUser(userData);
        setAuthCookies(userData.role, userData.hasClient);
      })
      .catch((err: { status?: number }) => {
        // Only clear auth state on 401 (requests.ts already cleared tokens + redirected).
        // For network errors or transient failures, keep cached state to avoid spurious logouts.
        if (err?.status === 401) {
          setCachedUser(null);
          setUser(null);
          clearAuthCookies();
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.loginAndStore(email, password);
    try {
      const fullUser = await authService.me();
      setUser(fullUser);
      setCachedUser(fullUser);
      setAuthCookies(fullUser.role, fullUser.hasClient);
    } catch {
      const u: UserDto = {
        id: res.userId,
        email: res.email,
        name: res.name,
        role: res.role,
        hasClient: res.hasClient,
        avatarUrl: res.avatarUrl,
      };
      setUser(u);
      setCachedUser(u);
      setAuthCookies(u.role, u.hasClient);
    }
    return res;
  }, []);

  const register = useCallback(async (data: { email: string; password: string; name?: string }) => {
    const res = await authService.registerAndStore(data);
    try {
      const fullUser = await authService.me();
      setUser(fullUser);
      setCachedUser(fullUser);
      setAuthCookies(fullUser.role, fullUser.hasClient);
    } catch {
      const u: UserDto = {
        id: res.userId,
        email: res.email,
        name: res.name,
        role: res.role,
        hasClient: res.hasClient,
        avatarUrl: res.avatarUrl,
      };
      setUser(u);
      setCachedUser(u);
      setAuthCookies(u.role, u.hasClient);
    }
    return res;
  }, []);

  const logout = useCallback(() => {
    const rt = getRefreshToken();
    if (rt) authService.logout(rt).catch(() => {});
    clearTokens();
    setCachedUser(null);
    setUser(null);
    clearAuthCookies();
  }, []);

  const updateUser = useCallback((updates: Partial<UserDto>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updates };
      setCachedUser(next);
      setAuthCookies(next.role, next.hasClient);
      return next;
    });
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    const res = await authService.googleLoginAndStore(idToken);
    try {
      const fullUser = await authService.me();
      setUser(fullUser);
      setCachedUser(fullUser);
      setAuthCookies(fullUser.role, fullUser.hasClient);
    } catch {
      const u: UserDto = {
        id: res.userId,
        email: res.email,
        name: res.name,
        role: res.role,
        hasClient: res.hasClient,
        avatarUrl: res.avatarUrl,
      };
      setUser(u);
      setCachedUser(u);
      setAuthCookies(u.role, u.hasClient);
    }
    return res;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        hasClient: user?.hasClient ?? false,
        role: user?.role ?? null,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
