import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, updateDoc, getDocs } from 'firebase/firestore';
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
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: Record<string, number> = {};
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        notifications[data.orderid] = data.unreadCount || 0;
      });
      
      setChatNotifications(notifications);
    });

    return () => unsubscribe();
  }, [user]);

  const markMessagesAsRead = async (orderId: string) => {
    if (!user) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('orderid', '==', orderId),
      where('userid', '==', user.uid)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, {
        read: true,
        unreadCount: 0
      })
    );

    await Promise.all(updatePromises);
  };

  return { chatNotifications, markMessagesAsRead };
} 