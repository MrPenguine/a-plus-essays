import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { dbService } from '@/lib/firebase/db-service';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // Check if user is admin
      const isAdmin = await dbService.isUserAdmin(decodedToken.uid);
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }

      // Get orderId from query parameters
      const { searchParams } = new URL(request.url);
      const orderId = searchParams.get('orderId');

      if (!orderId) {
        return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
      }

      // Fetch order details
      const orderDetails = await dbService.getOrder(orderId);
      
      // Fetch payments for this order
      const payments = await dbService.getPayments(orderId, orderDetails.userid);

      // Fetch tutor details if exists
      let tutorDetails = null;
      if (orderDetails.tutorid) {
        const tutorsRef = collection(db, 'tutors');
        const q = query(tutorsRef, where('tutorid', '==', orderDetails.tutorid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const tutorDoc = querySnapshot.docs[0];
          tutorDetails = tutorDoc.data();
        }
      }

      return NextResponse.json({
        order: orderDetails,
        payments,
        tutor: tutorDetails
      });

    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error in fetch-order-details API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 