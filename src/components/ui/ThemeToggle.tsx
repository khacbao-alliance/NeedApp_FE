'use client';

import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ className, size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-[18px] h-[18px]',
    lg: 'w-5 h-5',
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative flex items-center justify-center rounded-xl',
        'bg-[var(--surface-2)] hover:bg-[var(--surface-3)]',
        'text-[var(--text-secondary)] hover:text-[var(--foreground)]',
        'border border-[var(--border)]',
        'transition-all duration-200',
        'hover:scale-105 active:scale-95',
        'focus-ring cursor-pointer',
        sizeClasses[size],
        className
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span
        className={cn(
          'absolute transition-all duration-300',
          theme === 'dark'
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0'
        )}
      >
        <MoonIcon className={iconSizes[size]} />
      </span>
      <span
        className={cn(
          'absolute transition-all duration-300',
          theme === 'light'
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
        )}
      >
        <SunIcon className={iconSizes[size]} />
      </span>
    </button>
  );
}
