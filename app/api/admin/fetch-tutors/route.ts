import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { dbService } from '@/lib/firebase/db-service';
import { collection, getDocs } from 'firebase/firestore';
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

      // Fetch all tutors
      const tutorsRef = collection(db, 'tutors');
      const snapshot = await getDocs(tutorsRef);
      const tutors = snapshot.docs.map(doc => ({
        tutorid: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({ tutors });

    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error in fetch-tutors API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 