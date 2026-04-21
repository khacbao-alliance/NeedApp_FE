'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  BellIcon,
  ClockIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  DocumentTextIcon as DocSolid,
  UserGroupIcon as UserGroupSolid,
  BellIcon as BellSolid,
} from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  labelKey: string;
  Icon: React.ComponentType<{ className?: string }>;
  ActiveIcon: React.ComponentType<{ className?: string }>;
  roles?: ('Admin' | 'Staff' | 'Client')[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'nav.dashboard', Icon: HomeIcon, ActiveIcon: HomeSolid },
  { href: '/requests', labelKey: 'nav.requests', Icon: DocumentTextIcon, ActiveIcon: DocSolid },
  { href: '/notifications', labelKey: 'nav.notifications', Icon: BellIcon, ActiveIcon: BellSolid },
  { href: '/admin/users', labelKey: 'nav.users', Icon: UserGroupIcon, ActiveIcon: UserGroupSolid, roles: ['Admin'] },
  {
    href: '/admin/intake-questions',
    labelKey: 'nav.intakeQuestions',
    Icon: QuestionMarkCircleIcon,
    ActiveIcon: QuestionMarkCircleIcon,
    roles: ['Admin'],
  },
  {
    href: '/admin/sla-config',
    labelKey: 'nav.slaConfig',
    Icon: ClockIcon,
    ActiveIcon: ClockIcon,
    roles: ['Admin'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, role } = useAuth();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCollapsedMenu, setShowCollapsedMenu] = useState(false);

  const visibleItems = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );

  return (
    <>
      <aside className={cn(
        "glass sticky top-0 flex h-screen flex-col py-6 border-r border-[var(--border)] transition-all duration-300 relative",
        isExpanded ? "w-64 px-4" : "w-20 px-2 items-center z-50"
      )}>
        {/* Collapse Toggle Button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3.5 top-9 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] shadow-sm z-[60]"
        >
          {isExpanded ? <ChevronLeftIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
        </button>

        {/* Logo & Theme Toggle */}
        <div className={cn("mb-8 flex items-center justify-between", isExpanded ? "px-2" : "flex-col gap-4 px-0 justify-center")}>
          <Link href="/dashboard" className="flex items-center justify-center min-w-0" title={!isExpanded ? t('nav.dashboard') : undefined}>
            <Image
              src="/NeedAPP_logo.png"
              alt="NeedApp"
              width={110}
              height={32}
              priority
              className={cn("h-auto transition-all duration-300", isExpanded ? "max-w-[110px]" : "max-w-[60px]")}
            />
          </Link>
          <div className={cn("flex flex-shrink-0 items-center", isExpanded ? "gap-1" : "flex-col gap-2")}>
            {/* Even collapsed we show the toggles but stacked to not break features */}
            <LanguageToggle size="sm" />
            <ThemeToggle size="sm" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 w-full">
          {visibleItems.map(({ href, labelKey, Icon, ActiveIcon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + '/');
            const Ico = isActive ? ActiveIcon : Icon;
            return (
              <Link
                key={href}
                href={href}
                title={!isExpanded ? t(labelKey) : undefined}
                className={cn(
                  'relative flex items-center rounded-xl p-2.5 text-sm font-medium transition-all duration-200',
                  isExpanded ? 'gap-3 px-3' : 'justify-center mx-1',
                  isActive
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
                )}
              >
                <Ico className="h-5 w-5 flex-shrink-0" />
                {isExpanded && <span className="truncate">{t(labelKey)}</span>}
                {href === '/notifications' && unreadCount > 0 && (
                  isExpanded ? (
                    <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--accent-primary)] px-1.5 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  ) : (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[var(--accent-primary)] ring-2 ring-[var(--surface-1)]" />
                  )
                )}
              </Link>
            );
          })}

          {user && (
            <Link
              href="/profile"
              title={!isExpanded ? t('nav.profile') : undefined}
              className={cn(
                'relative flex items-center rounded-xl p-2.5 text-sm font-medium transition-all duration-200 mt-1',
                isExpanded ? 'gap-3 px-3' : 'justify-center mx-1',
                pathname.startsWith('/profile')
                  ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
              )}
            >
              <UserCircleIcon className="h-5 w-5 flex-shrink-0" />
              {isExpanded && <span className="truncate">{t('nav.profile')}</span>}
            </Link>
          )}

          {user && (
            <Link
              href="/email-settings"
              title={!isExpanded ? t('nav.emailSettings') : undefined}
              className={cn(
                'relative flex items-center rounded-xl p-2.5 text-sm font-medium transition-all duration-200',
                isExpanded ? 'gap-3 px-3' : 'justify-center mx-1',
                pathname.startsWith('/email-settings')
                  ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
              )}
            >
              <Cog6ToothIcon className="h-5 w-5 flex-shrink-0" />
              {isExpanded && <span className="truncate">{t('nav.emailSettings')}</span>}
            </Link>
          )}
        </nav>

        {/* User Info */}
        {user && (
          <div className={cn("mt-auto rounded-xl w-full", isExpanded ? "bg-[var(--surface-2)] p-3" : "bg-transparent p-0 relative flex flex-col items-center gap-3")}>
            <div className={cn("flex items-center w-full", isExpanded ? "gap-3" : "flex-col gap-3 justify-center")}>
              
              {!isExpanded ? (
                <>
                  <button 
                     onClick={() => setShowCollapsedMenu(!showCollapsedMenu)} 
                     className="rounded-full shadow-sm ring-1 ring-transparent hover:ring-[var(--border)] transition-all"
                     title={user.name || user.email}
                  >
                    <Avatar src={user.avatarUrl ?? undefined} name={user.name || user.email} size="sm" />
                  </button>

                  {/* Popover Logout */}
                  {showCollapsedMenu && (
                     <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowCollapsedMenu(false)} />
                        <div className="absolute left-14 bottom-0 z-50 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] shadow-xl animate-fade-in p-1 min-w-[120px]">
                           <button
                              onClick={() => { setShowCollapsedMenu(false); setShowLogoutConfirm(true); }}
                              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-2)] hover:text-red-400 whitespace-nowrap"
                           >
                              <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                              {t('nav.logout')}
                           </button>
                        </div>
                     </>
                  )}
                </>
              ) : (
                <>
                  <div title={user.name || user.email}>
                    <Avatar src={user.avatarUrl ?? undefined} name={user.name || user.email} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">
                      {user.name || t('profile.unnamed')}
                    </p>
                    <p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p>
                  </div>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-red-400"
                    title={t('nav.logout')}
                  >
                    <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </aside>

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
