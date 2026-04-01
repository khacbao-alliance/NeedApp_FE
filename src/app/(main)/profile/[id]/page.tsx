"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatNumber } from "@/lib/utils";
import type { User } from "@/types";
import { api } from "@/services/requests";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) =>
      api
        .get<{ data: User }>(`/users/${id}`)
        .then((res) => setUser(res.data))
        .catch(console.error)
        .finally(() => setLoading(false))
    );
  }, [params]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-16 text-center text-gray-400">
        Không tìm thấy người dùng.
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {user.name}
        </h1>
      </header>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <Avatar src={user.avatar} name={user.name} size="xl" />
          <Button variant="secondary" size="sm">
            Theo dõi
          </Button>
        </div>

        <div className="mt-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {user.name}
          </h2>
          <p className="text-sm text-gray-500">@{user.username}</p>
          {user.bio && (
            <p className="mt-2 text-gray-700 dark:text-gray-300">{user.bio}</p>
          )}
        </div>

        <div className="mt-3 flex gap-4 text-sm">
          <span>
            <strong className="text-gray-900 dark:text-gray-100">
              {formatNumber(user.following)}
            </strong>{" "}
            <span className="text-gray-500">Đang theo dõi</span>
          </span>
          <span>
            <strong className="text-gray-900 dark:text-gray-100">
              {formatNumber(user.followers)}
            </strong>{" "}
            <span className="text-gray-500">Người theo dõi</span>
          </span>
        </div>
      </div>
    </div>
  );
}
