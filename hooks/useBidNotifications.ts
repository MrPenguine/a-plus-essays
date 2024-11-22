import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, updateDoc, getDocs } from 'firebase/firestore';

export const useBidNotifications = () => {
  const [notifications, setNotifications] = useState<Record<string, number>>({});
  const [orderNotifications, setOrderNotifications] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: Record<string, number> = {};
      const newOrderNotifications: Record<string, boolean> = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.messages && Array.isArray(data.messages)) {
          // Process messages for this document
          data.messages.forEach((msg: any) => {
            if (msg.isBidding && !msg.read && msg.sender !== msg.tutorId) {
              // For tutor-level notifications
              const tutorKey = `${data.orderid}_${msg.tutorId}`;
              newNotifications[tutorKey] = (newNotifications[tutorKey] || 0) + 1;

              // For order-level notifications
              newOrderNotifications[data.orderid] = true;
            }
          });
        }
      });

      console.log('Notifications State:', {
        tutorLevel: newNotifications,
        orderLevel: newOrderNotifications
      });

      setNotifications(newNotifications);
      setOrderNotifications(newOrderNotifications);
    });

    return () => unsubscribe();
  }, []);

  const markMessagesAsRead = async (orderId: string, tutorId: string) => {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('orderid', '==', orderId)
      );

      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.messages && Array.isArray(data.messages)) {
          const updatedMessages = data.messages.map((msg: any) => {
            if (msg.tutorId === tutorId && msg.sender !== tutorId) {
              return { ...msg, read: true };
            }
            return msg;
          });

          await updateDoc(doc.ref, { messages: updatedMessages });

          // Clear notifications immediately
          setNotifications(prev => {
            const updated = { ...prev };
            delete updated[`${orderId}_${tutorId}`];
            return updated;
          });

          // Check if there are any remaining unread messages for this order
          const hasUnreadMessages = updatedMessages.some(msg => 
            msg.isBidding && !msg.read && msg.sender !== msg.tutorId
          );

          if (!hasUnreadMessages) {
            setOrderNotifications(prev => {
              const updated = { ...prev };
              delete updated[orderId];
              return updated;
            });
          }
        }
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return {
    notifications,
    orderNotifications,
    markMessagesAsRead,
    hasUnreadMessages: (orderId: string) => orderNotifications[orderId] || false,
    getUnreadCount: (orderId: string, tutorId: string) => notifications[`${orderId}_${tutorId}`] || 0
  };
}; 