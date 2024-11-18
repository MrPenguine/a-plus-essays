import { NextResponse } from 'next/server';
import { dbService } from '@/lib/firebase/db-service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Save IntaSend payment data:', data);

    // Get order details
    const orderRef = doc(db, 'orders', data.orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const orderData = orderDoc.data();
    
    // Use the actual amount paid from the request
    const amount = parseFloat(data.amount || 0);
    const currentAmountPaid = parseFloat(orderData.amount_paid || 0);
    const newAmountPaid = currentAmountPaid + amount;
    const discountAmount = parseFloat(orderData.discountAmount || 0);
    
    // Calculate total effective payment including discount
    const totalEffectivePayment = newAmountPaid + discountAmount;
    const orderPrice = parseFloat(orderData.price || 0);
    
    // Determine payment status
    let status, paymentStatus;
    
    if (totalEffectivePayment >= orderPrice) {
      status = 'in_progress';
      paymentStatus = 'completed';
    } else {
      status = 'partial';
      paymentStatus = 'partial';
    }

    // Update order payment status
    await dbService.updateOrder(data.orderId, {
      amount_paid: newAmountPaid,
      status: status,
      paymentStatus: paymentStatus,
      paymentReference: data.paymentId,
      paymentType: 'intasend',
      discountAmount: discountAmount,
      discountType: orderData.discountType || null,
      updatedAt: new Date().toISOString()
    });

    // Create payment record with actual amount paid
    await dbService.createPayment({
      orderId: data.orderId,
      amount: amount,
      paymentId: data.paymentId,
      userId: data.userId,
      status: 'completed',
      createdAt: new Date().toISOString()
    });

    // Send payment success email
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-payment-success-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: data.orderId,
        paymentId: data.paymentId,
        amount: amount,
        userId: data.userId,
        orderTitle: orderData.title,
        orderDetails: {
          subject: orderData.subject,
          type: orderData.assignment_type,
          pages: orderData.pages
        }
      }),
    });

    // Send success response with redirect URL
    return NextResponse.json({ 
      status: 'success',
      isFullyPaid: status === 'in_progress',
      amountPaid: newAmountPaid,
      orderStatus: status,
      paymentStatus: paymentStatus,
      remainingBalance: Math.max(0, orderPrice - totalEffectivePayment),
      redirectUrl: `/orders/${data.orderId}`
    });
  } catch (error) {
    console.error('Save IntaSend payment error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 