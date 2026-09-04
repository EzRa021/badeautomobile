import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { SidebarContent } from "@/components/app/sidebar";
import { MobileTabBar } from "@/components/app/mobile-tab-bar";
import { QuickCreateFab } from "@/components/app/quick-create-fab";
import { UserMenu } from "@/components/app/user-menu";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="lg:grid lg:min-h-svh lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh lg:block">
        <SidebarContent />
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-col">
        {/* Fixed top app bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6 lg:bg-background/85">
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <Image src="/brand/logo-mark.jpg" alt="" width={32} height={26} className="h-6 w-auto rounded" />
            <span className="font-display text-sm font-semibold">Bade Automobile</span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <UserMenu email={user.email ?? "user"} />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pt-6 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Mobile navigation */}
      <MobileTabBar />
      <QuickCreateFab />
    </div>
  );
}
