'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestService } from '@/services/requestsApi';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ApiRequestError } from '@/services/requests';
import type { RequestPriority } from '@/types';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const priorityOptions = [
  { value: 'Low', label: '🟢 Thấp' },
  { value: 'Medium', label: '🔵 Trung bình' },
  { value: 'High', label: '🟠 Cao' },
  { value: 'Urgent', label: '🔴 Khẩn cấp' },
];

export default function NewRequestPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium' as RequestPriority,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await requestService.create({
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
      });
      // If firstQuestion exists, go to chat; otherwise go to request detail
      router.push(`/requests/${res.requestId}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Không thể tạo yêu cầu. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl animate-fade-in" id="new-request-page">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/requests"
          className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Tạo yêu cầu mới</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Mô tả yêu cầu của bạn. Hệ thống sẽ tự động hỏi thêm thông tin nếu cần.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" id="new-request-form">
          <Input
            id="request-title"
            label="Tiêu đề yêu cầu"
            placeholder="VD: Thiết kế website bán hàng"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />

          <Textarea
            id="request-description"
            label="Mô tả chi tiết"
            placeholder="Mô tả ngắn gọn về yêu cầu của bạn..."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={4}
          />

          <Select
            id="request-priority"
            label="Mức ưu tiên"
            options={priorityOptions}
            value={form.priority}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                priority: e.target.value as RequestPriority,
              }))
            }
          />

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/requests">
              <Button variant="ghost" type="button">
                Hủy
              </Button>
            </Link>
            <Button type="submit" loading={loading} variant="gradient" id="submit-request">
              <PaperAirplaneIcon className="h-4 w-4" />
              Gửi yêu cầu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
