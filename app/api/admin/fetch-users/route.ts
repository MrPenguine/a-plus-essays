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

      // Get all users from Firebase Auth
      const { users: authUsers } = await adminAuth.listUsers();

      // Get all users from Firestore
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const firestoreUsers = new Map(
        usersSnapshot.docs.map(doc => [doc.id, doc.data()])
      );

      // Get order counts
      const ordersRef = collection(db, 'orders');
      const orderCounts = new Map();

      for (const authUser of authUsers) {
        const orderQuery = query(ordersRef, where('userid', '==', authUser.uid));
        const orderSnapshot = await getDocs(orderQuery);
        orderCounts.set(authUser.uid, orderSnapshot.size);
      }

      // Combine data
      const users = authUsers.map(authUser => {
        const firestoreData = firestoreUsers.get(authUser.uid) || {};
        return {
          uid: authUser.uid,
          email: authUser.email || 'No email',
          displayName: firestoreData.displayName || 'None',
          orderCount: orderCounts.get(authUser.uid) || 0,
          createdAt: authUser.metadata.creationTime,
          lastSignIn: authUser.metadata.lastSignInTime,
        };
      });

      return NextResponse.json({ users });

    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error in fetch-users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 