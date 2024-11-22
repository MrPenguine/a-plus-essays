"use client"

import { AppSidebar } from "@/components/admin/app-sidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

interface AdminPageLayoutProps {
  children: React.ReactNode
  section: string
  page: string
}

export function AdminPageLayout({ children, section, page }: AdminPageLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      const toggle = document.getElementById('sidebar-toggle');
      
      if (sidebar && 
          toggle && 
          !sidebar.contains(event.target as Node) && 
          !toggle.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <AppSidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="left" 
          className="p-0 w-64 bg-white dark:bg-gray-900"
          id="mobile-sidebar"
        >
          <AppSidebar className="border-none" />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Fixed Header */}
        <div className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40 flex-shrink-0">
          <div className="flex items-center h-full px-4 md:px-6">
            <div className="flex items-center gap-4">
              {/* Sidebar Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                id="sidebar-toggle"
                className="md:hidden"
                onClick={() => setIsOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Breadcrumb */}
              <h1 className="text-lg font-semibold">
                {section} / <span className="text-muted-foreground">{page}</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area with top padding */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6 space-y-6 pt-8 md:pt-10">
            {children}
          </div>
        </div>
      </div>

      {/* Overlay when mobile sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 