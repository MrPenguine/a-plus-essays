import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export function useAdminMessages() {
  const [notifications, setNotifications] = useState<Record<string, number>>({});

  useEffect(() => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const newNotifications: Record<string, number> = {};
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (!data?.orderid) continue;

        try {
          const orderId = data.orderid.includes('bidding_') 
            ? data.orderid.split('bidding_')[1].split('_')[0]
            : data.orderid;

          // Only show notifications where adminread is false and has unreadadmincount
          if (data.adminread === false && 
              typeof data.unreadadmincount === 'number' && 
              data.unreadadmincount > 0) {
            newNotifications[orderId] = data.unreadadmincount;
          }
        } catch (error) {
          console.error('Error processing notification:', error);
        }
      }
      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, []);

  return { notifications };
} 