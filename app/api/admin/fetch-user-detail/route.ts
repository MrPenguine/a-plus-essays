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

    // Get user from Firebase Auth
    const userRecord = await adminAuth.getUser(userId);

    // Get user data from Firestore
    const usersRef = collection(db, 'users');
    const userDoc = await getDocs(query(usersRef, where('__name__', '==', userId)));
    const firestoreData = userDoc.docs[0]?.data() || {};

    // Get order count
    const ordersRef = collection(db, 'orders');
    const orderQuery = query(ordersRef, where('userid', '==', userId));
    const orderSnapshot = await getDocs(orderQuery);

    const userData = {
      uid: userRecord.uid,
      email: userRecord.email || 'No email',
      displayName: firestoreData.displayName || 'None',
      orderCount: orderSnapshot.size,
      createdAt: userRecord.metadata.creationTime,
      lastSignIn: userRecord.metadata.lastSignInTime,
    };

    return NextResponse.json({ user: userData });

  } catch (error) {
    console.error('Error in fetch-user-detail API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 