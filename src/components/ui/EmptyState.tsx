import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {icon && (
        <div className="relative mb-5">
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full bg-[var(--accent-primary)]/5 blur-xl scale-150" />
          <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5 text-[var(--text-muted)]">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-[var(--text-muted)]">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

