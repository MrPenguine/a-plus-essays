import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useScript } from "../hooks/useScript";
import { useAuth } from "@/lib/firebase/hooks";
import { dbService } from "@/lib/firebase/db-service";

interface PaystackButtonProps {
  amount: number;
  discountedAmount?: number;
  onSuccess: (reference: string) => void;
  onClose: () => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const KES_RATE = 135;

const PaystackButton: React.FC<PaystackButtonProps> = ({
  amount,
  discountedAmount,
  onSuccess,
  onClose,
  disabled
}) => {
  const [loading, setLoading] = useState(false);
  const scriptLoaded = useScript("https://js.paystack.co/v1/inline.js");
  const { user } = useAuth();
  const finalAmount = discountedAmount || amount;

  const initializePayment = async () => {
    if (!scriptLoaded) {
      toast.error("Payment system is not ready");
      return;
    }

    if (!user) {
      toast.error("Please sign in to make a payment");
      return;
    }

    if (!window.PaystackPop) {
      toast.error("Payment system not initialized");
      return;
    }

    setLoading(true);

    try {
      const amountInKES = Math.round(finalAmount * KES_RATE * 100);
      
      const config = {
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: "briannderitu50@gmail.com",
        amount: amountInKES,
        currency: "KES",
        ref: `pay_${Math.floor(Math.random() * 1000000000 + 1)}`, // Generate unique reference
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        metadata: {
          custom_fields: [
            {
              display_name: "Payment For",
              variable_name: "payment_for",
              value: "Essay Writing Service"
            },
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: user.uid
            },
            {
              display_name: "Amount USD",
              variable_name: "amount_usd",
              value: finalAmount.toString()
            },
            {
              display_name: "Original Amount USD",
              variable_name: "original_amount_usd",
              value: amount.toString()
            }
          ]
        }
      };

      const handler = window.PaystackPop.setup({
        ...config,
        callback: function(response: any) {
          setLoading(false);
          if (response.status === 'success') {
            onSuccess(response.reference);
          }
        },
        onClose: function() {
          setLoading(false);
          onClose();
        }
      });

      if (handler && typeof handler.openIframe === 'function') {
        handler.openIframe();
      } else {
        throw new Error('Payment handler not properly initialized');
      }
    } catch (error) {
      console.error("Payment error:", error);
      setLoading(false);
      toast.error("Failed to initialize payment");
    }
  };

  const isDisabled = !scriptLoaded || loading || disabled || !user;

  return (
    <div className="mt-6">
      <Button
        onClick={initializePayment}
        className="w-full"
        disabled={isDisabled}
      >
        {loading ? 'Processing...' : `Pay $${finalAmount.toFixed(2)}`}
      </Button>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Secure payment powered by Paystack
      </p>
      <p className="text-xs text-muted-foreground text-center">
        (Approximately KES {(finalAmount * KES_RATE).toFixed(2)})
      </p>
    </div>
  );
};

export default PaystackButton;