'use client';

import { motion } from 'framer-motion';
import { FadeIn } from '@/components/ui/motion/FadeIn';

export function AuthAnimatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background — subtle blue glow */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[var(--accent-primary)]/6 blur-[128px]"
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[var(--accent-primary)]/5 blur-[128px]"
          animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
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
