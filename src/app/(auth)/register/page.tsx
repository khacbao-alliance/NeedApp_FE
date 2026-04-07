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
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';
import { ApiRequestError } from '@/services/requests';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register, googleLogin } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[e.target.name];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: [t('auth.register.passwordMismatch')] });
      return;
    }

    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        name: form.name || undefined,
      });
      router.push('/setup-client');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        if (err.errors) setFieldErrors(err.errors);
      } else {
        setError(t('auth.register.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    // Google register/login creates account if not exists
    const res = await googleLogin(idToken);
    router.push('/setup-client');
  };

  return (
    <div className="mx-auto w-full max-w-sm animate-slide-up" id="register-page">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-8">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Image
            src="/NeedAPP_logo.png"
            alt="NeedApp"
            width={160}
            height={160}
            className="mx-auto h-auto w-auto"
            priority
          />
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {t('auth.register.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" id="register-form">
          <Input
            id="register-name"
            name="name"
            label={t('auth.register.name')}
            placeholder="Nguyễn Văn A"
            value={form.name}
            onChange={handleChange}
            error={fieldErrors['Name']?.[0]}
          />
          <Input
            id="register-email"
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            error={fieldErrors['Email']?.[0]}
          />
          <PasswordInput
            id="register-password"
            name="password"
            label={t('auth.register.password')}
            placeholder={t('auth.register.passwordHint')}
            value={form.password}
            onChange={handleChange}
            minLength={6}
            required
            autoComplete="new-password"
            error={fieldErrors['Password']?.[0]}
          />
          <PasswordInput
            id="register-confirm-password"
            name="confirmPassword"
            label={t('auth.register.confirmPassword')}
            placeholder={t('auth.register.confirmHint')}
            value={form.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
            error={fieldErrors['confirmPassword']?.[0]}
          />

          {error && !Object.keys(fieldErrors).length && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} variant="gradient" className="w-full mt-2" id="register-submit">
            {t('auth.register.submit')}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 border-t border-[var(--border)]" />
          <span className="text-xs text-[var(--text-muted)]">hoặc</span>
          <div className="flex-1 border-t border-[var(--border)]" />
        </div>

        {/* Google Sign-In */}
        <GoogleSignInButton onSuccess={handleGoogleLogin} />

        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            {t('auth.register.hasAccount')}{' '}
            <Link href="/login" className="font-medium text-[var(--accent-violet)] hover:text-[var(--accent-indigo)] transition-colors">
              {t('nav.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
