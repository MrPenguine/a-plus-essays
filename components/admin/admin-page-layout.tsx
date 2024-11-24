"use client"

import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from "@/lib/firebase/hooks";

interface AdminPageLayoutProps {
  children: React.ReactNode
  section: string
  page: string
}

// Manually define routes from app-sidebar
const adminRoutes = [
  {
    title: "Projects",
    items: [
      { title: "All Projects", url: "/admin/projects/all-projects" },
      { title: "Pending", url: "/admin/projects/pending" },
      { title: "In Progress", url: "/admin/projects/in-progress" },
      { title: "Completed", url: "/admin/projects/completed" },
      { title: "Cancelled", url: "/admin/projects/cancelled" },
    ],
  },
  {
    title: "Chats",
    items: [
      { title: "Bid Chats", url: "/admin/chats/bid" },
      { title: "Active Chats", url: "/admin/chats/active" },
    ],
  },
  {
    title: "Payments",
    items: [
      { title: "All Payments", url: "/admin/payments/all" },
    ],
  },
  {
    title: "Admin Rules",
    items: [
      { title: "Users", url: "/admin/users" },
      { title: "Tutors", url: "/admin/tutors" },
    ],
  },
]

export function AdminPageLayout({ children, section, page }: AdminPageLayoutProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()
  const [activeChatNotifications, setActiveChatNotifications] = useState<number>(0)
  const [bidChatNotifications, setBidChatNotifications] = useState<number>(0)
  const [projectCounts, setProjectCounts] = useState({
    all: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0
  })

  // Listen to bid chat notifications
  useEffect(() => {
    if (!user) return

    const notificationsRef = collection(db, 'notifications')
    const q = query(notificationsRef, where('chatType', '==', 'bidding'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalUnreadBidMessages = 0
      
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        if (
          data.chatType === 'bidding' && 
          data.adminread === false && 
          typeof data.unreadadmincount === 'number'
        ) {
          totalUnreadBidMessages += data.unreadadmincount
        }
      })
      
      setBidChatNotifications(totalUnreadBidMessages)
    })

    return () => unsubscribe()
  }, [user])

  // Listen to active chat notifications
  useEffect(() => {
    if (!user) return

    const notificationsRef = collection(db, 'notifications')
    const q = query(notificationsRef)

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalUnread = 0
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        if (
          data.adminread === false && 
          typeof data.unreadadmincount === 'number' && 
          data.unreadadmincount > 0 &&
          data.orderid && 
          !data.orderid.startsWith('bidding_')
        ) {
          totalUnread += data.unreadadmincount
        }
      })
      setActiveChatNotifications(totalUnread)
    })

    return () => unsubscribe()
  }, [user])

  // Fetch project counts
  useEffect(() => {
    const fetchProjectCounts = async () => {
      if (!user) return;
      
      try {
        const ordersRef = collection(db, 'orders');
        const allSnapshot = await getDocs(ordersRef);
        const total = allSnapshot.size;

        const pendingQuery = query(ordersRef, where('status', '==', 'pending'));
        const completedQuery = query(ordersRef, where('status', '==', 'completed'));
        const cancelledQuery = query(ordersRef, where('status', '==', 'cancelled'));
        const inProgressQuery = query(ordersRef, 
          where('status', 'in', ['in_progress', 'partial'])
        );

        const [pendingSnapshot, completedSnapshot, cancelledSnapshot, inProgressSnapshot] = 
          await Promise.all([
            getDocs(pendingQuery),
            getDocs(completedQuery),
            getDocs(cancelledQuery),
            getDocs(inProgressQuery)
          ]);

        setProjectCounts({
          all: total,
          pending: pendingSnapshot.size,
          in_progress: inProgressSnapshot.size,
          completed: completedSnapshot.size,
          cancelled: cancelledSnapshot.size
        });
      } catch (error) {
        console.error('Error fetching project counts:', error);
      }
    };

    fetchProjectCounts();
  }, [user]);

  // Helper function to get notification count for menu items
  const getNotificationCount = (title: string) => {
    if (title === "Bid Chats") return bidChatNotifications
    if (title === "Active Chats") return activeChatNotifications
    return 0
  }

  // Helper function to get project count for menu items
  const getProjectCount = (title: string) => {
    switch (title) {
      case "All Projects": return projectCounts.all
      case "Pending": return projectCounts.pending
      case "In Progress": return projectCounts.in_progress
      case "Completed": return projectCounts.completed
      case "Cancelled": return projectCounts.cancelled
      default: return 0
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2 text-sm font-medium">
            <span>{section}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{page}</span>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-secondary-gray-50 dark:bg-secondary-gray-900 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold text-black dark:text-secondary-gray-50">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileMenu(false)}
                className="text-black dark:text-secondary-gray-50"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="space-y-6">
              {adminRoutes.map((section) => (
                <div key={section.title} className="space-y-3">
                  <h3 className="text-sm font-medium text-black/60 dark:text-secondary-gray-50/60">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.url}
                        href={item.url}
                        onClick={() => setShowMobileMenu(false)}
                        className={`flex items-center justify-between px-2 py-1.5 text-sm rounded-md ${
                          pathname === item.url
                            ? "bg-primary text-primary-foreground"
                            : "text-black dark:text-secondary-gray-50 hover:bg-secondary-gray-100 dark:hover:bg-secondary-gray-800"
                        }`}
                      >
                        <span>{item.title}</span>
                        {getNotificationCount(item.title) > 0 && (
                          <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-medium text-white">
                            {getNotificationCount(item.title)}
                          </span>
                        )}
                        {getProjectCount(item.title) > 0 && (
                          <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium">
                            {getProjectCount(item.title)}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-0">
        <div className="container mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
} 