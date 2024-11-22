import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, updateDoc, getDocs } from 'firebase/firestore';

interface Message {
  message: string;
  sender: string;
  timestamp: string;
  tutorId: string;
  isBidding: boolean;
  read?: boolean;
}

export const useNewBidMessage = (orderId: string, tutorId: string | undefined) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!orderId || !tutorId) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('orderid', '==', orderId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.messages && Array.isArray(data.messages)) {
          // Get all messages for this tutor
          const tutorMessages = data.messages.filter((msg: Message) => {
            const isForThisTutor = msg.tutorId === tutorId;
            const isBiddingMessage = msg.isBidding === true;
            return isForThisTutor && isBiddingMessage;
          });

          // Count unread messages (where sender !== tutorId)
          const unreadMessages = tutorMessages.filter(msg => 
            msg.sender !== tutorId && !msg.read
          );

          setUnreadCount(unreadMessages.length);
          setMessages(tutorMessages);
        }
      });
    });

    return () => unsubscribe();
  }, [orderId, tutorId]);

  const markMessagesAsRead = async () => {
    if (!orderId || !tutorId) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('orderid', '==', orderId)
    );

    const querySnapshot = await getDocs(q);
    
    querySnapshot.docs.forEach(async (doc) => {
      const data = doc.data();
      if (data.messages && Array.isArray(data.messages)) {
        // Update read status for messages where tutorId matches
        const updatedMessages = data.messages.map((msg: Message) => {
          if (msg.tutorId === tutorId && msg.sender !== tutorId) {
            return { ...msg, read: true };
          }
          return msg;
        });

        await updateDoc(doc.ref, { messages: updatedMessages });
      }
    });
  };

  return {
    unreadCount,
    messages,
    markMessagesAsRead
  };
}; 