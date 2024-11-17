import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '@/lib/firebase/hooks';

interface ChatNotification {
  orderId: string;
  unreadCount: number;
}

export function useChatNotifications() {
  const { user } = useAuth();
  const [chatNotifications, setChatNotifications] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (!user) return;

    // Listen for messages in all user's orders
    const ordersRef = collection(db, 'orders');
    const ordersQuery = query(
      ordersRef,
      where('userid', '==', user.uid),
      where('status', 'in', ['pending', 'in_progress'])
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, async (orderSnapshot) => {
      const orderIds = orderSnapshot.docs.map(doc => doc.id);
      
      // Only set up messages listener if there are orders
      if (orderIds.length > 0) {
        const messagesRef = collection(db, 'messages');
        const messagesQuery = query(
          messagesRef,
          where('orderid', 'in', orderIds)
        );

        const unsubscribeMessages = onSnapshot(messagesQuery, (messageSnapshot) => {
          const notifications: { [key: string]: number } = {};

          messageSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.messages) {
              // Count unread messages (messages where sender is not the current user)
              const unreadCount = data.messages.filter(
                (msg: any) => msg.sender !== user.uid && !msg.read
              ).length;
              
              if (unreadCount > 0) {
                notifications[data.orderid] = unreadCount;
              }
            }
          });

          setChatNotifications(notifications);
        });

        return () => {
          unsubscribeMessages();
        };
      } else {
        // Clear notifications if no orders
        setChatNotifications({});
      }
    });

    return () => {
      unsubscribeOrders();
    };
  }, [user]);

  const markMessagesAsRead = async (orderId: string) => {
    if (!user) return;

    try {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('orderid', '==', orderId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const messageDoc = snapshot.docs[0];
        const messages = messageDoc.data().messages;

        // Mark all messages as read
        const updatedMessages = messages.map((msg: any) => ({
          ...msg,
          read: true
        }));

        await updateDoc(messageDoc.ref, {
          messages: updatedMessages
        });

        // Update local state
        const newNotifications = { ...chatNotifications };
        delete newNotifications[orderId];
        setChatNotifications(newNotifications);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return { chatNotifications, markMessagesAsRead };
} 