'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  xs: 'h-6 w-6 text-[9px] tracking-wide',
  sm: 'h-8 w-8 text-[11px] tracking-wide',
  md: 'h-10 w-10 text-[13px] tracking-wider',
  lg: 'h-12 w-12 text-sm tracking-wider',
  xl: 'h-20 w-20 text-lg tracking-widest',
};

const gradients = [
  'from-violet-500 via-purple-500 to-indigo-600',
  'from-blue-500 via-indigo-500 to-violet-600',
  'from-emerald-400 via-teal-500 to-cyan-600',
  'from-rose-500 via-pink-500 to-fuchsia-600',
  'from-orange-400 via-amber-500 to-yellow-500',
  'from-sky-400 via-blue-500 to-indigo-500',
  'from-teal-400 via-emerald-500 to-green-600',
];

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function resolveAvatarUrl(src: string): string {
  // Bump Google profile picture resolution from s96-c to s400-c
  if (src.includes('lh3.googleusercontent.com')) {
    return src.replace(/=s\d+-c$/, '=s400-c');
  }
  return src;
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (src && !imgError) {
    return (
      <img
        src={resolveAvatarUrl(src)}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={cn(
          'rounded-full object-cover ring-2 ring-white/20 shadow-md',
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-md ring-2 ring-white/20 select-none',
        getGradient(name),
        sizes[size],
        className
      )}
    >
      <span className="drop-shadow-sm">{initials}</span>
    </div>
  );
}
