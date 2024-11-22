'use client';

import { AppSidebar } from "@/components/admin/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)]" />
        <div className="flex-1 flex flex-col mt-16 w-full items-center justify-center">
          <main className="flex-1 w-full">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
} 