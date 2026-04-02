'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Content */}
      <div
        className={cn(
          'relative w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-2xl animate-slide-up',
          sizes[size]
        )}
      >
        {/* Header */}
        {(title || true) && (
          <div className="mb-4 flex items-center justify-between">
            {title && (
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {title}
              </h2>
            )}
            <button
              onClick={onClose}
              className="ml-auto rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--foreground)]"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
