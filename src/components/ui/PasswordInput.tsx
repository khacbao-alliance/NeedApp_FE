'use client';

import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-[var(--foreground)]">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={show ? 'text' : 'password'}
            className={cn(
              'w-full rounded-xl border px-4 py-2.5 pr-10 text-sm outline-none transition-all duration-200',
              'bg-[var(--surface-2)] border-[var(--border)] text-[var(--foreground)] placeholder-[var(--text-muted)]',
              'focus:border-[var(--accent-indigo)] focus:ring-1 focus:ring-[var(--accent-indigo)]/50',
              'hover:border-[var(--surface-3)]',
              error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30',
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
            tabIndex={-1}
          >
            {show ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        {hint && !error && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';
