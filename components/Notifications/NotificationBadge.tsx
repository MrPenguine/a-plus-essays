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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-b last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{notification.ordertitle}</p>
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold bg-red-600 text-white rounded-full">
                    {notification.unreadCount}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center py-4 text-gray-500">No new notifications</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 