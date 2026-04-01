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
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/feed", label: "Trang chủ", Icon: HomeIcon, ActiveIcon: HomeSolid },
  { href: "/notifications", label: "Thông báo", Icon: BellIcon, ActiveIcon: BellSolid },
  { href: "/messages", label: "Tin nhắn", Icon: ChatBubbleLeftIcon, ActiveIcon: ChatSolid },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-gray-200 bg-white px-4 py-6 dark:border-gray-800 dark:bg-gray-950">
      <Link href="/feed" className="mb-6 flex items-center gap-2 px-2">
        <span className="text-2xl font-bold text-blue-600">NeedApp</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, Icon, ActiveIcon }) => {
          const isActive = pathname.startsWith(href);
          const Ico = isActive ? ActiveIcon : Icon;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              )}
            >
              <Ico className="h-5 w-5" />
              {label}
            </Link>
          );
        })}

        {user && (
          <Link
            href={`/profile/${user.id}`}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/profile")
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            )}
          >
            <UserIcon className="h-5 w-5" />
            Hồ sơ
          </Link>
        )}
      </nav>

      <div className="mt-auto">
        {user ? (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <Avatar src={user.avatar} name={user.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {user.name}
              </p>
              <p className="truncate text-xs text-gray-500">@{user.username}</p>
            </div>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              Thoát
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
