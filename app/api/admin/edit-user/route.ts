import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { dbService } from '@/lib/firebase/db-service';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function PUT(request: Request) {
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

      const body = await request.json();
      const { displayName, email } = body;

      // Update in Firebase Auth
      await adminAuth.updateUser(userId, {
        email,
        displayName
      });

      // Update in Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        displayName
      });

      return NextResponse.json({ success: true });

    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error in edit-user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 