import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, updateDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '@/lib/firebase/hooks';

interface BidNotification {
  orderid: string;
  unreadCount: number;
  tutorId: string;
}

export function useBidNotifications(orderId?: string) {
  const [notifications, setNotifications] = useState<Record<string, BidNotification>>({});
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Record<string, BidNotification> = {};
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.messages && Array.isArray(data.messages)) {
          const unreadMessages = data.messages.filter(msg => 
            msg.isBidding && !msg.read
          );
          
          if (unreadMessages.length > 0) {
            unreadMessages.forEach(msg => {
              const key = `${data.orderid}_${msg.tutorId}`;
              if (!notifs[key]) {
                notifs[key] = {
                  orderid: data.orderid,
                  unreadCount: 0,
                  tutorId: msg.tutorId
                };
              }
              notifs[key].unreadCount++;
            });
          }
        }
      });
      
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  const markBidMessagesAsRead = async (tutorId: string) => {
    if (!user || !orderId) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('orderid', '==', orderId),
      where('tutorId', '==', tutorId)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map((doc) => {
      const messages = doc.data().messages || [];
      const updatedMessages = messages.map((msg: any) => ({
        ...msg,
        read: true
      }));
      
      return updateDoc(doc.ref, {
        messages: updatedMessages
      });
    });

    await Promise.all(updatePromises);
  };

  const getUnreadCount = (tutorId: string): number => {
    return Object.values(notifications).reduce((total, notif) => 
      notif.tutorId === tutorId ? total + notif.unreadCount : total, 0
    );
  };

  const getTotalUnreadCount = (): number => {
    return Object.values(notifications).reduce((total, notif) => 
      total + notif.unreadCount, 0
    );
  };

  const hasUnreadMessages = (): boolean => {
    return Object.values(notifications).some(notif => notif.unreadCount > 0);
  };

  const getOrderUnreadCount = (orderId: string): number => {
    return Object.values(notifications)
      .filter(notif => notif.orderid === orderId)
      .reduce((total, notif) => total + notif.unreadCount, 0);
  };

  return { 
    notifications, 
    markBidMessagesAsRead,
    getUnreadCount,
    getTotalUnreadCount,
    hasUnreadMessages,
    getOrderUnreadCount
  };
} 