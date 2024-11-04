"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import PaystackButton from "@/components/paystack";
import { useAuth } from "@/lib/firebase/hooks";
import { dbService } from "@/lib/firebase/db-service";
import { toast } from "sonner";
import { useState } from "react";
import { differenceInDays, differenceInHours } from "date-fns";

const PRICE_PER_PAGE = {
  'High School': 8,
  'Undergraduate': 10,
  'Masters': 14,
  'PhD': 15
};

// Add this function to calculate time remaining
const getTimeRemaining = (deadline: string) => {
  try {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    
    if (isNaN(deadlineDate.getTime())) {
      return '';
    }
    
    const daysRemaining = differenceInDays(deadlineDate, now);
    const hoursRemaining = differenceInHours(deadlineDate, now) % 24;

    if (daysRemaining > 0) {
      return `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''} remaining`;
    } else if (hoursRemaining > 0) {
      return `${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''} remaining`;
    } else {
      return 'Deadline passed';
    }
  } catch (error) {
    console.error('Error calculating time remaining:', error);
    return '';
  }
};

export default function PaymentDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  
  // Get data from URL params
  const orderData = {
    orderId: searchParams.get('orderId'),
    title: searchParams.get('title'),
    deadline: searchParams.get('deadline'),
    pages: parseInt(searchParams.get('pages') || '1'),
    level: searchParams.get('level') || 'Undergraduate',
  };

  // Calculate price based on education level and pages
  const pricePerPage = PRICE_PER_PAGE[orderData.level as keyof typeof PRICE_PER_PAGE] || 10;
  const totalPrice = orderData.pages * pricePerPage;

  // Check payment status on load
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!orderData.orderId || !user) return;

      try {
        const order = await dbService.getOrder(orderData.orderId);
        setOrderDetails(order);

        // If payment is already completed, redirect to order page
        if (order.paymentStatus === 'completed') {
          router.push(`/orders/${orderData.orderId}`);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    checkPaymentStatus();
  }, [orderData.orderId, user, router]);

  const handlePaymentSuccess = async (reference: string) => {
    if (!orderData.orderId || !user) {
      toast.error("Missing order details");
      return;
    }

    setLoading(true);
    try {
      // Create payment record
      await dbService.createPayment({
        orderId: orderData.orderId,
        amount: totalPrice,
        paymentId: reference,
        userId: user.uid
      });

      // Update order status with payment details
      await dbService.updateOrder(orderData.orderId, {
        status: 'in_progress',
        paymentReference: reference,
        paymentStatus: 'completed',
        paymentId: reference, // Add payment ID
        paymentType: 'paystack' // Add payment type
      });

      toast.success("Payment successful!");
      router.push(`/orders/${orderData.orderId}`);
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error("Error processing payment");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentClose = () => {
    toast.info("Payment cancelled");
  };

  if (authLoading) {
    return <div className="pt-[80px] px-4">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="pt-[80px] px-4">
        <p>Please sign in to continue</p>
        <Button onClick={() => router.push('/auth/signin')}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-[80px] px-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto py-8">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to project
        </button>

        <h1 className="text-2xl font-bold mb-6">Payment details</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Summary and Payment Method */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary Card */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{orderData.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {orderData.deadline ? getTimeRemaining(orderData.deadline) : ''}
                    </p>
                  </div>
                  <p className="font-semibold">${totalPrice.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            {/* Payment Method Card */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Select a payment method</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <Image 
                    src="/images/paystack.png" 
                    alt="Paystack" 
                    width={100} 
                    height={40}
                    style={{ height: 'auto' }}
                    className="object-contain"
                  />
                  <div className="flex-1">
                    <p className="font-medium">Pay with Paystack</p>
                    <p className="text-sm text-muted-foreground">Fast and secure payment</p>
                  </div>
                  <input 
                    type="radio" 
                    name="payment-method" 
                    checked 
                    readOnly
                    className="h-5 w-5 accent-primary" 
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Price Details */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-[100px]">
              <h2 className="text-lg font-semibold mb-4">Price Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Number of pages:</span>
                  <span className="font-medium">{orderData.pages}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Price per page:</span>
                  <span className="font-medium">
                    ${pricePerPage.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold">Total Price:</span>
                  <span className="text-lg font-bold text-primary">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Money Back Guarantee */}
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">100% MONEY BACK GUARANTEE</span>
                </div>
              </div>

              {/* Payment Button */}
              <PaystackButton
                amount={totalPrice}
                onSuccess={handlePaymentSuccess}
                onClose={handlePaymentClose}
                disabled={loading}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
