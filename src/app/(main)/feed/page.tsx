"use client";

import { useEffect, useState } from "react";
import { postService } from "@/services/posts";
import type { Post } from "@/types";
import { PostCard } from "@/components/feed/PostCard";
import { CreatePost } from "@/components/feed/CreatePost";

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    postService
      .getFeed(1)
      .then((res) => {
        setPosts(res.data);
        setHasMore(res.hasMore);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    const nextPage = page + 1;
    const res = await postService.getFeed(nextPage);
    setPosts((prev) => [...prev, ...res.data]);
    setHasMore(res.hasMore);
    setPage(nextPage);
  };

  const handlePost = (content: string) => {
    const mockPost: Post = {
      id: Date.now().toString(),
      content,
      author: {
        id: "me",
        name: "Bạn",
        username: "me",
        followers: 0,
        following: 0,
        createdAt: new Date().toISOString(),
      },
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [mockPost, ...prev]);
  };

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Trang chủ
        </h1>
      </header>

      <CreatePost onPost={handlePost} />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          Chưa có bài đăng nào. Hãy chia sẻ điều gì đó!
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {hasMore && (
            <button
              onClick={loadMore}
              className="w-full py-4 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              Xem thêm
            </button>
          )}
        </>
      )}
    </div>
  );
}
