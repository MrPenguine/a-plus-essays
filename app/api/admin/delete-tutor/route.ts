import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { dbService } from '@/lib/firebase/db-service';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function DELETE(request: Request) {
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
    const tutorId = searchParams.get('tutorId');

    if (!tutorId) {
      return NextResponse.json({ error: 'Tutor ID is required' }, { status: 400 });
    }

    // Delete tutor document
    const tutorRef = doc(db, 'tutors', tutorId);
    await deleteDoc(tutorRef);

    // Delete all messages from this tutor
    const messagesRef = collection(db, 'messages');
    const messageQuery = query(messagesRef, where('tutorId', '==', tutorId));
    const messageSnapshot = await getDocs(messageQuery);
    
    for (const messageDoc of messageSnapshot.docs) {
      await deleteDoc(messageDoc.ref);
    }

    // Update any orders that had this tutor assigned
    const ordersRef = collection(db, 'orders');
    const orderQuery = query(ordersRef, where('tutorid', '==', tutorId));
    const orderSnapshot = await getDocs(orderQuery);
    
    for (const orderDoc of orderSnapshot.docs) {
      await updateDoc(orderDoc.ref, {
        tutorid: '',
        status: 'pending' // Reset order status
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in delete-tutor API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 