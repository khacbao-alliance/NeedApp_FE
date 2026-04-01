import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NeedApp - Đăng nhập",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      {children}
    </div>
  );
}
