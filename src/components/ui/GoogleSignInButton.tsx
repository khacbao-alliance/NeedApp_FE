'use client';

import { useEffect, useRef, useState } from 'react';

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => Promise<void>;
}

export function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    const render = () => {
      if (!window.google?.accounts?.id || !el) return;

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
        callback: async ({ credential }: { credential: string }) => {
          setLoading(true);
          setError('');
          try {
            await onSuccessRef.current(credential);
          } catch {
            setError('Google sign-in thất bại. Vui lòng thử lại.');
          } finally {
            setLoading(false);
          }
        },
      });

      window.google.accounts.id.renderButton(el, {
        theme: 'filled_black',
        shape: 'rectangular',
        size: 'large',
        text: 'continue_with',
        width: el.offsetWidth || 400,
      });
    };

    if (window.google?.accounts?.id) {
      render();
    } else {
      const script = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]',
      );
      script?.addEventListener('load', render, { once: true });
      return () => script?.removeEventListener('load', render);
    }
  }, []);

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
      <div ref={buttonRef} className="flex w-full justify-center" />
      {error && (
        <p className="mt-2 text-center text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
