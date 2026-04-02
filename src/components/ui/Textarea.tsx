import { cn } from '@/lib/utils';
import { forwardRef, TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-[var(--foreground)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200 resize-none',
            'bg-[var(--surface-2)] border-[var(--border)] text-[var(--foreground)] placeholder-[var(--text-muted)]',
            'focus:border-[var(--accent-indigo)] focus:ring-1 focus:ring-[var(--accent-indigo)]/50',
            error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
