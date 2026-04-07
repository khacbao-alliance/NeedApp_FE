'use client';

import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useState } from 'react';

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => Promise<void>;
}

export function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      setError('Không nhận được thông tin xác thực từ Google.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSuccess(idToken);
    } catch {
      setError('Google sign-in thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-muted)]">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-indigo)] border-t-transparent" />
        Đang xử lý...
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Overlay: hidden GoogleLogin provides the real click handler */}
      <div className="relative w-full overflow-hidden rounded-xl">
        {/* Visible custom button */}
        <div
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition-all duration-200 hover:bg-[var(--surface-1)] hover:border-[var(--glass-border)] hover:shadow-sm select-none"
          id="google-signin-custom-btn"
        >
          {/* Google colorful icon */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
            <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
            <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
            <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
          </svg>
          <span>Tiếp tục với Google</span>
        </div>

        {/* Real GoogleLogin iframe — invisible but covers the button to intercept clicks */}
        <div
          className="absolute inset-0 opacity-0"
          style={{ pointerEvents: 'auto' }}
        >
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setError('Google sign-in thất bại. Vui lòng thử lại.')}
            theme="filled_black"
            shape="rectangular"
            size="large"
            width={500}
            type="standard"
          />
        </div>
      </div>

      {error && (
        <p className="mt-2 text-center text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
