'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { cn } from '@/lib/utils';
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  HomeIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export function ClientNavbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Track scroll for glass effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const el = document.getElementById('profile-dropdown-container');
      if (el && !el.contains(target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  const isLanding = pathname === '/';

  const navLinks = [
    { href: '/', label: t('nav.home'), Icon: HomeIcon },
    { href: '/requests', label: t('nav.requests'), Icon: DocumentTextIcon },
    { href: '/requests/new', label: t('nav.newRequest'), Icon: PlusCircleIcon },
  ];

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled || !isLanding
            ? 'bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--glass-border)] shadow-lg shadow-black/10'
            : 'bg-transparent'
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image
              src="/NeedAPP_logo.png"
              alt="NeedApp"
              width={120}
              height={34}
              priority
              className="h-auto w-auto"
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated &&
              navLinks.map(({ href, label }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            {!isAuthenticated && (
              <>
                <a
                  href="#features"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
                >
                  {t('nav.features')}
                </a>
                <a
                  href="#how-it-works"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
                >
                  {t('nav.howItWorks')}
                </a>
              </>
            )}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle size="sm" />
            <LanguageToggle size="sm" />
            {isAuthenticated ? (
              <>
                <NotificationBell />
              <div className="relative" id="profile-dropdown-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileOpen(!profileOpen);
                  }}
                  className="flex items-center gap-2.5 rounded-xl bg-[var(--surface-2)] px-3 py-1.5 transition-all hover:bg-[var(--surface-3)]"
                >
                  <Avatar
                    src={user?.avatarUrl ?? undefined}
                    name={user?.name || user?.email || ''}
                    size="xs"
                  />
                  <span className="text-sm font-medium text-[var(--foreground)] max-w-[120px] truncate">
                    {user?.name || t('profile.unnamed')}
                  </span>
                </button>

                {/* Profile Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-1.5 shadow-2xl shadow-black/30 animate-fade-in">
                    <div className="border-b border-[var(--border)] px-3 py-2.5 mb-1">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">
                        {user?.name || t('profile.unnamed')}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
                    >
                      <UserCircleIcon className="h-4 w-4" />
                      {t('nav.profile')}
                    </Link>
                    <Link
                      href="/email-settings"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                      {t('nav.emailSettings')}
                    </Link>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center min-w-[110px] rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/register"
                  className="btn-gradient inline-flex items-center justify-center min-w-[110px] rounded-xl px-5 py-2 text-sm font-semibold"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Notification + Hamburger */}
          <div className="flex md:hidden items-center gap-1">
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface-1)] animate-fade-in">
            <div className="px-4 py-4 space-y-1">
              {isAuthenticated ? (
                <>
                  {navLinks.map(({ href, label, Icon }) => {
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                      </Link>
                    );
                  })}
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    {t('nav.profile')}
                  </Link>
                  <Link
                    href="/email-settings"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                  >
                    <Cog6ToothIcon className="h-5 w-5" />
                    {t('nav.emailSettings')}
                  </Link>
                  <div className="border-t border-[var(--border)] mt-2 pt-2">
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10"
                    >
                      <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
                      {t('nav.logout')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <a
                    href="#features"
                    className="block rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                  >
                    {t('nav.features')}
                  </a>
                  <a
                    href="#how-it-works"
                    className="block rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                  >
                    {t('nav.howItWorks')}
                  </a>
                  <div className="border-t border-[var(--border)] mt-2 pt-3 flex flex-col gap-2">
                    <div className="flex items-center justify-center gap-2 pb-1">
                      <LanguageToggle size="sm" />
                    </div>
                    <Link
                      href="/login"
                      className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-center text-sm font-medium text-[var(--foreground)]"
                    >
                      {t('nav.login')}
                    </Link>
                    <Link
                      href="/register"
                      className="btn-gradient rounded-xl px-4 py-2.5 text-center text-sm font-semibold"
                    >
                      {t('nav.register')}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-16" />

      <ConfirmModal
        open={showLogoutConfirm}
        onConfirm={logout}
        onCancel={() => setShowLogoutConfirm(false)}
        title={t('confirm.logout.title')}
        description={t('confirm.logout.description')}
        confirmLabel={t('confirm.logout.confirm')}
        variant="warning"
      />
    </>
  );
}
