// @ts-nocheck

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
import { useUnifiedChatNotifications } from '@/hooks/useUnifiedChatNotifications';
import { dbService } from "@/lib/firebase/db-service";
import { useMediaQuery } from '@/hooks/use-media-query';

export interface OrderChatProps {
  orderid: string;
  onClose: () => void;
  tutorid: string;
  tutorname: string;
  profile_pic?: string;
  chatType: "bidding" | "regular";
  title: string;
}

interface Message {
  message: string;
  sender: string;
  timestamp: string;
  tutorId: string;
  pending?: boolean;
}

interface TutorData {
  id: string;
  tutor_name: string;
  profile_picture: string;
}

export function BiddingOrderChat({ orderid, title, onClose }: OrderChatProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [showTutorList, setShowTutorList] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [biddingTutors, setBiddingTutors] = useState<TutorData[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<TutorData | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { notifications: unifiedNotifications, markAsRead, createNotification, getUnreadCount } = useUnifiedChatNotifications();
  const [adminNotifications, setAdminNotifications] = useState<Record<string, {
    adminread: boolean;
    unreadadmincount: number;
    tutorId: string;
  }>>({});
  const [tutorUnreadCounts, setTutorUnreadCounts] = useState<Record<string, number>>({});

  // Fetch tutors for bidding
  useEffect(() => {
    const fetchBiddingTutors = async () => {
      try {
        const tutorsRef = collection(db, 'tutors');
        const tutorsSnapshot = await getDocs(tutorsRef);
        const tutorsData = tutorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TutorData[];
        setBiddingTutors(tutorsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tutors:', error);
        setLoading(false);
      }
    };

    fetchBiddingTutors();
  }, []);

  // Fetch messages for selected tutor
  useEffect(() => {
    if (!orderid || !selectedTutor) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('orderid', '==', orderid),
      where('tutorId', '==', selectedTutor.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs[0]?.data();
      if (messageData) {
        const sortedMessages = [...(messageData.messages || [])].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setMessages(sortedMessages);
        
        // Mark as read when messages are loaded and chat is open
        if (!showTutorList) {
          markAsRead(orderid, 'bidding', selectedTutor.id);
        }
      }
    });

    return () => unsubscribe();
  }, [orderid, selectedTutor, showTutorList]);

  const handleTutorSelect = async (tutor: TutorData) => {
    setSelectedTutor(tutor);
    setShowTutorList(false);
    setMessages([]);
    try {
      // Update notifications collection
      const notificationsRef = collection(db, 'notifications');
      const notificationId = `bidding_${orderid}_${tutor.id}`;
      
      const q = query(
        notificationsRef,
        where('orderid', '==', orderid), // Use the actual order ID
        where('userid', '==', user?.uid)
      );
      
      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        await updateDoc(doc.ref, {
          read: true,
          unreadCount: 0,
          timestamp: new Date().toISOString()
        });
      }

      // Also mark messages as read
      const messagesRef = collection(db, 'messages');
      const messagesQuery = query(
        messagesRef,
        where('orderid', '==', orderid),
        where('tutorId', '==', tutor.id)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      if (!messagesSnapshot.empty) {
        const messageDoc = messagesSnapshot.docs[0];
        const messages = messageDoc.data().messages || [];
        const updatedMessages = messages.map((msg: Message) => ({
          ...msg,
          read: true
        }));

        await updateDoc(messageDoc.ref, {
          messages: updatedMessages
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedTutor) return;

    const messageData = {
      message: newMessage.trim(),
      sender: user.uid,
      timestamp: new Date().toISOString(),
      tutorId: selectedTutor.id,
      pending: true,
      adminread: false
    };

    setMessages(prev => [...prev, messageData]);
    setNewMessage('');

    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('orderid', '==', orderid),
        where('tutorId', '==', selectedTutor.id)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(messagesRef, {
          orderid: orderid,
          tutorId: selectedTutor.id,
          messages: [{ ...messageData, pending: false }]
        });
      } else {
        const messageDoc = querySnapshot.docs[0];
        await updateDoc(messageDoc.ref, {
          messages: arrayUnion({ ...messageData, pending: false })
        });
      }

      // Create notification with bidding ID for storage but order ID for display
      const notificationsRef = collection(db, 'notifications');
      const notificationId = `bidding_${orderid}_${selectedTutor.id}`;
      
      const notificationQuery = query(
        notificationsRef,
        where('orderid', '==', notificationId)  // Store with bidding ID
      );
      
      const notificationSnapshot = await getDocs(notificationQuery);
      
      if (notificationSnapshot.empty) {
        await addDoc(notificationsRef, {
          orderid: notificationId,  // Store with bidding ID
          displayOrderId: orderid,  // Add actual order ID for display/linking
          userid: selectedTutor.id,
          message: `New message in Order #${orderid.slice(0, 8)}`,  // Show actual order ID
          timestamp: new Date().toISOString(),
          read: false,
          adminread: false,
          ordertitle: title,
          unreadCount: 1,
          unreadadmincount: 1,
          isBidding: true,
          chatType: 'bidding',
          tutorId: selectedTutor.id,
          linkToOrder: orderid  // Add field for navigation
        });
      } else {
        const notificationDoc = notificationSnapshot.docs[0];
        await updateDoc(notificationDoc.ref, {
          timestamp: new Date().toISOString(),
          message: `New message in Order #${orderid.slice(0, 8)}`,  // Show actual order ID
          read: false,
          adminread: false,
          unreadadmincount: increment(1)
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(msg => msg.timestamp !== messageData.timestamp));
    }
  };

  const getOrderUnreadCount = (orderid: string) => {
    return biddingTutors.reduce((total, tutor) => {
      const notificationKey = `bidding_${orderid}_${tutor.id}`;
      const notification = adminNotifications[notificationKey];
      return total + ((notification?.adminread === false && notification?.unreadadmincount > 0) ? notification.unreadadmincount : 0);
    }, 0);
  };

  const hasUnreadMessages = () => {
    return biddingTutors.some(tutor => {
      const notificationKey = `bidding_${orderid}_${tutor.id}`;
      const notification = adminNotifications[notificationKey];
      return notification?.adminread === false && notification?.unreadadmincount > 0;
    });
  };

  // Add this function to get unread count for a specific tutor
  const getTutorUnreadCount = (tutorId: string) => {
    const notificationKey = `bidding_${orderid}_${tutorId}`;
    const notification = adminNotifications[notificationKey];
    return (notification?.adminread === false && notification?.unreadadmincount > 0) 
      ? notification.unreadadmincount 
      : 0;
  };

  // Update the notification listener effect
  useEffect(() => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('chatType', '==', 'bidding')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newTutorCounts: Record<string, number> = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Check if this notification is for our current order
        if (data.orderid.includes(orderid)) {
          // Only count if unread and has unread messages
          if (data.read === false && data.unreadCount > 0) {
            const tutorId = data.tutorId;
            if (tutorId) {
              newTutorCounts[tutorId] = data.unreadCount;
            }
          }
        }
      });
      
      setTutorUnreadCounts(newTutorCounts);
    });

    return () => unsubscribe();
  }, [orderid]);

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center md:items-end md:justify-end p-0 md:p-4">
      <div className={`
        bg-white dark:bg-gray-900 relative flex flex-col
        w-full md:w-[400px] 
        ${isMobile 
          ? 'h-[calc(100vh-64px)] mt-16' 
          : 'h-[600px] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700'
        }
      `}>
        {showTutorList ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2 relative">
                <h2 className="font-semibold">Bidding Chat - Order #{orderid.slice(0, 8)}</h2>
                {hasUnreadMessages() && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-600" />
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="overflow-y-auto h-[calc(100vh-4rem)] md:h-[calc(600px-4rem)]">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                biddingTutors.map((tutor) => (
                  <div
                    key={tutor.id}
                    onClick={() => handleTutorSelect(tutor)}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b relative"
                  >
                    <Avatar>
                      <AvatarImage src={tutor.profile_picture} />
                      <AvatarFallback>{tutor.tutor_name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">{tutor.tutor_name}</h3>
                      <p className="text-sm text-gray-500">Click to chat</p>
                    </div>
                    {tutorUnreadCounts[tutor.id] > 0 && (
                      <span className="absolute top-3 right-3 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full">
                        {tutorUnreadCounts[tutor.id]}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowTutorList(true)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar>
                  <AvatarImage src={selectedTutor?.profile_picture} />
                  <AvatarFallback>{selectedTutor?.tutor_name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="font-semibold">{selectedTutor?.tutor_name}</h2>
                  <p className="text-sm text-gray-500">Bidding Chat</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.sender === user?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.sender === user?.uid
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t bg-white dark:bg-gray-900 mt-auto">
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim()}
                    className="text-secondary-gray-50"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 