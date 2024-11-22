import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const tutorId = searchParams.get('tutorId');

    if (!orderId || !tutorId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('orderid', '==', orderId)
    );

    const snapshot = await getDocs(q);
    let allMessages: ProcessedMessage[] = [];
    let unreadCount = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.messages && Array.isArray(data.messages)) {
        const relevantMessages = data.messages
          .filter((msg: Message) => {
            const isForThisTutor = msg.tutorId === tutorId;
            const isBiddingMessage = msg.isBidding === true;

            if (isForThisTutor && isBiddingMessage && !msg.read && msg.sender !== tutorId) {
              unreadCount++;
            }

            return isForThisTutor && isBiddingMessage;
          })
          .map((msg: Message) => ({
            ...msg,
            isFromTutor: msg.sender === tutorId
          }));

        allMessages = [...allMessages, ...relevantMessages];
      }
    });

    const sortedMessages = allMessages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return NextResponse.json({ 
      messages: sortedMessages,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching bid messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 