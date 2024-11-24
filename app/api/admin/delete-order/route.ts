import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { dbService } from '@/lib/firebase/db-service';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
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
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Delete order document
    const orderRef = doc(db, 'orders', orderId);
    await deleteDoc(orderRef);

    // Delete associated messages
    const messagesRef = collection(db, 'messages');
    const messageQuery = query(messagesRef, where('orderid', '==', orderId));
    const messageSnapshot = await getDocs(messageQuery);
    
    for (const messageDoc of messageSnapshot.docs) {
      await deleteDoc(messageDoc.ref);
    }

    // Delete associated notifications
    const notificationsRef = collection(db, 'notifications');
    const notificationQuery = query(
      notificationsRef, 
      where('orderid', '==', orderId)
    );
    const notificationSnapshot = await getDocs(notificationQuery);
    
    for (const notificationDoc of notificationSnapshot.docs) {
      await deleteDoc(notificationDoc.ref);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in delete-order API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
