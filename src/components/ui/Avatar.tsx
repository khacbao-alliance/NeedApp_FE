import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-xl',
};

const gradients = [
  'from-violet-500 to-indigo-500',
  'from-indigo-500 to-cyan-500',
  'from-cyan-500 to-teal-500',
  'from-pink-500 to-violet-500',
  'from-amber-500 to-orange-500',
];

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover ring-2 ring-[var(--border)]',
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-[var(--border)]',
        getGradient(name),
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
