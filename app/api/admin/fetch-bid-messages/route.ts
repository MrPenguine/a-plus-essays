import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

interface Message {
  message: string;
  sender: string;
  timestamp: string;
  tutorId: string;
  isBidding: true;
  read?: boolean;
}

interface ProcessedMessage extends Message {
  isFromTutor: boolean;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  const tutorId = searchParams.get('tutorId');

  if (!orderId || !tutorId) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('orderid', '==', orderId)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const messageDoc = snapshot.docs[0];
      const messages = messageDoc.data().messages || [];

      // Include read status in the response
      const processedMessages = messages.map((msg: Message) => ({
        ...msg,
        read: msg.read || false
      }));

      return NextResponse.json({ messages: processedMessages });
    }

    return NextResponse.json({ messages: [] });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 