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

    const body = await request.json();
    const { 
      subject, level, assignment_type, pages, wordcount, deadline,
      price, // For payment updates
      ...otherFields 
    } = body;

    // Update order document
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      ...(subject && { subject }),
      ...(level && { level }),
      ...(assignment_type && { assignment_type }),
      ...(pages && { pages: Number(pages) }),
      ...(wordcount && { wordcount: Number(wordcount) }),
      ...(deadline && { deadline }),
      ...(price && { price: Number(price) }),
      ...otherFields,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in edit-order API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 