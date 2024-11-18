import { NextResponse } from 'next/server';
import { dbService } from '@/lib/firebase/db-service';
import { join } from 'path';
import { readFileSync } from 'fs';
import { format } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('IntaSend callback data:', data);

    if (data.status === 'COMPLETE' || data.state === 'COMPLETE') {
      const orderId = data.api_ref;
      const amount = parseFloat(data.amount);
      
      // Get order details
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const orderData = orderDoc.data();
      const isFullyPaid = (orderData.amount_paid || 0) + amount >= orderData.price;

      // Update order payment status
      await dbService.updateOrder(orderId, {
        amount_paid: (orderData.amount_paid || 0) + amount,
        status: isFullyPaid ? 'in_progress' : 'partial',
        paymentStatus: isFullyPaid ? 'completed' : 'partial',
        paymentReference: data.invoice_id || data.id,
        paymentType: 'intasend',
        updatedAt: new Date().toISOString()
      });

      // Create payment record
      await dbService.createPayment({
        orderId: orderId,
        amount: amount,
        paymentId: data.invoice_id || data.id,
        userId: data.customer_id || orderData.userid,
        status: 'completed',
        createdAt: new Date().toISOString()
      });

      // Send payment success email
      const userRef = doc(db, 'users', orderData.userid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userEmail = userDoc.data().email;

        // Read email template
        const templatePath = join(process.cwd(), 'components', 'email_templates', 'payment-successful.html');
        let emailTemplate = readFileSync(templatePath, 'utf8');

        // Replace placeholders with actual values
        emailTemplate = emailTemplate
          .replace('{{date}}', format(new Date(), "MMMM d, yyyy h:mm a"))
          .replace('{{orderId}}', orderId)
          .replace('{{paymentId}}', data.invoice_id || data.id)
          .replace('{{orderTitle}}', orderData.title)
          .replace('{{subject}}', orderData.subject)
          .replace('{{type}}', orderData.assignment_type)
          .replace('{{pages}}', orderData.pages.toString())
          .replace('{{amount}}', amount.toFixed(2));

        // Send email
        await fetch('/api/send-payment-success-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderId,
            paymentId: data.invoice_id || data.id,
            amount: amount,
            userId: orderData.userid,
            orderTitle: orderData.title,
            orderDetails: {
              subject: orderData.subject,
              type: orderData.assignment_type,
              pages: orderData.pages
            }
          }),
        });
      }

      // Handle referral discount if applicable
      if (orderData.discountType) {
        const referralsRef = collection(db, 'referrals');
        
        if (orderData.discountType === 'referred') {
          const referredQuery = query(
            referralsRef,
            where('referred_uid', '==', orderData.userid),
            where('referred_redeemed', '==', false)
          );
          const referredSnap = await getDocs(referredQuery);
          
          if (!referredSnap.empty) {
            await updateDoc(doc(referralsRef, referredSnap.docs[0].id), {
              referred_redeemed: true,
              referred_redemption_date: new Date().toISOString(),
              referred_order_id: orderId
            });
          }
        } else if (orderData.discountType === 'referrer') {
          const referrerQuery = query(
            referralsRef,
            where('referrer_uid', '==', orderData.userid),
            where('referrer_redeemed', '==', false)
          );
          const referrerSnap = await getDocs(referrerQuery);
          
          if (!referrerSnap.empty) {
            await updateDoc(doc(referralsRef, referrerSnap.docs[0].id), {
              referrer_redeemed: true,
              referrer_redemption_date: new Date().toISOString(),
              referrer_order_id: orderId
            });
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('IntaSend callback error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 