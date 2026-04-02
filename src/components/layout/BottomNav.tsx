'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  DocumentTextIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  DocumentTextIcon as DocSolid,
  UserCircleIcon as UserSolid,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', Icon: HomeIcon, ActiveIcon: HomeSolid, label: 'Tổng quan' },
  { href: '/requests', Icon: DocumentTextIcon, ActiveIcon: DocSolid, label: 'Yêu cầu' },
  { href: '/profile', Icon: UserCircleIcon, ActiveIcon: UserSolid, label: 'Hồ sơ' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-[var(--border)] md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ href, Icon, ActiveIcon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          const Ico = isActive ? ActiveIcon : Icon;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all duration-200',
                isActive
                  ? 'text-[var(--accent-violet)]'
                  : 'text-[var(--text-muted)]'
              )}
            >
              <Ico className="h-6 w-6" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
