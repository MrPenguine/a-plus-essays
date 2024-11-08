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

  // Calculate discounted price
  const discountedPrice = discountInfo.hasDiscount 
    ? totalPrice * 0.8 // 20% off
    : totalPrice;

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
        amount: discountedPrice, // Use discounted price
        paymentId: reference,
        userId: user.uid
      });

      // Update order status
      await dbService.updateOrder(orderData.orderId, {
        status: 'in_progress',
        paymentReference: reference,
        paymentStatus: 'completed',
        paymentId: reference,
        paymentType: 'paystack'
      });

      // If discount was applied, update referral record
      if (discountInfo.hasDiscount) {
        const referralsRef = collection(db, 'referrals');
        const q = discountInfo.type === 'referred'
          ? query(referralsRef, where('referred_uid', '==', user.uid))
          : query(referralsRef, where('referrer_uid', '==', user.uid));
        
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          await updateDoc(doc(referralsRef, snapshot.docs[0].id), {
            [discountInfo.type === 'referred' ? 'referred_redeemed' : 'referrer_redeemed']: true,
            updatedAt: new Date().toISOString()
          });
        }
      }

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
            <Card className="p-6 sticky top-[100px]">
              <h2 className="text-lg font-semibold mb-4">Price Details</h2>
              {orderDetails ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Number of pages:</span>
                    <span className="font-medium">{orderDetails.pages}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Price per page:</span>
                    <span className="font-medium">
                      ${PRICE_PER_PAGE[orderDetails.level as keyof typeof PRICE_PER_PAGE].toFixed(2)}
                    </span>
                  </div>
                  {discountInfo.hasDiscount && (
                    <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                      <span>Referral Discount (20%):</span>
                      <span>-${(totalPrice * 0.2).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-semibold">Total Price:</span>
                    {discountInfo.hasDiscount ? (
                      <div className="text-right">
                        <span className="text-sm line-through text-muted-foreground">
                          ${totalPrice.toFixed(2)}
                        </span>
                        <span className="text-lg font-bold text-primary ml-2">
                          ${discountedPrice.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-primary">
                        ${totalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Loading price details...
                </div>
              )}

              {discountInfo.hasDiscount && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    20% referral discount applied!
                  </p>
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
              <PaystackButton
                amount={totalPrice}
                discountedAmount={discountInfo.hasDiscount ? discountedPrice : undefined}
                onSuccess={handlePaymentSuccess}
                onClose={handlePaymentClose}
                disabled={loading}
              />
              
              {/* Modified button to redirect to specific order */}
              <Button 
                onClick={() => router.push(`/orders/${orderData.orderId}`)} 
                variant="ghost" 
                className="w-full mt-2 text-black hover:bg-transparent hover:text-black dark:text-white hover:dark:text-white"
              >
                Proceed without payment
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
