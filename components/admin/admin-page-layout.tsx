"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

interface AdminPageLayoutProps {
  children: React.ReactNode
  section: string
  page: string
}

export function AdminPageLayout({ children, section, page }: AdminPageLayoutProps) {
  const sidebar = useSidebar()

  return (
    <>
      <header className="fixed top-16 left-0 right-0 z-40 h-14 border-b bg-background">
        <nav className={cn(
          "flex h-full items-center gap-2 px-4 transition-all duration-300",
          sidebar?.open ? "ml-64" : "ml-0"
        )}>
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">{section}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{page}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </nav>
      </header>
      <div className={cn(
        "mt-28 min-h-[calc(100vh-7rem)] transition-all duration-300",
        sidebar?.open ? "ml-64 justify-center" : "ml-0 justify-center"
      )}>
        <div className="w-full px-4">
          <div className="flex-1 justify-center flex flex-col w-full min-w-[900px] max-w-[1600px] mx-auto overflow-x-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  )
} 