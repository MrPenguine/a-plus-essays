import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { dbService } from '@/lib/firebase/db-service';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      const isAdmin = await dbService.isUserAdmin(decodedToken.uid);
      
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');

      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }

      // Simplified query - just filter by userid
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('userid', '==', userId)
      );

      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort orders by createdAt after fetching
      const sortedOrders = orders.sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return NextResponse.json({ orders: sortedOrders });

    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error in fetch-user-orders API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 