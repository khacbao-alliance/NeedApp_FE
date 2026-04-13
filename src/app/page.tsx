'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ClientNavbar } from '@/components/layout/ClientNavbar';
import { Footer } from '@/components/layout/Footer';
import { NotificationProvider } from '@/hooks/useNotifications';
import { NotificationToast } from '@/components/notifications/NotificationToast';
import { FadeIn } from '@/components/ui/motion/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion/StaggerContainer';
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  const { t } = useTranslation();
  const { isAuthenticated, role, isLoading } = useAuth();
  const router = useRouter();

  // Admin/Staff should go to dashboard (middleware handles server-side, this is a fallback)
  useEffect(() => {
    if (!isLoading && isAuthenticated && role !== 'Client') {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, role, router]);

  // While auth state is unknown, render nothing to prevent guest content flash.
  if (isLoading) return null;
  if (isAuthenticated && role !== 'Client') return null;

  const content = (
    <div className="min-h-screen flex flex-col">
      <ClientNavbar />

      <main className="flex-1">
        {/* ═══ HERO SECTION ═══ */}
        <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
          {/* Background Effects */}
          <div className="pointer-events-none absolute inset-0">
            <motion.div
              className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-[var(--accent-violet)]/8 blur-[128px]"
              animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-20 right-1/4 h-[400px] w-[400px] rounded-full bg-[var(--accent-cyan)]/8 blur-[128px]"
              animate={{ scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-[var(--accent-indigo)]/5 blur-[96px]"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
            />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              {/* Badge */}
              <FadeIn direction="down" delay={0}>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--surface-1)] px-4 py-1.5 text-sm">
                  <SparklesIcon className="h-4 w-4 text-[var(--accent-violet)]" />
                  <span className="text-[var(--text-secondary)]">{t('landing.badge')}</span>
                </div>
              </FadeIn>

              {/* Headline */}
              <FadeIn direction="up" delay={0.1}>
                <h1 className="text-4xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
                  <span className="whitespace-nowrap">
                    {t('landing.headlineLine1')}{' '}
                    {t('landing.headlineConnector')}{' '}
                    <span className="gradient-text">{t('landing.headlineGradient')}</span>
                  </span>
                  <br />
                  {t('landing.headlineLine2')}
                </h1>
              </FadeIn>

              {/* Subtitle */}
              <FadeIn direction="up" delay={0.2}>
                <p className="mt-6 text-lg text-[var(--text-secondary)] sm:text-xl max-w-2xl mx-auto leading-relaxed">
                  {t('landing.subtitle')}
                </p>
              </FadeIn>

              {/* CTAs */}
              <FadeIn direction="up" delay={0.3}>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/requests/new"
                        className="btn-gradient rounded-xl px-8 py-3.5 text-base font-semibold inline-flex items-center gap-2"
                      >
                        {t('landing.createRequest')}
                        <ChevronRightIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        href="/requests"
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-8 py-3.5 text-base font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all inline-flex items-center gap-2"
                      >
                        {t('landing.viewMyRequests')}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/register"
                        className="btn-gradient rounded-xl px-8 py-3.5 text-base font-semibold inline-flex items-center gap-2"
                      >
                        {t('landing.startFree')}
                        <ChevronRightIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        href="/login"
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-8 py-3.5 text-base font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all inline-flex items-center gap-2"
                      >
                        {t('nav.login')}
                      </Link>
                    </>
                  )}
                </div>
              </FadeIn>
            </div>

            {/* Hero Visual — Mock UI Preview */}
            <FadeIn direction="up" delay={0.4}>
              <motion.div
                className="mt-16 sm:mt-20"
                initial={{ scale: 0.96 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
              >
                <div className="gradient-border rounded-2xl">
                  <div className="rounded-2xl bg-[var(--surface-1)] p-1">
                    <div className="rounded-xl bg-[var(--background)] p-4 sm:p-6">
                      {/* Mock Chat UI */}
                      <StaggerContainer staggerDelay={0.12} delayStart={0.5} className="flex flex-col gap-3">
                        <StaggerItem>
                          <MockMessage align="left" name={t('landing.mockChat.senderSystem')} text={t('landing.mockChat.msg1')} isSystem />
                        </StaggerItem>
                        <StaggerItem>
                          <MockMessage align="right" name={t('landing.mockChat.senderUser')} text={t('landing.mockChat.msg2')} />
                        </StaggerItem>
                        <StaggerItem>
                          <MockMessage align="left" name={t('landing.mockChat.senderSystem')} text={t('landing.mockChat.msg3')} isSystem />
                        </StaggerItem>
                        <StaggerItem>
                          <MockMessage align="right" name={t('landing.mockChat.senderUser')} text={t('landing.mockChat.msg4')} />
                        </StaggerItem>
                        <StaggerItem>
                          <MockMessage align="left" name={t('landing.mockChat.senderStaff')} text={t('landing.mockChat.msg5')} isStaff />
                        </StaggerItem>
                      </StaggerContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          </div>
        </section>

        {/* ═══ FEATURES SECTION ═══ */}
        <section id="features" className="py-20 sm:py-28 bg-[var(--surface-1)]/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn direction="up" inView className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
                {t('landing.featuresTitleLine1')} <span className="gradient-text whitespace-nowrap">{t('landing.featuresTitleGradient')}</span>
              </h2>
              <p className="mt-4 text-[var(--text-secondary)] text-lg">
                {t('landing.featuresSubtitle')}
              </p>
            </FadeIn>

            <StaggerContainer inView staggerDelay={0.1} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <StaggerItem>
                <FeatureCard
                  icon={<DocumentTextIcon className="h-6 w-6" />}
                  title={t('landing.feature1Title')}
                  description={t('landing.feature1Desc')}
                  color="text-[var(--accent-violet)]"
                  bg="bg-[var(--accent-violet)]/10"
                />
              </StaggerItem>
              <StaggerItem>
                <FeatureCard
                  icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />}
                  title={t('landing.feature2Title')}
                  description={t('landing.feature2Desc')}
                  color="text-[var(--accent-cyan)]"
                  bg="bg-[var(--accent-cyan)]/10"
                />
              </StaggerItem>
              <StaggerItem>
                <FeatureCard
                  icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
                  title={t('landing.feature3Title')}
                  description={t('landing.feature3Desc')}
                  color="text-emerald-400"
                  bg="bg-emerald-500/10"
                />
              </StaggerItem>
              <StaggerItem>
                <FeatureCard
                  icon={<BoltIcon className="h-6 w-6" />}
                  title={t('landing.feature4Title')}
                  description={t('landing.feature4Desc')}
                  color="text-amber-400"
                  bg="bg-amber-500/10"
                />
              </StaggerItem>
              <StaggerItem>
                <FeatureCard
                  icon={<ShieldCheckIcon className="h-6 w-6" />}
                  title={t('landing.feature5Title')}
                  description={t('landing.feature5Desc')}
                  color="text-blue-400"
                  bg="bg-blue-500/10"
                />
              </StaggerItem>
              <StaggerItem>
                <FeatureCard
                  icon={<ClockIcon className="h-6 w-6" />}
                  title={t('landing.feature6Title')}
                  description={t('landing.feature6Desc')}
                  color="text-pink-400"
                  bg="bg-pink-500/10"
                />
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section id="how-it-works" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn direction="up" inView className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
                {t('landing.howTitleLine1')} <span className="gradient-text whitespace-nowrap">{t('landing.howTitleGradient')}</span>
              </h2>
              <p className="mt-4 text-[var(--text-secondary)] text-lg">
                {t('landing.howSubtitle')}
              </p>
            </FadeIn>

            <StaggerContainer inView staggerDelay={0.15} className="grid gap-8 lg:grid-cols-3 lg:items-stretch">
              <StaggerItem>
                <StepCard step={1} title={t('landing.step1Title')} description={t('landing.step1Desc')} />
              </StaggerItem>
              <StaggerItem>
                <StepCard step={2} title={t('landing.step2Title')} description={t('landing.step2Desc')} />
              </StaggerItem>
              <StaggerItem>
                <StepCard step={3} title={t('landing.step3Title')} description={t('landing.step3Desc')} />
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* ═══ STATS ═══ */}
        <section className="py-16 bg-[var(--surface-1)]/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <StaggerContainer inView staggerDelay={0.1} className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              <StaggerItem><StatItem value={t('landing.stat1Value')} label={t('landing.stat1Label')} /></StaggerItem>
              <StaggerItem><StatItem value={t('landing.stat2Value')} label={t('landing.stat2Label')} /></StaggerItem>
              <StaggerItem><StatItem value={t('landing.stat3Value')} label={t('landing.stat3Label')} /></StaggerItem>
              <StaggerItem><StatItem value={t('landing.stat4Value')} label={t('landing.stat4Label')} /></StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* ═══ CTA SECTION ═══ */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn direction="up" inView>
              <div className="relative overflow-hidden rounded-3xl">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-violet)] via-[var(--accent-indigo)] to-[var(--accent-cyan)] opacity-90" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNhKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />

                <div className="relative px-8 py-16 sm:px-16 sm:py-20 text-center">
                  <h2 className="text-3xl font-bold text-white sm:text-4xl">
                    {t('landing.ctaTitle')}
                  </h2>
                  <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
                    {t('landing.ctaSubtitle')}
                  </p>
                  <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    {isAuthenticated ? (
                      <Link
                        href="/requests/new"
                        className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-[var(--accent-indigo)] hover:bg-white/90 transition-all shadow-lg inline-flex items-center gap-2"
                      >
                        {t('landing.createRequest')}
                        <ChevronRightIcon className="h-4 w-4" />
                      </Link>
                    ) : (
                      <>
                        <Link
                          href="/register"
                          className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-[var(--accent-indigo)] hover:bg-white/90 transition-all shadow-lg inline-flex items-center gap-2"
                        >
                          {t('landing.registerFree')}
                          <ChevronRightIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          href="/login"
                          className="rounded-xl border border-white/30 px-8 py-3.5 text-base font-medium text-white hover:bg-white/10 transition-all"
                        >
                          {t('nav.login')}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );

  // Wrap with notification provider when authenticated
  if (isAuthenticated) {
    return (
      <NotificationProvider>
        <NotificationToast>
          {content}
        </NotificationToast>
      </NotificationProvider>
    );
  }

  return content;
}

/* ── Sub Components ──────────────────────────────── */

function MockMessage({
  align,
  name,
  text,
  isSystem,
  isStaff,
}: {
  align: 'left' | 'right';
  name: string;
  text: string;
  isSystem?: boolean;
  isStaff?: boolean;
}) {
  return (
    <div className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${align === 'right'
            ? 'bg-gradient-to-br from-[var(--accent-violet)] to-[var(--accent-indigo)] text-white'
            : isStaff
              ? 'bg-blue-500/10 border border-blue-500/20 text-[var(--foreground)]'
              : 'bg-[var(--surface-2)] text-[var(--foreground)]'
          }`}
      >
        <p className={`text-[10px] font-medium mb-0.5 ${align === 'right' ? 'text-white/70' : isStaff ? 'text-blue-400' : 'text-[var(--text-muted)]'
          }`}>
          {name}
        </p>
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
  bg,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bg: string;
}) {
  return (
    <motion.div
      className="group h-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 transition-colors duration-300 hover:border-[var(--glass-border)] hover:shadow-xl hover:shadow-black/10"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className={`mb-4 inline-flex rounded-xl p-3 ${bg} transition-transform duration-300 group-hover:scale-110`}>
        <span className={color}>{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] leading-relaxed">{description}</p>
    </motion.div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="relative group h-full">
      {/* Connector line (hidden on first) */}
      {step > 1 && (
        <div className="hidden lg:block absolute -left-4 top-10 w-8 border-t-2 border-dashed border-[var(--border)]" />
      )}
      <motion.div
        className="h-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 transition-colors duration-300 hover:border-[var(--glass-border)]"
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-violet)] to-[var(--accent-indigo)] text-xl font-bold text-white shadow-lg shadow-[var(--accent-indigo)]/20">
          {step}
        </div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{description}</p>
      </motion.div>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold gradient-text sm:text-4xl">{value}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
