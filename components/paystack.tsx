import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useScript } from "../hooks/useScript";
import { useAuth } from "@/lib/firebase/hooks";
import { dbService } from "@/lib/firebase/db-service";

interface PaystackButtonProps {
  amount: number; // Original amount in USD
  discountedAmount?: number; // Optional discounted amount in USD
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
  discountedAmount,
  onSuccess,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const scriptLoaded = useScript("https://js.paystack.co/v1/inline.js");
  const { user, loading: authLoading } = useAuth();

  // Use discounted amount if available, otherwise use original amount
  const finalAmount = discountedAmount || amount;

  useEffect(() => {
    const fetchUserEmail = async () => {
      if (!user?.uid) return;
      try {
        const userDoc = await dbService.getUser(user.uid);
        if (userDoc?.email) {
          setUserEmail(userDoc.email);
        }
      } catch (error) {
        console.error("Error fetching user email:", error);
      }
    };

    fetchUserEmail();
  }, [user?.uid]);

  const initializePayment = async () => {
    if (!scriptLoaded || !window.PaystackPop) {
      toast.error("Payment system is not ready");
      return;
    }

    if (!userEmail) {
      toast.error("User email not found");
      return;
    }

    setLoading(true);

    try {
      const amountInKES = Math.round(finalAmount * KES_RATE * 100);
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: userEmail,
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
              value: finalAmount.toString()
            },
            {
              display_name: "Original Amount USD",
              variable_name: "original_amount_usd",
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
      setLoading(false);
      toast.error("Failed to initialize payment");
    }
  };

  return (
    <div className="mt-6">
      <Button
        onClick={initializePayment}
        className="w-full"
        disabled={loading}
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