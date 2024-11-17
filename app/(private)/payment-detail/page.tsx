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
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
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

interface DiscountInfo {
  hasDiscount: boolean;
  type: 'referrer' | 'referred' | null;
}

interface OrderDetails {
  id: string;
  title: string;
  subject: string;
  level: string;
  pages: number;
  deadline: string;
  assignment_type: string;
  description?: string;
  price: number;
  amount_paid: number;
  discountAmount?: number;
  discountType?: 'referrer' | 'referred' | null;
  tutorid?: string;
  paymentType?: string;
  paymentStatus?: string;
  paymentReference?: string;
  status?: string;
  originalPrice?: number;
}

// Add this helper function to get the correct cpp field name
const getCppFieldName = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'high school':
      return 'highschool_cpp';
    case 'undergraduate':
      return 'undergraduate_cpp';
    case 'masters':
      return 'masters_cpp';
    case 'phd':
      return 'phd_cpp';
    default:
      return 'undergraduate_cpp';
  }
};

// Add this interface for payment options
interface PaymentOption {
  type: 'full' | 'partial';
  label: string;
}

// Add PaymentData interface
interface PaymentData {
  orderId: string;
  amount: number;
  paymentId: string;
  userId: string;
  status?: string;
  createdAt?: string;
}

// Add OrderUpdate interface
interface OrderUpdate {
  amount_paid?: number;
  status?: string;
  paymentStatus?: string;
  paymentReference?: string;
  paymentType?: string;
  discountAmount?: number;
  discountType?: string | null;
  updatedAt?: string;
}

export default function PaymentDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo>({
    hasDiscount: false,
    type: null
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountedPrice, setDiscountedPrice] = useState(0);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<'full' | 'partial'>('full');
  
  // Get data from URL params
  const orderData = {
    orderId: searchParams.get('orderId'),
    title: searchParams.get('title'),
    deadline: searchParams.get('deadline'),
    pages: parseInt(searchParams.get('pages') || '1'),
    level: searchParams.get('level') || 'Undergraduate',
  };

  // Calculate prices whenever order details or discount changes
  useEffect(() => {
    const calculateRemainingBalance = async () => {
      if (!orderDetails) return;

      try {
        // Get amount already paid (default to 0 if not exists)
        const amountAlreadyPaid = orderDetails.amount_paid || 0;
        
        // Calculate discount if applicable
        const discountAmount = discountInfo.hasDiscount ? (orderDetails.price * 0.2) : 0;
        
        // Calculate remaining balance
        const remainingBalance = orderDetails.price - (amountAlreadyPaid + discountAmount);
        
        setTotalPrice(remainingBalance);
        setDiscountedPrice(remainingBalance); // No need to discount again as it's already included
      } catch (error) {
        console.error('Error calculating balance:', error);
      }
    };

    calculateRemainingBalance();
  }, [orderDetails, discountInfo]);

  // Add effect to check and create user if needed
  useEffect(() => {
    const checkAndCreateUser = async () => {
      if (!user) return;

      try {
        // Try to get user from database
        const dbUser = await dbService.getUser(user.uid);
        
        // If user doesn't exist in database, create them
        if (!dbUser) {
          const userData = {
            userid: user.uid,
            email: user.email || '',
            name: user.displayName || '',
            balance: 0,
            createdAt: new Date().toISOString(),
            isAnonymous: false
          };

          await dbService.createUser(userData);
          console.log('Created new user in database');
        }
      } catch (error) {
        console.error('Error checking/creating user:', error);
      }
    };

    checkAndCreateUser();
  }, [user]);

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

  // Add effect to check referral discount
  useEffect(() => {
    const checkReferralDiscount = async () => {
      if (!user) return;

      try {
        const referralsRef = collection(db, 'referrals');
        
        // Check if user is a referred user
        const referredQuery = query(
          referralsRef,
          where('referred_uid', '==', user.uid),
          where('referred_redeemed', '==', false)
        );
        
        // Check if user is a referrer
        const referrerQuery = query(
          referralsRef,
          where('referrer_uid', '==', user.uid),
          where('referred_redeemed', '==', true),
          where('referrer_redeemed', '==', false)
        );

        const [referredSnap, referrerSnap] = await Promise.all([
          getDocs(referredQuery),
          getDocs(referrerQuery)
        ]);

        if (!referredSnap.empty) {
          setDiscountInfo({
            hasDiscount: true,
            type: 'referred'
          });
        } else if (!referrerSnap.empty) {
          setDiscountInfo({
            hasDiscount: true,
            type: 'referrer'
          });
        }
      } catch (error) {
        console.error('Error checking referral discount:', error);
      }
    };

    checkReferralDiscount();
  }, [user]);

  useEffect(() => {
    const checkPaymentNeeded = async () => {
      if (!orderDetails || !user) return;

      const discountAmount = discountInfo.hasDiscount ? (orderDetails.price * 0.2) : 0;
      const amountAlreadyPaid = orderDetails.amount_paid || 0;
      const effectiveTotalPaid = amountAlreadyPaid + discountAmount;
      
      // If nothing more to pay, redirect to order page
      if (effectiveTotalPaid >= orderDetails.price) {
        router.push(`/orders/${orderDetails.id}`);
      }
    };

    checkPaymentNeeded();
  }, [orderDetails, discountInfo, user]);

  const handlePaymentSuccess = async (reference: string) => {
    if (!orderDetails || !user) return;

    try {
      const discountAmount = discountInfo.hasDiscount ? (orderDetails.price * 0.2) : 0;
      const amountAlreadyPaid = orderDetails.amount_paid || 0;
      const currentPaymentAmount = calculatePaymentAmount();
      
      // Create payment record
      await dbService.createPayment({
        orderId: orderDetails.id,
        amount: currentPaymentAmount,
        paymentId: reference,
        userId: user.uid,
        status: 'completed'
      });

      // Calculate new total paid amount
      const newTotalPaid = amountAlreadyPaid + currentPaymentAmount;
      
      // Check if fully paid
      const effectiveTotalPaid = newTotalPaid + discountAmount;
      const isFullyPaid = effectiveTotalPaid >= orderDetails.price;

      // Update order payment status
      const orderUpdate: OrderUpdate = {
        amount_paid: newTotalPaid,
        status: isFullyPaid ? 'in_progress' : 'partial',
        paymentStatus: isFullyPaid ? 'completed' : 'partial',
        paymentReference: reference,
        paymentType: 'paystack',
        discountAmount: discountAmount,
        discountType: discountInfo.type || null
      };

      await dbService.updateOrder(orderDetails.id, orderUpdate);

      // Send payment success email
      await fetch('/api/send-payment-success-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderDetails.id,
          paymentId: reference,
          amount: currentPaymentAmount,
          userId: user.uid,
          orderTitle: orderDetails.title,
          orderDetails: {
            subject: orderDetails.subject,
            type: orderDetails.assignment_type,
            pages: orderDetails.pages
          }
        }),
      });

      // Handle referral discount redemption if applicable
      if (discountInfo.hasDiscount && discountInfo.type) {
        const referralsRef = collection(db, 'referrals');
        
        if (discountInfo.type === 'referred') {
          const referredQuery = query(
            referralsRef,
            where('referred_uid', '==', user.uid),
            where('referred_redeemed', '==', false)
          );
          const referredSnap = await getDocs(referredQuery);
          
          if (!referredSnap.empty) {
            await updateDoc(doc(referralsRef, referredSnap.docs[0].id), {
              referred_redeemed: true,
              referred_redemption_date: new Date().toISOString(),
              referred_order_id: orderDetails.id
            });
          }
        } else if (discountInfo.type === 'referrer') {
          const referrerQuery = query(
            referralsRef,
            where('referrer_uid', '==', user.uid),
            where('referrer_redeemed', '==', false)
          );
          const referrerSnap = await getDocs(referrerQuery);
          
          if (!referrerSnap.empty) {
            await updateDoc(doc(referralsRef, referrerSnap.docs[0].id), {
              referrer_redeemed: true,
              referrer_redemption_date: new Date().toISOString(),
              referrer_order_id: orderDetails.id
            });
          }
        }
      }

      toast.success("Payment successful!");
      router.push(`/orders/${orderDetails.id}`);
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error("Error processing payment");
    }
  };

  const handlePaymentClose = () => {
    toast.info("Payment cancelled");
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderData.orderId) return;

      try {
        // Get order details from Firestore
        const orderRef = doc(db, 'orders', orderData.orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
          setOrderDetails(orderSnap.data() as OrderDetails);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        toast.error('Failed to load order details');
      }
    };

    fetchOrderDetails();
  }, [orderData.orderId]);

  useEffect(() => {
    const checkOrder = async () => {
      if (!orderData.orderId) return;

      try {
        const orderDoc = await dbService.getOrder(orderData.orderId);
        
        if (!orderDoc.tutorid) {
          router.push(`/orders/choosetutor?orderId=${orderData.orderId}`);
        }
      } catch (error) {
        console.error('Error checking order:', error);
        toast.error('Failed to load order details');
      }
    };

    checkOrder();
  }, [orderData.orderId]);

  // Update the calculatePaymentAmount function to take a payment type parameter
  const calculatePaymentAmount = (paymentType: 'full' | 'partial' = selectedPaymentOption) => {
    if (!orderDetails) return 0;
    
    const discountAmount = discountInfo.hasDiscount ? (orderDetails.price * 0.2) : 0;
    const amountAlreadyPaid = orderDetails.amount_paid || 0;
    const remainingAmount = orderDetails.price - (amountAlreadyPaid + discountAmount);
    
    // If there's already a payment, only show full remaining amount
    if (amountAlreadyPaid > 0) {
      return remainingAmount;
    }
    
    // Return amount based on specified payment type
    return paymentType === 'full' ? remainingAmount : Math.ceil(remainingAmount * 0.5);
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
    <div className="pt-[80px] min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Order Details</h2>
              {orderDetails ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-medium mb-1">{orderDetails.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Order #{orderDetails.id.slice(0, 8)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Subject</p>
                      <p className="font-medium">{orderDetails.subject}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">{orderDetails.assignment_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Academic Level</p>
                      <p className="font-medium">{orderDetails.level}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pages</p>
                      <p className="font-medium">{orderDetails.pages}</p>
                    </div>
                    
                    {orderDetails.description && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Description</p>
                        <p className="font-medium line-clamp-3">{orderDetails.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Loading order details...
                </div>
              )}
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
            {/* Price Details Card */}
            <Card className="p-6 sticky top-[100px]">
              <h2 className="text-lg font-semibold mb-4">Price Details</h2>
              {orderDetails ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Original Price:</span>
                    <span>${orderDetails.price.toFixed(2)}</span>
                  </div>

                  {discountInfo.hasDiscount && (
                    <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                      <span>Discount (20%):</span>
                      <span>-${(orderDetails.price * 0.2).toFixed(2)}</span>
                    </div>
                  )}

                  {orderDetails.amount_paid > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Already Paid:</span>
                      <span>-${orderDetails.amount_paid.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-semibold">Total Price:</span>
                    <span className="text-lg font-bold text-primary">
                      ${(orderDetails.price - (discountInfo.hasDiscount ? orderDetails.price * 0.2 : 0)).toFixed(2)}
                    </span>
                  </div>

                  {/* Only show payment options if no previous payment */}
                  {(!orderDetails.amount_paid || orderDetails.amount_paid === 0) && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="font-medium mb-3">How would you like to pay?</p>
                      <div className="space-y-2">
                        <div
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedPaymentOption === 'full'
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedPaymentOption('full')}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-4 h-4 border-2 rounded-full border-primary">
                              {selectedPaymentOption === 'full' && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">Full payment</p>
                              <p className="text-sm text-muted-foreground">
                                ${calculatePaymentAmount('full').toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedPaymentOption === 'partial'
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedPaymentOption('partial')}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-4 h-4 border-2 rounded-full border-primary">
                              {selectedPaymentOption === 'partial' && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">50% Deposit</p>
                              <p className="text-sm text-muted-foreground">
                                ${calculatePaymentAmount('partial').toFixed(2)} now
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show amount to pay */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Amount to Pay:</span>
                      <span className="text-xl font-bold text-primary">
                        ${calculatePaymentAmount().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Loading price details...
                </div>
              )}

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
              <div className="text-white">
                <PaystackButton
                  amount={calculatePaymentAmount()}
                onSuccess={handlePaymentSuccess}
                onClose={handlePaymentClose}
                  disabled={loading || !orderDetails}
                />
              </div>
              <div className="flex justify-center items-center mt-4">
                <p onClick={() => router.push(`/orders/${orderData.orderId}`)} className="text-primary cursor-pointer underline">Continue without payment</p>
              </div>
            </Card>
            
          </div>
        </div>
      </div>
    </div>
  );
}