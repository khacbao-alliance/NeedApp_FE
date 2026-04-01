"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  BellIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeSolid,
  BellIcon as BellSolid,
  ChatBubbleLeftIcon as ChatSolid,
  UserIcon as UserSolid,
} from "@heroicons/react/24/solid";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/feed", Icon: HomeIcon, ActiveIcon: HomeSolid },
  { href: "/notifications", Icon: BellIcon, ActiveIcon: BellSolid },
  { href: "/messages", Icon: ChatBubbleLeftIcon, ActiveIcon: ChatSolid },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ href, Icon, ActiveIcon }) => {
          const isActive = pathname.startsWith(href);
          const Ico = isActive ? ActiveIcon : Icon;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                isActive ? "text-blue-600" : "text-gray-400"
              )}
            >
              <Ico className="h-6 w-6" />
            </Link>
          );
        })}
        {user && (
          <Link
            href={`/profile/${user.id}`}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
              pathname.startsWith("/profile") ? "text-blue-600" : "text-gray-400"
            )}
          >
            <UserIcon className="h-6 w-6" />
          </Link>
        )}
      </div>
    </nav>
  );
}
