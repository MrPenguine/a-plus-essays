import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/firebase/hooks';

export function useChatNotifications() {
  const [chatNotifications, setChatNotifications] = useState<Record<string, number>>({});
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userid', '==', user.uid),
      where('unreadCount', '>', 0)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: Record<string, number> = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.read === false) {
          const orderId = data.displayOrderId || data.orderid;
          if (orderId && data.unreadCount > 0) {
            newNotifications[orderId] = data.unreadCount;
          }
        }
      });

      setChatNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [user]);

  return { chatNotifications };
} 