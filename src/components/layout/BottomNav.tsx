'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  DocumentTextIcon,
  UserCircleIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  DocumentTextIcon as DocSolid,
  UserCircleIcon as UserSolid,
  BellIcon as BellSolid,
} from '@heroicons/react/24/solid';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', Icon: HomeIcon, ActiveIcon: HomeSolid, labelKey: 'nav.dashboard' },
  { href: '/requests', Icon: DocumentTextIcon, ActiveIcon: DocSolid, labelKey: 'nav.requests' },
  { href: '/notifications', Icon: BellIcon, ActiveIcon: BellSolid, labelKey: 'nav.notifications' },
  { href: '/profile', Icon: UserCircleIcon, ActiveIcon: UserSolid, labelKey: 'nav.profile' },
];

export function BottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-[var(--border)] md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ href, Icon, ActiveIcon, labelKey }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          const Ico = isActive ? ActiveIcon : Icon;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all duration-200',
                isActive
                  ? 'text-[var(--accent-primary)]'
                  : 'text-[var(--text-muted)]'
              )}
            >
              <Ico className="h-6 w-6" />
              <span className="text-[10px] font-medium">{t(labelKey)}</span>
              {href === '/notifications' && unreadCount > 0 && (
                <span className="absolute -right-0.5 top-0 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[var(--accent-primary)] px-1 text-[9px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

