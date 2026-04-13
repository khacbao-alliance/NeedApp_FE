'use client';

import { useState, useCallback, createElement } from 'react';

// ── Global error toast system ──
// Simple, lightweight toast for user-facing error feedback.
// Usage: import { showErrorToast } from '@/components/ui/ErrorToast';
//        showErrorToast('Không thể gửi tin nhắn');

interface ErrorToastItem {
  id: string;
  message: string;
  exiting?: boolean;
}

const DURATION = 4000;
let _addToast: ((msg: string) => void) | null = null;

/** Call this anywhere to show an error toast */
export function showErrorToast(message: string) {
  _addToast?.(message);
}

/** Mount this once in your layout (already renders its own portal) */
export function ErrorToastContainer() {
  const [toasts, setToasts] = useState<ErrorToastItem[]>([]);

  const addToast = useCallback((message: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [{ id, message }, ...prev].slice(0, 3));

    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, DURATION);
  }, []);

  // Register global handler
  _addToast = addToast;

  if (toasts.length === 0) return null;

  return createElement(
    'div',
    {
      className: 'fixed bottom-4 right-4 z-[110] flex flex-col gap-2 pointer-events-none',
      style: { maxWidth: '360px', width: '100%' },
      'aria-live': 'assertive',
    },
    toasts.map(toast =>
      createElement(
        'div',
        {
          key: toast.id,
          className: [
            'pointer-events-auto flex items-center gap-2.5 rounded-xl px-4 py-3',
            toast.exiting ? 'animate-slide-out-right' : 'animate-slide-in-right',
          ].join(' '),
          style: {
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            boxShadow: '0 8px 32px -4px rgba(0,0,0,0.3), 0 0 0 1px rgba(239,68,68,0.08)',
          },
        },
        // Icon
        createElement('span', {
          className: 'flex-shrink-0 flex items-center justify-center rounded-lg text-sm',
          style: { width: '28px', height: '28px', background: 'rgba(239, 68, 68, 0.12)' },
        }, '❌'),
        // Message
        createElement('p', {
          className: 'text-xs font-medium line-clamp-2',
          style: { color: 'var(--foreground)' },
        }, toast.message),
        // Dismiss
        createElement('button', {
          className: 'flex-shrink-0 rounded p-0.5 text-xs transition-colors',
          style: { color: 'var(--text-muted)' },
          onClick: () => {
            setToasts(prev => prev.map(t => t.id === toast.id ? { ...t, exiting: true } : t));
            setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 300);
          },
        }, '✕')
      )
    )
  );
}
