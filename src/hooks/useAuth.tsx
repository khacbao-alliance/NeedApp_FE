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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      authService
        .me()
        .then((userData) => setUser(userData))
        .catch(() => {
          clearTokens();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.loginAndStore(email, password);
    // Fetch full profile so user.client is populated immediately (no F5 needed)
    try {
      const fullUser = await authService.me();
      setUser(fullUser);
    } catch {
      setUser({
        id: res.userId,
        email: res.email,
        name: res.name,
        role: res.role,
        hasClient: res.hasClient,
        avatarUrl: res.avatarUrl,
      });
    }
    return res;
  }, []);

  const register = useCallback(async (data: { email: string; password: string; name?: string }) => {
    const res = await authService.registerAndStore(data);
    // Fetch full profile so user.client is populated immediately (no F5 needed)
    try {
      const fullUser = await authService.me();
      setUser(fullUser);
    } catch {
      setUser({
        id: res.userId,
        email: res.email,
        name: res.name,
        role: res.role,
        hasClient: res.hasClient,
        avatarUrl: res.avatarUrl,
      });
    }
    return res;
  }, []);

  const logout = useCallback(() => {
    const rt = getRefreshToken();
    if (rt) authService.logout(rt).catch(() => {});
    clearTokens();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<UserDto>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    const res = await authService.googleLoginAndStore(idToken);
    // Fetch full profile so user.client is populated immediately
    try {
      const fullUser = await authService.me();
      setUser(fullUser);
    } catch {
      setUser({
        id: res.userId,
        email: res.email,
        name: res.name,
        role: res.role,
        hasClient: res.hasClient,
        avatarUrl: res.avatarUrl,
      });
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
