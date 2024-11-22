import * as React from "react"
import { GalleryVerticalEnd } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useBidNotifications } from '@/hooks/useBidNotifications';
import { useEffect, useState } from 'react';
import { db } from "@/lib/firebase/config";
import { collection, query, onSnapshot } from "firebase/firestore";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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

// Add NotificationBadge component
const NotificationBadge = ({ count }: { count: number }) => (
  <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-medium text-white">
    {count}
  </span>
);

interface AppSidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function AppSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const bidNotifications = useBidNotifications();
  const [activeChatNotifications, setActiveChatNotifications] = useState<number>(0);

  // Listen to active chat notifications
  useEffect(() => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalUnread = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Add safety check for orderid existence
        if (!data.read && data.orderid && !data.orderid.startsWith('bidding_')) {
          totalUnread += (data.unreadCount || 0);
        }
      });
      setActiveChatNotifications(totalUnread);
    });

    return () => unsubscribe();
  }, []);

  // Calculate total unread bid messages
  const totalUnreadBidMessages = React.useMemo(() => {
    return Object.values(bidNotifications.notifications).reduce((total, count) => total + count, 0);
  }, [bidNotifications.notifications]);

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
                          className="relative flex items-center justify-between"
                        >
                          <Link href={subItem.url} className="flex items-center w-full">
                            <span>{subItem.title}</span>
                            {/* Show notification count for Bid Chats */}
                            {subItem.title === "Bid Chats" && totalUnreadBidMessages > 0 && (
                              <NotificationBadge count={totalUnreadBidMessages} />
                            )}
                            {/* Show notification count for Active Chats */}
                            {subItem.title === "Active Chats" && activeChatNotifications > 0 && (
                              <NotificationBadge count={activeChatNotifications} />
                            )}
                          </Link>
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
