// @ts-nocheck

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/firebase/hooks';

export function useAdminChatNotifications() {
  const [notifications, setNotifications] = useState<{ [key: string]: number }>({});
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const adminNotificationsRef = collection(db, 'adminNotifications');
        const q = query(
          adminNotificationsRef,
          where('read', '==', false)
        );

        const querySnapshot = await getDocs(q);
        const notificationsData: { [key: string]: number } = {};

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.orderid) {
            notificationsData[data.orderid] = (notificationsData[data.orderid] || 0) + (data.unreadCount || 1);
          }
        });

        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error fetching admin chat notifications:', error);
      }
    };

    const interval = setInterval(fetchNotifications, 5000);
    fetchNotifications();

    return () => clearInterval(interval);
  }, [user]);

  const markMessagesAsRead = async (orderId: string) => {
    try {
      const adminNotificationsRef = collection(db, 'adminNotifications');
      const q = query(
        adminNotificationsRef,
        where('orderid', '==', orderId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          read: true,
          unreadCount: 0
        })
      );

      await Promise.all(updatePromises);

      setNotifications(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    } catch (error) {
      console.error('Error marking admin messages as read:', error);
    }
  };

  const hasUnreadMessages = (orderId: string): boolean => {
    return !!notifications[orderId];
  };

  const getUnreadCount = (orderId: string): number => {
    return notifications[orderId] || 0;
  };

  return {
    notifications,
    markMessagesAsRead,
    hasUnreadMessages,
    getUnreadCount
  };
} 