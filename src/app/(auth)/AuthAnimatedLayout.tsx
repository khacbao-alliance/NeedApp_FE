'use client';

import { motion } from 'framer-motion';
import { FadeIn } from '@/components/ui/motion/FadeIn';

export function AuthAnimatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[var(--accent-violet)]/10 blur-[128px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[var(--accent-cyan)]/10 blur-[128px]"
          animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-indigo)]/5 blur-[96px]"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
      </div>
      <div className="relative z-10 w-full">
        <FadeIn direction="up" delay={0.05} duration={0.45}>
          {children}
        </FadeIn>
      </div>
    </div>
  );
}
