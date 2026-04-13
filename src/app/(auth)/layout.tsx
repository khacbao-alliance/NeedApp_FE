import type { Metadata } from "next";
import { GuestGuard } from "@/components/auth/GuestGuard";
import { AuthAnimatedLayout } from "./AuthAnimatedLayout";

export const metadata: Metadata = {
  title: "NeedApp — Login",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthAnimatedLayout>
      <GuestGuard>{children}</GuestGuard>
    </AuthAnimatedLayout>
  );
}
