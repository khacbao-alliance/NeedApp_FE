'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { clientService } from '@/services/clients';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ApiRequestError } from '@/services/requests';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';

export default function SetupClientPage() {
  const { updateUser } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      await clientService.create({
        name: form.name,
        description: form.description || undefined,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
      });
      // Update local user state
      updateUser({ hasClient: true });
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        if (err.errors) setFieldErrors(err.errors);
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md animate-slide-up" id="setup-client-page">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-indigo)]/10">
            <BuildingOffice2Icon className="h-8 w-8 text-[var(--accent-violet)]" />
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">
            Thiết lập hồ sơ doanh nghiệp
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Hoàn thành thông tin để bắt đầu tạo yêu cầu
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" id="setup-client-form">
          <Input
            id="client-name"
            name="name"
            label="Tên công ty / Tổ chức"
            placeholder="VD: Công ty TNHH ABC"
            value={form.name}
            onChange={handleChange}
            required
            error={fieldErrors['Name']?.[0]}
          />

          <Textarea
            id="client-description"
            name="description"
            label="Mô tả"
            placeholder="Mô tả ngắn về công ty / tổ chức của bạn"
            value={form.description}
            onChange={handleChange}
            rows={3}
            error={fieldErrors['Description']?.[0]}
          />

          <Input
            id="client-email"
            name="contactEmail"
            type="email"
            label="Email liên hệ"
            placeholder="contact@company.com"
            value={form.contactEmail}
            onChange={handleChange}
            error={fieldErrors['ContactEmail']?.[0]}
          />

          <Input
            id="client-phone"
            name="contactPhone"
            label="Số điện thoại"
            placeholder="0901234567"
            value={form.contactPhone}
            onChange={handleChange}
            error={fieldErrors['ContactPhone']?.[0]}
          />

          {error && !Object.keys(fieldErrors).length && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} variant="gradient" className="w-full mt-2" id="setup-client-submit">
            Hoàn tất thiết lập
          </Button>
        </form>
      </div>
    </div>
  );
}
