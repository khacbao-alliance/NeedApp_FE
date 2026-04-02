'use client';

import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LanguageToggle({ className, size = 'md' }: LanguageToggleProps) {
  const { language, toggleLanguage } = useLanguage();

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-[11px]',
    md: 'h-9 px-3 text-xs',
    lg: 'h-10 px-3.5 text-sm',
  };

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        'relative flex items-center justify-center rounded-xl gap-1',
        'bg-[var(--surface-2)] hover:bg-[var(--surface-3)]',
        'text-[var(--text-secondary)] hover:text-[var(--foreground)]',
        'border border-[var(--border)]',
        'transition-all duration-200',
        'hover:scale-105 active:scale-95',
        'cursor-pointer font-semibold tracking-wide',
        sizeClasses[size],
        className
      )}
      aria-label={`Switch to ${language === 'vi' ? 'English' : 'Tiếng Việt'}`}
      title={`Switch to ${language === 'vi' ? 'English' : 'Tiếng Việt'}`}
    >
      <span className="transition-all duration-200">
        {language === 'vi' ? 'VI' : 'EN'}
      </span>
    </button>
  );
}
