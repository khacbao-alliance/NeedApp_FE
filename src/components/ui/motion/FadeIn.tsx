'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface FadeInProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  className?: string;
  /** Use whileInView (scroll-triggered) instead of animating on mount */
  inView?: boolean;
  once?: boolean;
}

export function FadeIn({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  className,
  inView = false,
  once = true,
}: FadeInProps) {
  const shouldReduceMotion = useReducedMotion();

  const offsets: Record<NonNullable<FadeInProps['direction']>, { x: number; y: number }> = {
    up:    { x: 0, y: shouldReduceMotion ? 0 : 20 },
    down:  { x: 0, y: shouldReduceMotion ? 0 : -20 },
    left:  { x: shouldReduceMotion ? 0 : 20, y: 0 },
    right: { x: shouldReduceMotion ? 0 : -20, y: 0 },
    none:  { x: 0, y: 0 },
  };

  const offset = offsets[direction];

  const initial = { opacity: 0, x: offset.x, y: offset.y };
  const animate = { opacity: 1, x: 0, y: 0 };
  const transition = { duration: shouldReduceMotion ? 0 : duration, delay: shouldReduceMotion ? 0 : delay, ease: 'easeOut' as const };

  if (inView) {
    return (
      <motion.div
        className={className}
        initial={initial}
        whileInView={animate}
        viewport={{ once, margin: '-60px' }}
        transition={transition}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={animate}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
