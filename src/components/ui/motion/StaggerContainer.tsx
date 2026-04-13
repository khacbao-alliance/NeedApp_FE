'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
  /** Use whileInView (scroll-triggered) instead of animating on mount */
  inView?: boolean;
  once?: boolean;
  delayStart?: number;
}

const containerVariants = (staggerDelay: number, delayStart: number) => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: delayStart,
      staggerChildren: staggerDelay,
    },
  },
});

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export const itemVariantsLeft = {
  hidden: { opacity: 0, x: -20 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className,
  inView = false,
  once = true,
  delayStart = 0,
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants = containerVariants(
    shouldReduceMotion ? 0 : staggerDelay,
    shouldReduceMotion ? 0 : delayStart,
  );

  if (inView) {
    return (
      <motion.div
        className={className}
        variants={variants}
        initial="hidden"
        whileInView="show"
        viewport={{ once, margin: '-60px' }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

/** Wrap individual items inside StaggerContainer */
export function StaggerItem({
  children,
  className,
  left = false,
}: {
  children: React.ReactNode;
  className?: string;
  left?: boolean;
}) {
  return (
    <motion.div className={className} variants={left ? itemVariantsLeft : itemVariants}>
      {children}
    </motion.div>
  );
}
