'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { requestService } from '@/services/requestsApi';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ApiRequestError } from '@/services/requests';
import type { RequestPriority } from '@/types';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function NewRequestPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const priorityOptions = [
    { value: 'Low', label: '🟢 ' + t('requests.new.priorityLow') },
    { value: 'Medium', label: '🔵 ' + t('requests.new.priorityMedium') },
    { value: 'High', label: '🟠 ' + t('requests.new.priorityHigh') },
    { value: 'Urgent', label: '🔴 ' + t('requests.new.priorityUrgent') },
  ];
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
        setError(t('requests.new.error'));
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
          {t('requests.new.back')}
        </Link>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('requests.new.title')}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {t('requests.new.subtitle')}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" id="new-request-form">
          <Input
            id="request-title"
            label={t('requests.new.titleLabel')}
            placeholder={t('requests.new.titleHint')}
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />

          <Textarea
            id="request-description"
            label={t('requests.new.descriptionLabel')}
            placeholder={t('requests.new.descriptionHint')}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={4}
          />

          <Select
            id="request-priority"
            label={t('requests.new.priorityLabel')}
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
                {t('common.cancel')}
              </Button>
            </Link>
            <Button type="submit" loading={loading} variant="gradient" id="submit-request">
              <PaperAirplaneIcon className="h-4 w-4" />
              {t('requests.new.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
