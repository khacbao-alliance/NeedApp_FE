"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate, formatNumber } from "@/lib/utils";
import type { Post } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

interface PostCardProps {
  post: Post;
  onLike?: (id: string) => void;
}

export function PostCard({ post, onLike }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    onLike?.(post.id);
  };

  return (
    <article className="border-b border-gray-200 p-4 dark:border-gray-800">
      <div className="flex gap-3">
        <Link href={`/profile/${post.author.id}`}>
          <Avatar src={post.author.avatar} name={post.author.name} size="md" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/profile/${post.author.id}`}
                className="font-semibold text-gray-900 hover:underline dark:text-gray-100"
              >
                {post.author.name}
              </Link>
              <span className="text-gray-400">·</span>
              <span className="text-sm text-gray-400">
                {formatDate(post.createdAt)}
              </span>
            </div>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
          </div>

          <p className="mt-1 whitespace-pre-wrap text-gray-800 dark:text-gray-200">
            {post.content}
          </p>

          {post.images && post.images.length > 0 && (
            <div
              className={`mt-3 grid gap-2 ${
                post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
              }`}
            >
              {post.images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img}
                  alt=""
                  className="w-full rounded-xl object-cover max-h-72"
                />
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-6">
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-red-500"
            >
              {liked ? (
                <HeartSolid className="h-5 w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5" />
              )}
              <span>{formatNumber(likeCount)}</span>
            </button>

            <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-500">
              <ChatBubbleLeftIcon className="h-5 w-5" />
              <span>{formatNumber(post.comments)}</span>
            </button>

            <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-green-500">
              <ShareIcon className="h-5 w-5" />
              <span>{formatNumber(post.shares)}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
