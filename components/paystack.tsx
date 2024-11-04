import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useScript } from "../hooks/useScript";
import { useAuth } from "@/lib/firebase/hooks";

interface PaystackButtonProps {
  amount: number; // Amount in USD
  onSuccess: (reference: string) => void;
  onClose: () => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const KES_RATE = 135; // KES to USD conversion rate

const PaystackButton: React.FC<PaystackButtonProps> = ({
  amount,
  onSuccess,
  onClose,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const scriptLoaded = useScript("https://js.paystack.co/v1/inline.js");
  const { user, loading: authLoading } = useAuth();

  const initializePayment = async () => {
    if (!scriptLoaded || !window.PaystackPop) {
      toast.error("Payment system is not ready");
      return;
    }

    setLoading(true);
    try {
      const amountInKES = Math.round(amount * KES_RATE * 100); // Convert USD to KES cents

      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: user!.email!,
        amount: amountInKES,
        currency: "KES",
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
              value: user!.uid
            },
            {
              display_name: "Amount USD",
              variable_name: "amount_usd",
              value: amount.toString()
            }
          ]
        },
        callback: (response: any) => {
          setLoading(false);
          if (response.status === 'success') {
            onSuccess(response.reference);
          }
        },
        onClose: () => {
          setLoading(false);
          onClose();
        },
      });

      handler.openIframe();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : 'Payment initialization failed');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="mt-6">
        <Button disabled className="w-full">
          Loading...
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Secure payment powered by Paystack
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Button
        onClick={initializePayment}
        disabled={disabled || loading || authLoading || !user?.email}
        className="w-full"
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </Button>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Secure payment powered by Paystack
      </p>
      <p className="text-xs text-muted-foreground text-center">
        (Approximately KES {(amount * KES_RATE).toFixed(2)})
      </p>
    </div>
  );
};

export default PaystackButton;