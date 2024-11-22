import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { dbService } from '@/lib/firebase/db-service';
import { collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
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

      // Get query parameters for pagination
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = 10;

      // Calculate the starting point
      const startAt = (page - 1) * pageSize;

      // Fetch payments
      const paymentsRef = collection(db, 'payments');
      const q = query(
        paymentsRef,
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const payments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get total count for pagination
      const totalSnapshot = await getDocs(collection(db, 'payments'));
      const total = totalSnapshot.size;

      return NextResponse.json({
        payments,
        pagination: {
          total,
          pages: Math.ceil(total / pageSize),
          currentPage: page
        }
      });

    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error in fetch-payments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 