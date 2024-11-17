import { useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/firebase/hooks';

const ABANDONED_CART_DELAY = 15 * 60 * 1000; // 15 minute

export function useAbandonedCartEmail() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Watch for new orders
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userid', '==', user.uid),
      where('status', '==', 'pending')
    );

    let timeouts: NodeJS.Timeout[] = [];

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          console.log('New pending order detected, setting up email timer');
          const orderId = change.doc.id;
          const order = change.doc.data();

          // Get user email from users collection
          const userRef = doc(db, 'users', order.userid);
          const userDoc = await getDoc(userRef);
          const userEmail = userDoc.data()?.email;

          if (!userEmail) {
            console.error('User email not found');
            return;
          }

          // Set timeout for 30 seconds
          const timeout = setTimeout(async () => {
            try {
              // Recheck payment status after delay
              const orderRef = doc(db, 'orders', orderId);
              const orderDoc = await getDoc(orderRef);
              const currentOrder = orderDoc.data();

              if (currentOrder?.status === 'pending') {
                console.log('Sending abandoned cart email for order:', orderId);
                // Trigger email sending via API endpoint
                const response = await fetch('/api/send-abandoned-cart-email', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    orderId,
                    userEmail,
                  }),
                });

                if (!response.ok) {
                  throw new Error('Failed to send abandoned cart email');
                }
              }
            } catch (error) {
              console.error('Error handling abandoned cart:', error);
            }
          }, ABANDONED_CART_DELAY);

          timeouts.push(timeout);
        }
      });
    });

    // Cleanup function
    return () => {
      console.log('Cleaning up abandoned cart email timers');
      unsubscribe();
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [user]);
} 