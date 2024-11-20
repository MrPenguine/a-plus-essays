// @ts-nocheck

import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { dbService } from '@/lib/firebase/db-service';
import { useAuth } from '@/lib/firebase/hooks';

export function useIntaSendPayment(orderId: string, onPaymentComplete?: () => void) {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const verifyPayment = useCallback(async () => {
    const checkoutId = searchParams.get('checkout_id');
    
    if (!checkoutId || !user) return;

    try {
      const saveResponse = await fetch('/api/saveintasendpayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          paymentId: checkoutId,
          userId: user.uid
        }),
      });

      if (saveResponse.ok) {
        toast.success('Payment completed successfully!');
        onPaymentComplete?.();
      }
    } catch (error) {
      console.error('Payment verification error:', error);
    }
  }, [searchParams, user, orderId, onPaymentComplete]);

  useEffect(() => {
    if (searchParams.get('checkout_id')) {
      verifyPayment();
    }
  }, [verifyPayment]);
} 