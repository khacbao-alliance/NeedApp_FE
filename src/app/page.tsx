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
              className="absolute -top-40 left-1/3 h-[500px] w-[500px] rounded-full bg-[var(--accent-primary)]/5 blur-[128px]"
              animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-20 right-1/3 h-[400px] w-[400px] rounded-full bg-[var(--accent-primary)]/4 blur-[128px]"
              animate={{ scale: [1, 1.04, 1], opacity: [0.5, 0.7, 0.5] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
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
                <div className="gradient-border rounded-3xl shadow-2xl shadow-[var(--accent-primary)]/10">
                  <div className="rounded-[1.5rem] bg-[var(--surface-1)] p-1 sm:p-2">
                    <div className="rounded-2xl bg-[var(--background)] flex flex-col overflow-hidden border border-[var(--border)]">
                      {/* Chat Header */}
                      <div className="border-b border-[var(--border)] bg-[var(--surface-1)]/50 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-lg">
                            <ChatBubbleLeftRightIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-[var(--foreground)]">REQ-1042: System Access</h3>
                            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              Active
                            </p>
                          </div>
                        </div>
                        <div className="hidden sm:flex text-xs font-medium text-[var(--text-muted)] border border-[var(--border)] px-2.5 py-1 rounded-md bg-[var(--surface-2)]">
                          High Priority
                        </div>
                      </div>

                      {/* Mock Chat UI body */}
                      <div className="p-4 sm:p-6 bg-gradient-to-b from-[var(--background)] to-[var(--surface-1)]/30">
                        <StaggerContainer staggerDelay={0.12} delayStart={0.5} className="flex flex-col gap-4 sm:gap-6">
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

                      {/* Mock Chat Input */}
                      <div className="border-t border-[var(--border)] bg-[var(--surface-1)]/50 p-3 sm:p-4">
                        <div className="flex items-center gap-3 bg-[var(--background)] border border-[var(--border)] px-5 py-3 rounded-full shadow-sm">
                          <div className="flex-1 text-sm text-[var(--text-muted)] opacity-70">
                            Type a reply...
                          </div>
                          <div className="flex items-center gap-2 text-[var(--text-muted)]">
                            <DocumentTextIcon className="h-5 w-5" />
                            <div className="w-px h-5 bg-[var(--border)] mx-1"></div>
                            <div className="bg-[var(--accent-primary)] text-white p-2 rounded-full shadow-sm">
                              <ChevronRightIcon className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </div>
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
                  color="text-[var(--accent-primary)]"
                  bg="bg-[var(--accent-primary)]/10"
                />
              </StaggerItem>
              <StaggerItem>
                <FeatureCard
                  icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />}
                  title={t('landing.feature2Title')}
                  description={t('landing.feature2Desc')}
                  color="text-[var(--accent-primary)]"
                  bg="bg-[var(--accent-primary)]/10"
                />
              </StaggerItem>
              <StaggerItem>
                <FeatureCard
                  icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
                  title={t('landing.feature3Title')}
                  description={t('landing.feature3Desc')}
                  color="text-[var(--accent-primary)]"
                  bg="bg-[var(--accent-primary)]/10"
                />
              </StaggerItem>
              <StaggerItem>
                <FeatureCard
                  icon={<BoltIcon className="h-6 w-6" />}
                  title={t('landing.feature4Title')}
                  description={t('landing.feature4Desc')}
                  color="text-[var(--accent-primary)]"
                  bg="bg-[var(--accent-primary)]/10"
                />
              </StaggerItem>
              <StaggerItem>
                <FeatureCard
                  icon={<ShieldCheckIcon className="h-6 w-6" />}
                  title={t('landing.feature5Title')}
                  description={t('landing.feature5Desc')}
                  color="text-[var(--accent-primary)]"
                  bg="bg-[var(--accent-primary)]/10"
                />
              </StaggerItem>
              <StaggerItem>
                <FeatureCard
                  icon={<ClockIcon className="h-6 w-6" />}
                  title={t('landing.feature6Title')}
                  description={t('landing.feature6Desc')}
                  color="text-[var(--accent-primary)]"
                  bg="bg-[var(--accent-primary)]/10"
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
                <div className="absolute inset-0 bg-[var(--accent-primary)] opacity-90" />

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
  const isRight = align === 'right';
  const initial = name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <div className={`flex w-full py-1 animate-fade-in group ${isRight ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] sm:max-w-[80%] flex flex-col ${isRight ? 'items-end' : 'items-start'}`}>
        
        <div className={`flex items-end gap-2 group ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar (Only for left side, like real chat) */}
          {!isRight && (
            <div className={`flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm ${
              isStaff
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 ring-1 ring-inset ring-blue-500/20'
                : 'bg-[var(--surface-3)] text-[var(--text-secondary)] border border-[var(--border)]'
            }`}>
              {isSystem ? <SparklesIcon className="h-4 w-4 text-[var(--accent-violet)]" /> : initial}
            </div>
          )}

          {/* Bubble */}
          <div className="min-w-0">
            <div
              className={`px-5 py-3 text-sm leading-relaxed rounded-3xl ${
                isRight
                  ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-indigo)] text-white rounded-br-md shadow-md shadow-[var(--accent-primary)]/20'
                  : 'bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border)] rounded-bl-md shadow-sm'
              }`}
            >
              {/* Name (Inside bubble for left side, like real chat) */}
              {!isRight && (
                <div className="mb-0.5 flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[var(--accent-violet)]">{name}</span>
                  {(isSystem || isStaff) && (
                    <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--accent-violet)]/70 px-1 py-[1px] bg-[var(--accent-violet)]/10 rounded">
                      {isSystem ? 'Bot' : 'Staff'}
                    </span>
                  )}
                </div>
              )}
              {text}
            </div>
          </div>
        </div>

        {/* Timestamp & Read Receipt */}
        <div className={`mt-1 flex items-center gap-1 text-[10px] text-[var(--text-muted)] w-full px-1 ${isRight ? 'justify-end' : 'justify-start'}`}>
          <span>Vừa xong</span>
          {isRight && (
            <span className="ml-0.5 font-bold tracking-tight text-[var(--accent-violet)] relative w-3 h-3 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 absolute left-0"><polyline points="20 6 9 17 4 12" /></svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 absolute left-[3px]"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
          )}
        </div>
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
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-primary)] text-xl font-bold text-white shadow-sm">
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
