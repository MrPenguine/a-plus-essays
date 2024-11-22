import * as React from "react"
import { GalleryVerticalEnd } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { cn } from "@/lib/utils"

const data = {
  navMain: [
    {
      title: "Projects",
      url: "#",
      items: [
        {
          title: "All Projects",
          url: "/admin/projects/all-projects",
        },
        {
          title: "Pending",
          url: "/admin/projects/pending",
        },
        {
          title: "In Progress",
          url: "/admin/projects/in-progress",
        },
        {
          title: "Completed",
          url: "/admin/projects/completed",
        },
        {
          title: "Cancelled",
          url: "/admin/projects/cancelled",
        },
      ],
    },
    {
      title: "Chats",
      url: "#",
      items: [
        {
          title: "Bid Chats",
          url: "/admin/chats/bid",
        },
        {
          title: "Active Chats",
          url: "/admin/chats/active",
        },
      ],
    },
    {
      title: "Payments",
      url: "#",
      items: [
        {
          title: "All Payments",
          url: "/admin/payments/all",
        },
        {
          title: "Pending",
          url: "/admin/payments/pending",
        },
        {
          title: "Completed",
          url: "/admin/payments/completed",
        },
        {
          title: "Failed",
          url: "/admin/payments/failed",
        },
      ],
    },
    {
      title: "Admin Rules",
      url: "#",
      items: [
        {
          title: "Users",
          url: "/admin/users",
        },
        {
          title: "Tutors",
          url: "/admin/tutors",
        },
      ],
    },
  ],
}

interface AppSidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function AppSidebar({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <Sidebar 
      className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r",
        className
      )}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Admin Panel</span>
                  <span className="">Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto">
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link href={item.url} className="font-medium">
                    {item.title}
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton 
                          asChild 
                          isActive={pathname === subItem.url}
                        >
                          <Link href={subItem.url}>{subItem.title}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
