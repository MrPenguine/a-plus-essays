import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, DocumentData } from 'firebase/firestore';
import { useAuth } from '@/lib/firebase/hooks';

interface AdminNotification {
  orderid: string;
  message: string;
  timestamp: string;
  read: boolean;
  unreadCount: number;
  chatType: 'active' | 'bidding';
  senderId: string;
  tutorId: string;
}

export const useAdminChatNotifications = (orderid: string) => {
  const [adminNotifications, setAdminNotifications] = useState<Record<string, number>>({});
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Listen for notifications for the specific order
    const notificationsRef = collection(db, 'adminNotifications');
    const q = query(
      notificationsRef,
      where('orderid', '==', orderid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: Record<string, number> = {};
      
      snapshot.forEach((doc) => {
        const data = doc.data() as AdminNotification;
        notifications[data.orderid] = data.unreadCount || 0;
      });

      setAdminNotifications(notifications);
    });

    return () => unsubscribe();
  }, [orderid, user]);

  const markAdminMessagesAsRead = async (orderId: string) => {
    if (!user) return;

    const notificationsRef = collection(db, 'adminNotifications');
    const q = query(
      notificationsRef,
      where('orderid', '==', orderId)
    );

    const snapshot = await q.get();
    snapshot.forEach(async (doc) => {
      await doc.ref.update({
        read: true,
        unreadCount: 0
      });
    });
  };

  return {
    adminNotifications,
    markAdminMessagesAsRead
  };
}; 