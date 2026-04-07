'use client';

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
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  DocumentTextIcon as DocSolid,
  UserGroupIcon as UserGroupSolid,
  UserCircleIcon as UserSolid,
  BellIcon as BellSolid,
} from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
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
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, role } = useAuth();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );

  return (
    <aside className="glass sticky top-0 flex h-screen w-64 flex-col px-4 py-6 border-r border-[var(--border)]">
      {/* Logo & Theme Toggle */}
      <div className="mb-8 flex items-center justify-between px-2">
        <Link href="/dashboard" className="flex items-center min-w-0">
          <Image
            src="/NeedAPP_logo.png"
            alt="NeedApp"
            width={110}
            height={32}
            priority
            className="h-auto max-w-[110px]"
          />
        </Link>
        <div className="flex items-center gap-1 flex-shrink-0">
          <LanguageToggle size="sm" />
          <ThemeToggle size="sm" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1">
        {visibleItems.map(({ href, labelKey, Icon, ActiveIcon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + '/');
          const Ico = isActive ? ActiveIcon : Icon;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[var(--accent-indigo)]/10 text-[var(--accent-violet)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
              )}
            >
              <Ico className="h-5 w-5 flex-shrink-0" />
              {t(labelKey)}
              {href === '/notifications' && unreadCount > 0 && (
                <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-indigo)] px-1.5 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}

        {user && (
          <Link
            href="/profile"
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
              pathname.startsWith('/profile')
                ? 'bg-[var(--accent-indigo)]/10 text-[var(--accent-violet)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
            )}
          >
            <UserCircleIcon className="h-5 w-5 flex-shrink-0" />
            {t('nav.profile')}
          </Link>
        )}
      </nav>

      {/* User Info */}
      {user && (
        <div className="mt-auto rounded-xl bg-[var(--surface-2)] p-3">
          <div className="flex items-center gap-3">
            <Avatar src={user.avatarUrl ?? undefined} name={user.name || user.email} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">
                {user.name || 'User'}
              </p>
              <p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-red-400"
              title={t('nav.logout')}
            >
              <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
