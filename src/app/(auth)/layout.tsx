import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NeedApp — Đăng nhập",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[var(--accent-violet)]/10 blur-[128px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[var(--accent-cyan)]/10 blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-indigo)]/5 blur-[96px]" />
      </div>
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
