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
      setError('Google sign-in failed: no credential received.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSuccess(idToken);
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text-muted)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-indigo)] border-t-transparent" />
          Đang xử lý...
        </div>
      ) : (
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setError('Google sign-in failed. Please try again.')}
            theme="filled_black"
            shape="rectangular"
            size="large"
            text="continue_with"
            containerProps={{ style: { width: '100%' } }}
          />
        </div>
      )}
      {error && (
        <p className="mt-2 text-center text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
