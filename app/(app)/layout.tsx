import { AppSidebar } from "@/components/shell/app-sidebar";
import { CommandMenu } from "@/components/shell/command-menu";
import { MobileNav } from "@/components/shell/mobile-nav";
import { SyncBoot } from "@/components/shell/sync-boot";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SyncBoot />
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav />
          <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 sm:px-6 md:pb-12 lg:px-10 lg:pt-10">
            {children}
          </main>
        </div>
      </div>
      <CommandMenu />
    </>
  );
}
