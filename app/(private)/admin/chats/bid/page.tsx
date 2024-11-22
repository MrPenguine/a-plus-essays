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
import { AdminPageLayout } from "@/components/admin/admin-page-layout";
import { AdminContentLayout } from "@/components/admin/admin-content-layout";
import { useRouter } from 'next/navigation';

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
  isBidding: true;
  read?: boolean;
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

export default function BidChatsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Record<string, number>>({});

  // Fetch bidding orders (orders without tutors)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // First get all messages
        const messagesRef = collection(db, 'messages');
        const messagesSnapshot = await getDocs(messagesRef);
        
        // Get unique orderIds from messages and ensure they're valid
        const orderIds = new Set(
          messagesSnapshot.docs
            .map(doc => doc.data().orderid)
            .filter(id => id !== undefined && id !== null && id !== '')
        );
        
        // If we have no valid orderIds, return early
        if (orderIds.size === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        // Fetch orders for these orderIds
        const ordersRef = collection(db, 'orders');
        const ordersData: Order[] = [];

        // Use Promise.all to fetch all orders concurrently
        const orderPromises = Array.from(orderIds).map(async (orderId) => {
          if (!orderId) return null;
          
          const orderSnapshot = await getDocs(
            query(ordersRef, where('__name__', '==', orderId))
          );
          
          if (!orderSnapshot.empty) {
            const orderDoc = orderSnapshot.docs[0];
            const orderData = orderDoc.data();
            
            // Only include orders that don't have a tutor assigned (bidding orders)
            if (!orderData.tutorid || orderData.tutorid === '') {
              return {
                id: orderDoc.id,
                ...orderData
              } as Order;
            }
          }
          return null;
        });

        const results = await Promise.all(orderPromises);
        const validOrders = results.filter((order): order is Order => order !== null);

        // Sort by timestamp
        const sortedOrders = validOrders.sort((a, b) => {
          const timestampA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timestampB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timestampB - timestampA;
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

  // Fetch tutors when an order is selected
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const tutorsRef = collection(db, 'tutors');
        const querySnapshot = await getDocs(tutorsRef);
        const tutorsData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          tutorid: doc.id
        } as Tutor));
        setTutors(tutorsData);
      } catch (error) {
        console.error('Error fetching tutors:', error);
      }
    };

    if (selectedOrder) {
      fetchTutors();
    }
  }, [selectedOrder]);

  // Listen to messages
  useEffect(() => {
    if (!selectedOrder || !selectedTutor) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('orderid', '==', selectedOrder.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('Raw message data:', data);

        if (data.messages && Array.isArray(data.messages)) {
          // Get all messages for this tutor's conversation
          const relevantMessages = data.messages.filter((msg: Message) => {
            // Include messages where:
            // 1. Message is for this tutor (tutorId matches)
            // 2. Message is a bidding message
            // 3. Message has all required fields
            return (
              msg.tutorId === selectedTutor.tutorid && 
              msg.isBidding === true &&
              msg.message && 
              msg.timestamp && 
              msg.sender
            );
          });

          // Sort messages by timestamp
          const sortedMessages = relevantMessages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          console.log('Filtered and sorted messages:', sortedMessages);
          setMessages(sortedMessages);
        }
      });
    });

    return () => {
      unsubscribe();
      setMessages([]);
    };
  }, [selectedOrder?.id, selectedTutor?.tutorid]);

  // Listen to notifications
  useEffect(() => {
    const notificationsRef = collection(db, 'messages');
    
    const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
      const newNotifications: Record<string, number> = {};
      
      snapshot.docChanges().forEach(change => {
        const data = change.doc.data();
        if (data.messages && Array.isArray(data.messages)) {
          // Group unread messages by tutor
          data.messages.forEach((msg: Message) => {
            if (msg.isBidding && !msg.read) {
              // For unread messages, create a key combining order and tutor
              const key = `${data.orderid}_${msg.tutorId}`;
              newNotifications[key] = (newNotifications[key] || 0) + 1;
            }
          });
        }
      });

      setNotifications(prev => ({
        ...prev,
        ...newNotifications
      }));
    });

    return () => unsubscribe();
  }, []);

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setSelectedTutor(null);
    setMessages([]);
  };

  const handleTutorSelect = async (tutor: Tutor) => {
    setSelectedTutor(tutor);
    
    if (selectedOrder) {
      try {
        const notificationsRef = collection(db, 'notifications');
        const notificationId = `bidding_${selectedOrder.id}_${tutor.tutorid}`;
        
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
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const handleBack = () => {
    if (selectedTutor) {
      setSelectedTutor(null);
    } else {
      setSelectedOrder(null);
    }
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedOrder || !selectedTutor) return;

    const messageData = {
      message: newMessage.trim(),
      sender: selectedTutor.tutorid,
      timestamp: new Date().toISOString(),
      tutorId: selectedTutor.tutorid,
      isBidding: true,
      read: false
    };

    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('orderid', '==', selectedOrder.id)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(messagesRef, {
          orderid: selectedOrder.id,
          messages: [messageData]
        });
      } else {
        const messageDoc = querySnapshot.docs[0];
        const currentMessages = messageDoc.data().messages || [];
        await updateDoc(messageDoc.ref, {
          messages: [...currentMessages, messageData]
        });
      }

      // Create notification for the user
      const notificationsRef = collection(db, 'notifications');
      const notificationId = `bidding_${selectedOrder.id}_${selectedTutor.tutorid}`;
      
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
          message: `New message from ${selectedTutor.tutor_name} in Order #${selectedOrder.id.slice(0, 8)}`,
          timestamp: new Date().toISOString(),
          read: false,
          ordertitle: selectedOrder.title,
          unreadCount: 1,
          isBidding: true,
          tutorId: selectedTutor.tutorid
        });
      } else {
        const notificationDoc = notificationSnapshot.docs[0];
        await updateDoc(notificationDoc.ref, {
          timestamp: new Date().toISOString(),
          message: `New message from ${selectedTutor.tutor_name} in Order #${selectedOrder.id.slice(0, 8)}`,
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

  const handleClose = () => {
    router.push('/admin/projects/all-projects');
  };

  return (
    <AdminPageLayout section="Chats" page="Bid Chats">
      <AdminContentLayout>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={handleClose}
        />
        
        {/* Chat Panel */}
        <div className="fixed right-6 bottom-6 h-[600px] w-[400px] bg-white dark:bg-gray-900 
          shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 
          flex flex-col z-50">
          <div className="flex flex-col h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full p-8">
                <p>Loading orders...</p>
              </div>
            ) : !selectedOrder ? (
              // Orders List
              <>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Bidding Orders</h2>
                  <Button variant="ghost" size="icon" onClick={handleClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => handleOrderSelect(order)}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-200 dark:border-gray-700 relative"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{order.title}</h3>
                        <p className="text-sm text-gray-500">#{order.id.slice(0, 8)}</p>
                        <Badge className="mt-1">Bidding</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : !selectedTutor ? (
              // Tutors List
              <>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedOrder(null)}
                      className="mr-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="font-semibold">Select Tutor to Chat As</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {tutors.map((tutor) => (
                    <div
                      key={tutor.tutorid}
                      onClick={() => handleTutorSelect(tutor)}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-200 dark:border-gray-700 relative"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={tutor.profile_picture} />
                        <AvatarFallback>{tutor.tutor_name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium">{tutor.tutor_name}</h3>
                      </div>
                      {notifications[`bidding_${selectedOrder.id}_${tutor.tutorid}`] > 0 && (
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full">
                          {notifications[`bidding_${selectedOrder.id}_${tutor.tutorid}`]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // Chat View
              <>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBack}
                      className="mr-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedTutor.profile_picture} />
                      <AvatarFallback>{selectedTutor.tutor_name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="font-semibold">{selectedOrder.title}</h2>
                      <p className="text-sm text-gray-500">
                        Chatting as: {selectedTutor.tutor_name}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4">
                  {messages && messages.length > 0 ? (
                    messages.map((msg, index) => {
                      const isTutorMessage = msg.sender === selectedTutor.tutorid;
                      
                      return (
                        <div
                          key={`${msg.timestamp}-${index}`}
                          className={`mb-4 ${
                            isTutorMessage ? 'ml-auto text-right' : 'mr-auto text-left'
                          }`}
                        >
                          <div
                            className={`inline-block p-3 rounded-lg ${
                              isTutorMessage
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
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No messages yet
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Type as ${selectedTutor.tutor_name}...`}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      size="icon"
                      onClick={handleSendMessage}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </AdminContentLayout>
    </AdminPageLayout>
  );
} 