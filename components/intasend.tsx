import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/firebase/hooks";

interface IntaSendButtonProps {
  amount: number;
  discountedAmount?: number;
  onSuccess: (reference: string) => void;
  onClose: () => void;
  disabled?: boolean;
  orderId: string;
}

const IntaSendButton: React.FC<IntaSendButtonProps> = ({
  amount,
  discountedAmount,
  onClose,
  disabled,
  orderId
}) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const finalAmount = discountedAmount || amount;

  const initializePayment = async () => {
    if (!user) {
      toast.error("Please sign in to make a payment");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/intasend/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalAmount,
          email: user.email,
          first_name: user.displayName?.split(' ')[0] || '',
          last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
          orderId: orderId,
          userId: user.uid
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.message || 'Failed to create checkout');
      }

      // Redirect to IntaSend checkout URL
      window.location.href = data.url;

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
        disabled={loading || disabled || !user}
      >
        {loading ? 'Processing...' : `Pay $${finalAmount.toFixed(2)}`}
      </Button>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Secure payment powered by IntaSend
      </p>
    </div>
  );
};

export default IntaSendButton; 