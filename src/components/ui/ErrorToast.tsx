'use client';

import { useState, useCallback, createElement } from 'react';

// ── Global toast system ──
// Supports 'error' and 'success' variants.
// Usage: import { showErrorToast, showSuccessToast } from '@/components/ui/ErrorToast';
//        showErrorToast('Không thể gửi tin nhắn');
//        showSuccessToast('Đã mời thành công!');

type ToastVariant = 'error' | 'success';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting?: boolean;
}

const DURATION = 4000;
let _addToast: ((msg: string, variant: ToastVariant) => void) | null = null;

/** Show an error toast (red) */
export function showErrorToast(message: string) {
  _addToast?.(message, 'error');
}

/** Show a success toast (green) */
export function showSuccessToast(message: string) {
  _addToast?.(message, 'success');
}

/** Mount this once in your layout */
export function ErrorToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = crypto.randomUUID();
    setToasts(prev => [{ id, message, variant }, ...prev].slice(0, 3));

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
    toasts.map(toast => {
      const isSuccess = toast.variant === 'success';
      return createElement(
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
            border: isSuccess
              ? '1px solid rgba(34, 197, 94, 0.25)'
              : '1px solid rgba(239, 68, 68, 0.25)',
            boxShadow: isSuccess
              ? '0 8px 32px -4px rgba(0,0,0,0.3), 0 0 0 1px rgba(34,197,94,0.08)'
              : '0 8px 32px -4px rgba(0,0,0,0.3), 0 0 0 1px rgba(239,68,68,0.08)',
          },
        },
        // Icon
        createElement('span', {
          className: 'flex-shrink-0 flex items-center justify-center rounded-lg text-sm',
          style: {
            width: '28px',
            height: '28px',
            background: isSuccess ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          },
        }, isSuccess ? '✅' : '❌'),
        // Message
        createElement('p', {
          className: 'text-xs font-medium line-clamp-2 flex-1',
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
      );
    })
  );
}
