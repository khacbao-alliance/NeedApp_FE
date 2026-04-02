'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ClientNavbar } from '@/components/layout/ClientNavbar';
import { Footer } from '@/components/layout/Footer';
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  const { isAuthenticated, role, isLoading } = useAuth();
  const router = useRouter();

  // Admin/Staff should go to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && role !== 'Client') {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, role, router]);

  if (!isLoading && isAuthenticated && role !== 'Client') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ClientNavbar />

      <main className="flex-1">
        {/* ═══ HERO SECTION ═══ */}
        <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
          {/* Background Effects */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-[var(--accent-violet)]/8 blur-[128px]" />
            <div className="absolute -bottom-20 right-1/4 h-[400px] w-[400px] rounded-full bg-[var(--accent-cyan)]/8 blur-[128px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-[var(--accent-indigo)]/5 blur-[96px]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--surface-1)] px-4 py-1.5 text-sm animate-fade-in">
                <SparklesIcon className="h-4 w-4 text-[var(--accent-violet)]" />
                <span className="text-[var(--text-secondary)]">Quản lý yêu cầu thông minh</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl animate-slide-up">
                Biến ý tưởng thành{' '}
                <span className="gradient-text">hiện thực</span>
                <br />
                chỉ với vài bước
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-lg text-[var(--text-secondary)] sm:text-xl max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
                NeedApp giúp bạn gửi yêu cầu, trao đổi trực tiếp với đội ngũ chuyên gia
                và theo dõi tiến độ dự án — tất cả trong một nền tảng duy nhất.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-slide-up" style={{ animationDelay: '200ms' }}>
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/requests/new"
                      className="btn-gradient rounded-xl px-8 py-3.5 text-base font-semibold inline-flex items-center gap-2"
                    >
                      Tạo yêu cầu mới
                      <ChevronRightIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/requests"
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-8 py-3.5 text-base font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all inline-flex items-center gap-2"
                    >
                      Xem yêu cầu của tôi
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="btn-gradient rounded-xl px-8 py-3.5 text-base font-semibold inline-flex items-center gap-2"
                    >
                      Bắt đầu miễn phí
                      <ChevronRightIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/login"
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-8 py-3.5 text-base font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all inline-flex items-center gap-2"
                    >
                      Đăng nhập
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Hero Visual — Mock UI Preview */}
            <div className="mt-16 sm:mt-20 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <div className="gradient-border rounded-2xl">
                <div className="rounded-2xl bg-[var(--surface-1)] p-1">
                  <div className="rounded-xl bg-[var(--background)] p-4 sm:p-6">
                    {/* Mock Chat UI */}
                    <div className="flex flex-col gap-3">
                      <MockMessage
                        align="left"
                        name="Hệ thống"
                        text="Bạn cần website cho lĩnh vực gì?"
                        isSystem
                      />
                      <MockMessage
                        align="right"
                        name="Bạn"
                        text="Tôi cần website bán hàng thời trang online"
                      />
                      <MockMessage
                        align="left"
                        name="Hệ thống"
                        text="Bạn muốn website có bao nhiêu trang?"
                        isSystem
                      />
                      <MockMessage
                        align="right"
                        name="Bạn"
                        text="Khoảng 5-10 trang, bao gồm trang chủ, sản phẩm, giỏ hàng"
                      />
                      <MockMessage
                        align="left"
                        name="Staff Trần B"
                        text="Chào anh! Em đã nhận yêu cầu. Em sẽ gửi báo giá sau 24h nhé 👋"
                        isStaff
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FEATURES SECTION ═══ */}
        <section id="features" className="py-20 sm:py-28 bg-[var(--surface-1)]/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
                Mọi thứ bạn cần, <span className="gradient-text">tại một nơi</span>
              </h2>
              <p className="mt-4 text-[var(--text-secondary)] text-lg">
                Quy trình đơn giản, giao tiếp rõ ràng, theo dõi mọi lúc.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<DocumentTextIcon className="h-6 w-6" />}
                title="Tạo yêu cầu dễ dàng"
                description="Chỉ cần mô tả ngắn gọn, hệ thống tự động hỏi thêm thông tin cần thiết để hiểu rõ nhu cầu của bạn."
                color="text-[var(--accent-violet)]"
                bg="bg-[var(--accent-violet)]/10"
              />
              <FeatureCard
                icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />}
                title="Chat trực tiếp"
                description="Trao đổi với đội ngũ qua giao diện chat hiện đại. Gửi file, ảnh và nhận phản hồi nhanh chóng."
                color="text-[var(--accent-cyan)]"
                bg="bg-[var(--accent-cyan)]/10"
              />
              <FeatureCard
                icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
                title="Theo dõi tiến độ"
                description="Biết chính xác trạng thái yêu cầu — từ tiếp nhận, đang xử lý đến hoàn thành. Không bao giờ bị bỏ sót."
                color="text-emerald-400"
                bg="bg-emerald-500/10"
              />
              <FeatureCard
                icon={<BoltIcon className="h-6 w-6" />}
                title="Xử lý nhanh chóng"
                description="Quy trình tiếp nhận tự động giúp đội ngũ nắm bắt nhu cầu ngay lập tức, rút ngắn thời gian phản hồi."
                color="text-amber-400"
                bg="bg-amber-500/10"
              />
              <FeatureCard
                icon={<ShieldCheckIcon className="h-6 w-6" />}
                title="Bảo mật cao"
                description="Dữ liệu được mã hóa và bảo vệ. Chỉ bạn và đội ngũ được phân quyền mới truy cập được thông tin."
                color="text-blue-400"
                bg="bg-blue-500/10"
              />
              <FeatureCard
                icon={<ClockIcon className="h-6 w-6" />}
                title="Hỗ trợ 24/7"
                description="Gửi yêu cầu bất cứ lúc nào. Đội ngũ sẽ phản hồi trong thời gian sớm nhất có thể."
                color="text-pink-400"
                bg="bg-pink-500/10"
              />
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section id="how-it-works" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
                Cách <span className="gradient-text">hoạt động</span>
              </h2>
              <p className="mt-4 text-[var(--text-secondary)] text-lg">
                Chỉ 3 bước đơn giản để bắt đầu dự án
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <StepCard
                step={1}
                title="Đăng ký & Tạo yêu cầu"
                description="Tạo tài khoản miễn phí, mô tả ngắn gọn nhu cầu dự án của bạn. Hệ thống sẽ tự động hỏi thêm chi tiết."
              />
              <StepCard
                step={2}
                title="Trao đổi với đội ngũ"
                description="Chat trực tiếp, gửi tài liệu tham khảo. Đội ngũ sẽ phân tích và đưa ra giải pháp phù hợp nhất."
              />
              <StepCard
                step={3}
                title="Theo dõi & Nhận kết quả"
                description="Theo dõi tiến độ real-time, nhận cập nhật tự động. Dự án hoàn thành đúng hạn, đúng yêu cầu."
              />
            </div>
          </div>
        </section>

        {/* ═══ STATS ═══ */}
        <section className="py-16 bg-[var(--surface-1)]/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              <StatItem value="500+" label="Yêu cầu đã xử lý" />
              <StatItem value="99%" label="Khách hàng hài lòng" />
              <StatItem value="24h" label="Thời gian phản hồi" />
              <StatItem value="100+" label="Dự án hoàn thành" />
            </div>
          </div>
        </section>

        {/* ═══ CTA SECTION ═══ */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-violet)] via-[var(--accent-indigo)] to-[var(--accent-cyan)] opacity-90" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNhKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />

              <div className="relative px-8 py-16 sm:px-16 sm:py-20 text-center">
                <h2 className="text-3xl font-bold text-white sm:text-4xl">
                  Sẵn sàng bắt đầu dự án?
                </h2>
                <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
                  Đăng ký miễn phí ngay hôm nay và trải nghiệm cách quản lý yêu cầu chuyên nghiệp nhất.
                </p>
                <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  {isAuthenticated ? (
                    <Link
                      href="/requests/new"
                      className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-[var(--accent-indigo)] hover:bg-white/90 transition-all shadow-lg inline-flex items-center gap-2"
                    >
                      Tạo yêu cầu mới
                      <ChevronRightIcon className="h-4 w-4" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/register"
                        className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-[var(--accent-indigo)] hover:bg-white/90 transition-all shadow-lg inline-flex items-center gap-2"
                      >
                        Đăng ký miễn phí
                        <ChevronRightIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        href="/login"
                        className="rounded-xl border border-white/30 px-8 py-3.5 text-base font-medium text-white hover:bg-white/10 transition-all"
                      >
                        Đăng nhập
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ── Sub Components ──────────────────────────────── */

function MockMessage({
  align,
  name,
  text,
  isSystem,
  isStaff,
}: {
  align: 'left' | 'right';
  name: string;
  text: string;
  isSystem?: boolean;
  isStaff?: boolean;
}) {
  return (
    <div className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          align === 'right'
            ? 'bg-gradient-to-br from-[var(--accent-violet)] to-[var(--accent-indigo)] text-white'
            : isStaff
            ? 'bg-blue-500/10 border border-blue-500/20 text-[var(--foreground)]'
            : 'bg-[var(--surface-2)] text-[var(--foreground)]'
        }`}
      >
        <p className={`text-[10px] font-medium mb-0.5 ${
          align === 'right' ? 'text-white/70' : isStaff ? 'text-blue-400' : 'text-[var(--text-muted)]'
        }`}>
          {name}
        </p>
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
  bg,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="group rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 transition-all duration-300 hover:border-[var(--glass-border)] hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1">
      <div className={`mb-4 inline-flex rounded-xl p-3 ${bg} transition-transform duration-300 group-hover:scale-110`}>
        <span className={color}>{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="relative group">
      {/* Connector line (hidden on first) */}
      {step > 1 && (
        <div className="hidden lg:block absolute -left-4 top-10 w-8 border-t-2 border-dashed border-[var(--border)]" />
      )}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 transition-all duration-300 hover:border-[var(--glass-border)]">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-violet)] to-[var(--accent-indigo)] text-xl font-bold text-white shadow-lg shadow-[var(--accent-indigo)]/20">
          {step}
        </div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold gradient-text sm:text-4xl">{value}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
