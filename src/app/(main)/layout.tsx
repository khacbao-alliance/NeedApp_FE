import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <main className="flex-1 pb-16 md:pb-0">
        <div className="mx-auto max-w-2xl">{children}</div>
      </main>

      <BottomNav />
    </div>
  );
}
