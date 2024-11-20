// @ts-nocheck

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, addDoc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '@/lib/firebase/hooks';
import ably from '@/lib/ably/config';

export function useOrderNotifications() {
  const { user } = useAuth();
  const [activeChannels, setActiveChannels] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch all active orders for the user
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userid', '==', user.uid),
      where('status', 'in', ['pending', 'in_progress'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderIds = snapshot.docs.map(doc => doc.id);
      
      // Unsubscribe from old channels
      activeChannels.forEach(channelId => {
        if (!orderIds.includes(channelId)) {
          ably.channels.get(channelId).unsubscribe();
        }
      });

      // Subscribe to new channels
      orderIds.forEach(orderId => {
        if (!activeChannels.includes(orderId)) {
          const channel = ably.channels.get(orderId);
          channel.subscribe(message => {
            // Handle new message notification
            if (message.data.sender !== user.uid) {
              // Create notification
              const notificationsRef = collection(db, 'notifications');
              addDoc(notificationsRef, {
                orderid: orderId,
                userid: user.uid,
                message: `New message in ${message.data.orderTitle}`,
                timestamp: new Date().toISOString(),
                read: false,
                ordertitle: message.data.orderTitle,
                unreadCount: 1
              });
            }
          });
        }
      });

      setActiveChannels(orderIds);
    });

    return () => {
      unsubscribe();
      activeChannels.forEach(channelId => {
        ably.channels.get(channelId).unsubscribe();
      });
    };
  }, [user]);
} 