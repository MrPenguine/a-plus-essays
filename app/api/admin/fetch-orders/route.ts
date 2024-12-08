import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { dbService } from '@/lib/firebase/db-service';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
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

      // Get query parameters
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');

      // Fetch orders
      const ordersRef = collection(db, 'orders');
      let q;

      if (userId) {
        // If userId is provided, only fetch orders for that user
        q = query(
          ordersRef,
          where('userid', '==', userId),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Otherwise fetch all orders
        q = query(
          ordersRef,
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({ orders });
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error in fetch-orders API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
