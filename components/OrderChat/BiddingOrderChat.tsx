"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X, Send, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, addDoc, updateDoc, arrayUnion, increment, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { toast } from "sonner";
import { useChatNotifications } from '@/hooks/useChatNotifications';

interface BiddingOrderChatProps {
  orderId: string;
  title: string;
  onClose: () => void;
}

interface Message {
  message: string;
  sender: string;
  timestamp: string;
  tutorId: string;
  pending?: boolean;
}

export function BiddingOrderChat({ orderId, title, onClose }: BiddingOrderChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { markMessagesAsRead } = useChatNotifications();

  useEffect(() => {
    if (!orderId) return;

    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, where('orderid', '==', orderId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs[0]?.data();
      if (messageData) {
        setMessages(messageData.messages || []);
        markMessagesAsRead(orderId);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId, markMessagesAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageData = {
      message: newMessage.trim(),
      sender: user.uid,
      timestamp: new Date().toISOString(),
      tutorId: user.uid
    };

    try {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('orderid', '==', orderId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(messagesRef, {
          orderid: orderId,
          messages: [messageData]
        });
      } else {
        const messageDoc = querySnapshot.docs[0];
        await updateDoc(messageDoc.ref, {
          messages: arrayUnion(messageData)
        });
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 h-full">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-semibold truncate">{title}</h2>
          </div>
        </div>

        {/* Messages Area */}
        <div className="h-[calc(100vh-8rem)] overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages.length > 0 ? (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.sender === user?.uid ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === user?.uid
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No messages yet</p>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 