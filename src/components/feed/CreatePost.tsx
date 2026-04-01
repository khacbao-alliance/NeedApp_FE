"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { PhotoIcon } from "@heroicons/react/24/outline";

interface CreatePostProps {
  onPost?: (content: string) => void;
}

export function CreatePost({ onPost }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      onPost?.(content.trim());
      setContent("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-b border-gray-200 p-4 dark:border-gray-800">
      <div className="flex gap-3">
        <Avatar src={user.avatar} name={user.name} size="md" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bạn đang cần gì hôm nay?"
            rows={3}
            className="w-full resize-none bg-transparent text-gray-800 placeholder-gray-400 outline-none dark:text-gray-200"
          />
          <div className="mt-2 flex items-center justify-between">
            <button className="text-blue-500 hover:text-blue-600">
              <PhotoIcon className="h-5 w-5" />
            </button>
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!content.trim()}
              size="sm"
            >
              Đăng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
