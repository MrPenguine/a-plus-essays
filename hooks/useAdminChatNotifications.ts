// @ts-nocheck

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, updateDoc, getDocs } from 'firebase/firestore';

export function useAdminChatNotifications(orderId?: string) {
  const [adminNotifications, setAdminNotifications] = useState<Record<string, number>>({});

  useEffect(() => {
    const notificationsRef = collection(db, 'adminNotifications');
    const q = orderId 
      ? query(notificationsRef, where('orderid', '==', orderId), where('read', '==', false))
      : query(notificationsRef, where('read', '==', false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: Record<string, number> = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        notifications[data.orderid] = data.unreadCount || 0;
      });
      setAdminNotifications(notifications);
    });

    return () => unsubscribe();
  }, [orderId]);

  const markAdminMessagesAsRead = async (orderId: string) => {
    const notificationsRef = collection(db, 'adminNotifications');
    const q = query(
      notificationsRef,
      where('orderid', '==', orderId),
      where('adminread', '==', false)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, {
        read: true,
        unreadadmincount: 0
      })
    );

    await Promise.all(updatePromises);
  };

  return { adminNotifications, markAdminMessagesAsRead };
} 