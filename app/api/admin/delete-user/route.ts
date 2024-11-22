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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Delete user from Firebase Auth
    await adminAuth.deleteUser(userId);

    // Delete user from Firestore users collection
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);

    // Delete all orders for this user
    const ordersRef = collection(db, 'orders');
    const orderQuery = query(ordersRef, where('userid', '==', userId));
    const orderSnapshot = await getDocs(orderQuery);
    
    for (const orderDoc of orderSnapshot.docs) {
      // Delete messages for this order
      const messagesRef = collection(db, 'messages');
      const messageQuery = query(messagesRef, where('orderid', '==', orderDoc.id));
      const messageSnapshot = await getDocs(messageQuery);
      
      for (const messageDoc of messageSnapshot.docs) {
        await deleteDoc(messageDoc.ref);
      }

      // Delete the order
      await deleteDoc(orderDoc.ref);
    }

    // Delete all messages where user is involved
    const messagesRef = collection(db, 'messages');
    const messageQuery = query(messagesRef, where('userid', '==', userId));
    const messageSnapshot = await getDocs(messageQuery);
    
    for (const messageDoc of messageSnapshot.docs) {
      await deleteDoc(messageDoc.ref);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in delete-user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
