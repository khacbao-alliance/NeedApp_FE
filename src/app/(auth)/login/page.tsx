'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { ApiRequestError } from '@/services/requests';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (!res.hasClient) {
        router.push('/setup-client');
      } else if (res.role === 'Client') {
        router.push('/');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(t('auth.login.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm animate-slide-up" id="login-page">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-8">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Image
            src="/NeedAPP_logo.png"
            alt="NeedApp"
            width={160}
            height={40}
            className="mx-auto h-auto w-auto"
            priority
          />
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {t('auth.login.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" id="login-form">
          <Input
            id="login-email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <PasswordInput
            id="login-password"
            label={t('auth.login.password')}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <div className="flex justify-end -mt-2">
            <Link
              href="/forgot-password"
              className="text-xs text-[var(--accent-violet)] hover:text-[var(--accent-indigo)] transition-colors"
            >
              {t('auth.login.forgotPassword')}
            </Link>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} variant="gradient" className="w-full mt-2" id="login-submit">
            {t('auth.login.submit')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            {t('auth.login.noAccount')}{' '}
            <Link href="/register" className="font-medium text-[var(--accent-violet)] hover:text-[var(--accent-indigo)] transition-colors">
              {t('auth.login.registerNow')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
