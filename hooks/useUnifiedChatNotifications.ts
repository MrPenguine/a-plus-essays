import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, updateDoc, getDocs, addDoc, increment } from 'firebase/firestore';
import { useAuth } from '@/lib/firebase/hooks';

interface NotificationData {
  orderid: string;
  unreadCount: number;
  timestamp: string;
  message: string;
  read: boolean;
  chatType: 'active' | 'bidding';
  tutorId?: string;
  ordertitle?: string;
  originalOrderId: string;
}

export function useUnifiedChatNotifications() {
  const [notifications, setNotifications] = useState<Record<string, NotificationData>>({});
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
      const notifs: Record<string, NotificationData> = {};
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as NotificationData;
        const notificationId = data.chatType === 'bidding' 
          ? `bidding_${data.orderid}_${data.tutorId}`
          : data.orderid;
        
        notifs[notificationId] = {
          ...data,
          unreadCount: data.unreadCount || 0
        };
      });
      
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (orderId: string, chatType: 'active' | 'bidding', tutorId?: string) => {
    if (!user) return;

    const notificationsRef = collection(db, 'notifications');
    const notificationId = chatType === 'bidding' ? `bidding_${orderId}_${tutorId}` : orderId;

    const q = query(
      notificationsRef,
      where('orderid', '==', notificationId),
      where('userid', '==', user.uid)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, {
        read: true,
        unreadCount: 0,
        lastReadTimestamp: new Date().toISOString()
      })
    );

    await Promise.all(updatePromises);
  };

  const createNotification = async (
    recipientId: string,
    orderId: string,
    message: string,
    chatType: 'active' | 'bidding',
    tutorId?: string,
    orderTitle?: string
  ) => {
    if (recipientId === user?.uid) return;

    const notificationsRef = collection(db, 'notifications');
    const notificationId = chatType === 'bidding' ? `bidding_${orderId}_${tutorId}` : orderId;

    const q = query(
      notificationsRef,
      where('orderid', '==', notificationId),
      where('userid', '==', recipientId)
    );

    const snapshot = await getDocs(q);

    const notificationData = {
      orderid: notificationId,
      originalOrderId: orderId,
      userid: recipientId,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      unreadCount: 1,
      chatType,
      ...(tutorId && { tutorId }),
      ...(orderTitle && { ordertitle: orderTitle })
    };

    if (snapshot.empty) {
      await addDoc(notificationsRef, notificationData);
    } else {
      const doc = snapshot.docs[0];
      await updateDoc(doc.ref, {
        message,
        timestamp: new Date().toISOString(),
        read: false,
        unreadCount: increment(1)
      });
    }
  };

  const getUnreadCount = (orderId: string, chatType: 'active' | 'bidding', tutorId?: string) => {
    const notificationId = chatType === 'bidding' ? `bidding_${orderId}_${tutorId}` : orderId;
    return notifications[notificationId]?.unreadCount || 0;
  };

  const getNotificationDetails = (orderId: string, chatType: 'active' | 'bidding', tutorId?: string) => {
    const notificationId = chatType === 'bidding' ? `bidding_${orderId}_${tutorId}` : orderId;
    return notifications[notificationId];
  };

  const getOriginalOrderId = (notificationId: string): string => {
    const notification = Object.values(notifications).find(n => 
      n.orderid === notificationId || 
      (n.chatType === 'bidding' && n.orderid.includes(notificationId))
    );
    return notification?.originalOrderId || notificationId.split('_')[1] || notificationId;
  };

  return {
    notifications,
    markAsRead,
    createNotification,
    getUnreadCount,
    getNotificationDetails,
    getOriginalOrderId,
    hasUnreadMessages: Object.values(notifications).some(n => n.unreadCount > 0)
  };
} 