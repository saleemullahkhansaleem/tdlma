"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/user/dashboard");
    }
  }, [user, loading, router]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-muted">
        {/* Desktop sidebar */}
        <aside className="hidden md:block shrink-0">
          <AdminSidebar pathname={pathname} />
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden fixed top-3 left-3 z-40 bg-card shadow-sm"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <AdminSidebar
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <header className="sticky top-0 z-30 shrink-0 border-b bg-muted/80 backdrop-blur">
            <div className="flex h-14 items-center gap-4 px-4 md:px-6">
              <AdminHeader />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
