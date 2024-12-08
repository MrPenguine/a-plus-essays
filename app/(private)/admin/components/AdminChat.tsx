"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X, Send, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, addDoc, updateDoc, arrayUnion, increment, doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { toast } from "sonner";
import { dbService } from "@/lib/firebase/db-service";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AdminChatProps {
  orderId: string;
  onClose: () => void;
}

interface Order {
  id: string;
  title: string;
  tutorid?: string;
  status: string;
  userid: string;
}

interface Tutor {
  tutorid: string;
  tutor_name: string;
  profile_picture?: string;
}

interface Message {
  message: string;
  sender: string;
  timestamp: string;
  tutorId: string;
}

interface NotificationIndicatorProps {
  count?: number;
  className?: string;
}

const NotificationIndicator = ({ count, className }: NotificationIndicatorProps) => {
  if (!count || count <= 0) return null;
  
  return (
    <span className={cn(
      "absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-600",
      className
    )} />
  );
};

export default function AdminChat({ orderId, onClose }: AdminChatProps) {
  const [showChatList, setShowChatList] = useState(true);
  const [showTutorList, setShowTutorList] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Record<string, number>>({});

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef);
        const querySnapshot = await getDocs(q);
        
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Order));

        // Sort orders: active first, then bidding
        const sortedOrders = ordersData.sort((a, b) => {
          if (a.tutorid && !b.tutorid) return -1;
          if (!a.tutorid && b.tutorid) return 1;
          return 0;
        });

        setOrders(sortedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Fetch tutors for bidding chats
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const tutorsRef = collection(db, 'tutors');
        const querySnapshot = await getDocs(tutorsRef);
        const tutorsData = querySnapshot.docs.map(doc => ({
          ...doc.data()
        } as Tutor));
        setTutors(tutorsData);
      } catch (error) {
        console.error('Error fetching tutors:', error);
      }
    };

    if (selectedOrder && !selectedOrder.tutorid) {
      fetchTutors();
    }
  }, [selectedOrder]);

  // Listen to messages
  useEffect(() => {
    if (!selectedOrder) return;

    const messagesRef = collection(db, 'messages');
    let q;

    if (selectedOrder.tutorid) {
      // Active chat - get messages for specific order
      q = query(messagesRef, where('orderid', '==', selectedOrder.id));
    } else if (selectedTutor) {
      // Bidding chat - get messages for specific tutor
      q = query(
        messagesRef,
        where('orderid', '==', selectedOrder.id),
        where('tutorId', '==', selectedTutor.tutorid)
      );
    } else {
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const messageDoc = snapshot.docs[0];
        const messageData = messageDoc.data();
        if (messageData.messages && Array.isArray(messageData.messages)) {
          setMessages(messageData.messages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          ));
        }
      }
    });

    return () => unsubscribe();
  }, [selectedOrder, selectedTutor]);

  // Listen to notifications
  useEffect(() => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data.read) {
          newNotifications[data.orderid] = (data.unreadCount || 0);
        }
      });
      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, []);

  // Mark messages as read
  const markMessagesAsRead = async (orderId: string, tutorId?: string) => {
    const notificationsRef = collection(db, 'notifications');
    const notificationId = tutorId ? `bidding_${orderId}_${tutorId}` : orderId;
    
    const q = query(
      notificationsRef,
      where('orderid', '==', notificationId)
    );

    const snapshot = await getDocs(q);
    snapshot.docs.forEach(async (doc) => {
      await updateDoc(doc.ref, {
        read: true,
        unreadCount: 0
      });
    });
  };

  // Handle order selection
  const handleOrderSelect = async (order: Order) => {
    setSelectedOrder(order);
    setShowTutorList(!order.tutorid);
    if (order.tutorid) {
      await markMessagesAsRead(order.id);
      setShowChatList(false);
    }
  };

  // Handle tutor selection
  const handleTutorSelect = async (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setShowTutorList(false);
    if (selectedOrder) {
      await markMessagesAsRead(selectedOrder.id, tutor.tutorid);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedOrder) return;

    const tutorId = selectedOrder.tutorid || selectedTutor?.tutorid;
    if (!tutorId) return;

    const messageData = {
      message: newMessage.trim(),
      sender: tutorId, // Send as tutor
      timestamp: new Date().toISOString(),
      tutorId: tutorId
    };

    try {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('orderid', '==', selectedOrder.id));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(messagesRef, {
          orderid: selectedOrder.id,
          tutorId: tutorId,
          messages: [messageData]
        });
      } else {
        const messageDoc = querySnapshot.docs[0];
        await updateDoc(messageDoc.ref, {
          messages: arrayUnion(messageData)
        });
      }

      // Update notifications for the user
      const notificationsRef = collection(db, 'notifications');
      const notificationId = selectedOrder.tutorid ? selectedOrder.id : `bidding_${selectedOrder.id}_${tutorId}`;

      const notificationQuery = query(
        notificationsRef,
        where('orderid', '==', notificationId),
        where('userid', '==', selectedOrder.userid)
      );
      
      const notificationSnapshot = await getDocs(notificationQuery);
      
      if (notificationSnapshot.empty) {
        await addDoc(notificationsRef, {
          orderid: notificationId,
          userid: selectedOrder.userid,
          message: `New message in ${selectedOrder.title}`,
          timestamp: new Date().toISOString(),
          read: false,
          ordertitle: selectedOrder.title,
          unreadCount: 1
        });
      } else {
        const notificationDoc = notificationSnapshot.docs[0];
        await updateDoc(notificationDoc.ref, {
          timestamp: new Date().toISOString(),
          message: `New message in ${selectedOrder.title}`,
          read: false,
          unreadCount: increment(1)
        });
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Chat Panel */}
      <div className="fixed right-6 bottom-6 h-[600px] w-[400px] bg-white dark:bg-gray-900 
        shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 
        flex flex-col z-50">
        
        {showChatList ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-lg">Orders</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => handleOrderSelect(order)}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b relative"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{order.title}</h3>
                    <p className="text-sm text-gray-500">#{order.id.slice(0, 8)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="relative">
                        {order.tutorid ? 'Active' : 'Bidding'}
                        {notifications[order.id] > 0 && (
                          <NotificationIndicator className="-top-1 -right-1" />
                        )}
                      </Badge>
                    </div>
                  </div>
                  {notifications[order.id] > 0 && (
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full">
                      {notifications[order.id]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : showTutorList ? (
          <>
            {/* Tutor List Header */}
            <div className="p-4 border-b flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChatList(true)}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="font-semibold">Select Tutor</h2>
            </div>

            {/* Tutors List */}
            <div className="flex-1 overflow-y-auto">
              {tutors.map((tutor) => (
                <div
                  key={tutor.tutorid}
                  onClick={() => handleTutorSelect(tutor)}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b relative"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={tutor.profile_picture} />
                      <AvatarFallback>{tutor.tutor_name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    {notifications[`bidding_${selectedOrder?.id}_${tutor.tutorid}`] > 0 && (
                      <NotificationIndicator className="-top-0.5 -right-0.5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{tutor.tutor_name}</h3>
                  </div>
                  {notifications[`bidding_${selectedOrder?.id}_${tutor.tutorid}`] > 0 && (
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full">
                      {notifications[`bidding_${selectedOrder?.id}_${tutor.tutorid}`]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowChatList(true);
                  setSelectedTutor(null);
                }}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={selectedTutor?.profile_picture || '/default-avatar.png'} 
                  alt={selectedTutor?.tutor_name || 'Tutor'}
                />
                <AvatarFallback>
                  {(selectedTutor?.tutor_name || 'T').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-semibold">
                  {selectedOrder?.title || 'Chat'}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedTutor?.tutor_name || 'Loading...'}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    msg.sender === selectedTutor?.tutorid ? 'ml-auto text-right' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      msg.sender === selectedTutor?.tutorid
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    {msg.message}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {format(new Date(msg.timestamp), "h:mm a")}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!selectedTutor}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
} 