import { api, setTokens } from './requests';
import type { AuthResponse, UserDto } from '@/types';

export const authService = {
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  register: (data: { email: string; password: string; name?: string }) =>
    api.post<AuthResponse>('/auth/register', data),

  googleLogin: (idToken: string) =>
    api.post<AuthResponse>('/auth/google', { idToken }),

  refreshToken: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh-token', { refreshToken }),

  logout: (refreshToken: string) =>
    api.post<void>('/auth/logout', { refreshToken }),

  me: () => api.get<UserDto>('/auth/me'),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (data: { email: string; otpCode: string; newPassword: string }) =>
    api.post<void>('/auth/reset-password', data),

  /** Helper — login and store tokens */
  async loginAndStore(email: string, password: string): Promise<AuthResponse> {
    const res = await this.login({ email, password });
    setTokens(res.accessToken, res.refreshToken);
    return res;
  },

  /** Helper — register and store tokens */
  async registerAndStore(data: { email: string; password: string; name?: string }): Promise<AuthResponse> {
    const res = await this.register(data);
    setTokens(res.accessToken, res.refreshToken);
    return res;
  },
};
