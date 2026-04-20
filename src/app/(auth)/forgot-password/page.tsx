'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth';
import { ApiRequestError } from '@/services/requests';
import ReCAPTCHA from 'react-google-recaptcha';
import {
  EnvelopeIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

type Step = 'email' | 'otp' | 'password' | 'done';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // ── Step 1: Send email ──
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!recaptchaToken) {
      setError('Vui lòng xác minh bạn không phải là robot.');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim(), recaptchaToken);
      setStep('otp');
      setCountdown(60);
    } catch (err) {
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(t('auth.forgotPassword.cannotSend'));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP (move to password step) ──
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError(t('auth.forgotPassword.otpRequired'));
      return;
    }
    setError('');
    setStep('password');
  };

  // ── Step 3: Reset password ──
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError(t('auth.forgotPassword.minLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.forgotPassword.mismatch'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.resetPassword({
        email: email.trim(),
        otpCode: otp.join(''),
        newPassword,
      });
      setStep('done');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        // If OTP invalid, go back to OTP step
        if (err.status === 400 && err.message.toLowerCase().includes('otp')) {
          setStep('otp');
          setOtp(['', '', '', '', '', '']);
        }
        setError(err.message);
      } else {
        setError(t('auth.forgotPassword.resetFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──
  const handleResend = () => {
    if (countdown > 0) return;
    setError('');
    // Require a fresh recaptcha token for resend
    setStep('email');
    setRecaptchaToken(null);
    setOtp(['', '', '', '', '', '']);
    setTimeout(() => {
      setError('Vui lòng hoàn thành reCAPTCHA để gửi lại mã.');
    }, 100);
  };

  // ── OTP input handlers ──
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    if (value.length > 1) {
      const chars = value.slice(0, 6 - index).split('');
      chars.forEach((c, i) => {
        if (index + i < 6) newOtp[index + i] = c;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(index + chars.length, 5);
      otpRefs.current[nextIdx]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ── Step indicator ──
  const steps = [
    { key: 'email', label: t('auth.forgotPassword.stepEmail') },
    { key: 'otp', label: t('auth.forgotPassword.stepOtp') },
    { key: 'password', label: t('auth.forgotPassword.stepPassword') },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="mx-auto w-full max-w-sm animate-slide-up" id="forgot-password-page">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-8">
        {/* Logo */}
        <div className="mb-6 text-center">
          <Image
            src="/NeedAPP_logo.png"
            alt="NeedApp"
            width={160}
            height={40}
            className="mx-auto h-auto w-auto"
            priority
          />
        </div>

        {/* Step indicator (hide on done) */}
        {step !== 'done' && (
          <div className="mb-6 flex items-center justify-center gap-1.5">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 ${i < currentIdx
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : i === currentIdx
                      ? 'bg-[var(--accent-indigo)]/20 text-[var(--accent-violet)] ring-2 ring-[var(--accent-indigo)]/30'
                      : 'bg-[var(--surface-3)] text-[var(--text-muted)]'
                  }`}>
                  {i < currentIdx ? <CheckIcon className="h-3 w-3" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-px w-8 transition-colors duration-300 ${i < currentIdx ? 'bg-emerald-500/40' : 'bg-[var(--border)]'
                    }`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══════ Step 1: Email ═══════ */}
        {step === 'email' && (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-indigo)]/15">
                <EnvelopeIcon className="h-6 w-6 text-[var(--accent-violet)]" />
              </div>
              <h1 className="text-lg font-bold text-[var(--foreground)]">{t('auth.forgotPassword.emailTitle')}</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {t('auth.forgotPassword.emailSubtitle')}
              </p>
            </div>

            <form onSubmit={handleSendEmail} className="flex flex-col gap-4" id="forgot-email-form">
              <Input
                id="forgot-email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex justify-center my-1">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
                  onChange={(token) => setRecaptchaToken(token)}
                  theme="light"
                />
              </div>

              <Button type="submit" loading={loading} variant="gradient" className="w-full mt-1" id="forgot-submit">
                {t('auth.forgotPassword.sendOtp')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                {t('auth.forgotPassword.backToLogin')}
              </Link>
            </div>
          </>
        )}

        {/* ═══════ Step 2: OTP ═══════ */}
        {step === 'otp' && (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15">
                <ShieldCheckIcon className="h-6 w-6 text-emerald-400" />
              </div>
              <h1 className="text-lg font-bold text-[var(--foreground)]">{t('auth.forgotPassword.otpTitle')}</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {t('auth.forgotPassword.otpSentTo')}{' '}
                <span className="font-medium text-[var(--foreground)]">{email}</span>
              </p>
            </div>

            <form onSubmit={handleOtpSubmit} className="flex flex-col gap-5" id="otp-form">
              {/* OTP Inputs */}
              <div className="flex justify-center gap-2.5">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    className={`h-12 w-11 rounded-xl border-2 text-center text-lg font-bold outline-none transition-all duration-200
                      ${digit
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/10'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)]'
                      }
                      focus:border-[var(--accent-indigo)] focus:ring-2 focus:ring-[var(--accent-indigo)]/30 focus:shadow-md focus:shadow-[var(--accent-indigo)]/10
                    `}
                    id={`otp-${i}`}
                  />
                ))}
              </div>

              {/* Resend */}
              <div className="text-center">
                {countdown > 0 ? (
                  <span className="text-xs text-[var(--text-muted)]">
                    {t('auth.forgotPassword.resendAfter')} <span className="tabular-nums font-medium text-[var(--foreground)]">{countdown}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-xs font-medium text-[var(--accent-violet)] hover:text-[var(--accent-indigo)] transition-colors disabled:opacity-50"
                  >
                    {t('auth.forgotPassword.resendOtp')}
                  </button>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={otp.join('').length < 6}
                id="otp-submit"
              >
                {t('common.confirm')}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <button
                onClick={() => { setStep('email'); setError(''); }}
                className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <ArrowLeftIcon className="h-3 w-3" />
                {t('auth.forgotPassword.changeEmail')}
              </button>
            </div>
          </>
        )}

        {/* ═══════ Step 3: New Password ═══════ */}
        {step === 'password' && (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-indigo)]/15">
                <LockClosedIcon className="h-6 w-6 text-[var(--accent-violet)]" />
              </div>
              <h1 className="text-lg font-bold text-[var(--foreground)]">{t('auth.forgotPassword.newPasswordTitle')}</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {t('auth.forgotPassword.newPasswordSubtitle')}
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-4" id="new-password-form">
              <PasswordInput
                id="new-password"
                label={t('auth.forgotPassword.newPassword')}
                placeholder={t('auth.forgotPassword.newPasswordHint')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              <PasswordInput
                id="confirm-password"
                label={t('auth.forgotPassword.confirmPassword')}
                placeholder={t('auth.forgotPassword.confirmHint')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              {/* Password match indicator */}
              {confirmPassword && (
                <div className={`flex items-center gap-1.5 text-xs ${newPassword === confirmPassword ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${newPassword === confirmPassword ? 'bg-emerald-400' : 'bg-red-400'
                    }`} />
                  {newPassword === confirmPassword ? t('auth.forgotPassword.passwordMatch') : t('auth.forgotPassword.passwordNotMatch')}
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button type="submit" loading={loading} variant="gradient" className="w-full mt-1" id="reset-submit">
                {t('auth.forgotPassword.resetBtn')}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <button
                onClick={() => { setStep('otp'); setError(''); }}
                className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <ArrowLeftIcon className="h-3 w-3" />
                {t('auth.forgotPassword.backToOtp')}
              </button>
            </div>
          </>
        )}

        {/* ═══════ Step 4: Success ═══════ */}
        {step === 'done' && (
          <div className="text-center py-4 animate-fade-in">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircleIcon className="h-7 w-7 text-emerald-400" />
            </div>
            <h1 className="text-lg font-bold text-[var(--foreground)]">{t('auth.forgotPassword.successTitle')}</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {t('auth.forgotPassword.successMessage')}
            </p>
            <Button
              onClick={() => router.push('/login')}
              variant="gradient"
              className="w-full mt-6"
              id="goto-login"
            >
              {t('auth.forgotPassword.goToLogin')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
