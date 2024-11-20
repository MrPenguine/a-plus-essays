// @ts-nocheck

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/firebase/hooks';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from 'next/navigation';
import { useChatNotifications } from '@/lib/firebase/hooks';
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  orderid: string;
  userid: string;
  message: string;
  timestamp: string;
  read: boolean;
  ordertitle: string;
  unreadCount: number;
}

export default function NotificationBadge() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  const { chatNotifications } = useChatNotifications();

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userid', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: Notification[] = [];
      let count = 0;

      snapshot.forEach((doc) => {
        const data = doc.data() as Notification;
        newNotifications.push({ ...data, id: doc.id });
        count += data.unreadCount;
      });

      setNotifications(newNotifications);
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [user]);

  const handleNotificationClick = async (notification: Notification) => {
    // Navigate to order and open chat
    router.push(`/orders/${notification.orderid}?openChat=true`);
    
    // Mark notification as read
    try {
      const notificationRef = doc(db, 'notifications', notification.id);
      await updateDoc(notificationRef, {
        read: true,
        unreadCount: 0
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Calculate total notifications including chat notifications
  const totalNotifications = unreadCount + Object.values(chatNotifications).reduce((sum, count) => sum + count, 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalNotifications > 0 && (
            <div className="absolute -top-2 -right-2 flex items-center justify-center">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white">
                {totalNotifications}
              </span>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-lg"
        align="end"
      >
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length > 0 || Object.keys(chatNotifications).length > 0 ? (
            <>
              {/* Regular notifications */}
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{notification.message}</p>
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold bg-red-600 text-white rounded-full">
                      {notification.unreadCount}
                    </span>
                  </div>
                </div>
              ))}

              {/* Chat notifications */}
              {Object.entries(chatNotifications).map(([orderId, count]) => (
                <div
                  key={orderId}
                  onClick={() => router.push(`/orders/${orderId}?openChat=true`)}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">New messages in Order #{orderId.slice(0, 8)}</p>
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold bg-red-600 text-white rounded-full">
                      {count}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Click to view messages
                  </p>
                </div>
              ))}
            </>
          ) : (
            <p className="text-center py-4 text-gray-500">No new notifications</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 