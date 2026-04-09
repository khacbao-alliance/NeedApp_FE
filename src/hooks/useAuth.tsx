'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AuthResponse, UserDto, UserRole } from '@/types';
import { authService } from '@/services/auth';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/services/requests';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cached = typeof window !== 'undefined' && !!getAccessToken() ? getCachedUser() : null;
  const [user, setUser] = useState<UserDto | null>(cached);
  const [isLoading, setIsLoading] = useState(!cached);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      authService
        .me()
        .then((userData) => {
          setUser(userData);
          setCachedUser(userData);
        })
        .catch(() => {
          clearTokens();
          setCachedUser(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setCachedUser(null);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.loginAndStore(email, password);
    try {
      const fullUser = await authService.me();
      setUser(fullUser);
      setCachedUser(fullUser);
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
    }
    return res;
  }, []);

  const register = useCallback(async (data: { email: string; password: string; name?: string }) => {
    const res = await authService.registerAndStore(data);
    try {
      const fullUser = await authService.me();
      setUser(fullUser);
      setCachedUser(fullUser);
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
    }
    return res;
  }, []);

  const logout = useCallback(() => {
    const rt = getRefreshToken();
    if (rt) authService.logout(rt).catch(() => {});
    clearTokens();
    setCachedUser(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<UserDto>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    const res = await authService.googleLoginAndStore(idToken);
    try {
      const fullUser = await authService.me();
      setUser(fullUser);
      setCachedUser(fullUser);
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
