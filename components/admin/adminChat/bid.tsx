"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X, Send, ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, addDoc, updateDoc, arrayUnion, increment, doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { toast } from "sonner";
import { dbService } from "@/lib/firebase/db-service";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useNewBidMessage } from '@/hooks/useNewBidMessage';
import { useBidNotifications } from '@/hooks/useBidNotifications';

interface Order {
  id: string;
  title: string;
  tutorid?: string;
  status: string;
  userid: string;
  createdAt?: string;
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

const formatMessageTime = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return format(new Date(), "h:mm a"); // Fallback to current time if invalid
    }
    return format(date, "h:mm a");
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return format(new Date(), "h:mm a"); // Fallback to current time if error
  }
};

interface BidChatProps {
  onClose: () => void;
}

export function BidChat({ onClose }: BidChatProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Record<string, number>>({});
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const { messages: bidMessages, unreadCount, markMessagesAsRead } = useNewBidMessage(
    selectedOrder?.id || '',
    selectedTutor?.tutorid || ''
  );

  const bidNotifications = useBidNotifications();

  useEffect(() => {
    if (bidMessages.length > 0) {
      setMessages(bidMessages);
    }
  }, [bidMessages]);

  // Fetch bidding orders (orders without tutors)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const messagesRef = collection(db, 'messages');
        const messagesSnapshot = await getDocs(messagesRef);
        
        // Get unique orderIds and their latest message timestamps
        const orderIdsWithTimestamp = new Map();
        messagesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const messages = data.messages || [];
          if (messages.length > 0) {
            const latestMessageTime = Math.max(
              ...messages.map(m => new Date(m.timestamp).getTime())
            );
            orderIdsWithTimestamp.set(data.orderid, latestMessageTime);
          }
        });

        // Fetch orders for these orderIds
        const ordersRef = collection(db, 'orders');
        const orderPromises = Array.from(orderIdsWithTimestamp.keys()).map(async (orderId) => {
          if (!orderId) return null;
          
          const orderSnapshot = await getDocs(
            query(ordersRef, where('__name__', '==', orderId))
          );
          
          if (!orderSnapshot.empty) {
            const orderDoc = orderSnapshot.docs[0];
            const orderData = orderDoc.data();
            
            // Only include orders that don't have a tutor assigned
            if (!orderData.tutorid || orderData.tutorid === '') {
              return {
                id: orderDoc.id,
                ...orderData,
                latestMessageTime: orderIdsWithTimestamp.get(orderId)
              };
            }
          }
          return null;
        });

        const results = await Promise.all(orderPromises);
        const validOrders = results.filter((order): order is Order & { latestMessageTime: number } => 
          order !== null
        );

        // Sort by latest message timestamp
        const sortedOrders = validOrders.sort((a, b) => {
          return b.latestMessageTime - a.latestMessageTime;
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

    // Initial fetch from API
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `/api/admin/fetch-bid-messages?orderId=${selectedOrder.id}&tutorId=${selectedTutor.tutorid}`
        );
        const data = await response.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Real-time updates
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('orderid', '==', selectedOrder.id)
    );

    const unsubscribe = onSnapshot(q, async () => {
      // Refetch messages when changes occur
      await fetchMessages();
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
        await bidNotifications.markMessagesAsRead(selectedOrder.id, tutor.tutorid);
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

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };

  // Scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll when chat view is opened
  useEffect(() => {
    if (selectedTutor && selectedOrder) {
      scrollToBottom();
    }
  }, [selectedTutor, selectedOrder]);

  return (
    <>
      {/* Overlay - only show on desktop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 hidden md:block"
        onClick={onClose}
      />
      
      {/* Chat Panel - modified for responsive design */}
      <div className="fixed md:right-6 md:bottom-6 inset-0 md:inset-auto md:h-[600px] md:w-[400px] 
        bg-white dark:bg-gray-900 shadow-xl md:rounded-lg border border-gray-200 
        dark:border-gray-700 flex flex-col z-50">
        <div className="flex flex-col h-full">
          {loading ? (
            <div className="flex items-center justify-center h-full p-8">
              <p>Loading orders...</p>
            </div>
          ) : !selectedOrder ? (
            // Orders List
            <>
              <div className="sticky top-0 p-4 border-b border-gray-200 dark:border-gray-700 
                flex justify-between items-center bg-white dark:bg-gray-900">
                <h2 className="text-lg font-semibold">Bidding Orders</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleOrderSelect(order)}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer relative"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{order.title}</h3>
                      <p className="text-sm text-gray-500">#{order.id.slice(0, 8)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="relative">
                          Bidding
                          {bidNotifications.hasUnreadMessages(order.id) && (
                            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-600" />
                          )}
                        </Badge>
                      </div>
                    </div>
                    {bidNotifications.getUnreadCount(selectedOrder?.id || '', order.id) > 0 && (
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full">
                        {bidNotifications.getUnreadCount(selectedOrder?.id || '', order.id)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : !selectedTutor ? (
            // Tutors List
            <>
              <div className="sticky top-0 p-4 border-b border-gray-200 dark:border-gray-700 
                flex items-center justify-between bg-white dark:bg-gray-900">
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
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {tutors.map((tutor) => (
                  <div
                    key={tutor.tutorid}
                    onClick={() => handleTutorSelect(tutor)}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer relative"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={tutor.profile_picture} />
                      <AvatarFallback>{tutor.tutor_name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">{tutor.tutor_name}</h3>
                    </div>
                    {bidNotifications.getUnreadCount(selectedOrder?.id || '', tutor.tutorid) > 0 && (
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full">
                        {bidNotifications.getUnreadCount(selectedOrder?.id || '', tutor.tutorid)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Chat View
            <>
              <div className="sticky top-0 p-4 border-b border-gray-200 dark:border-gray-700 
                flex items-center justify-between bg-white dark:bg-gray-900">
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
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages Container */}
              <div 
                ref={messageContainerRef}
                className="flex-1 overflow-y-auto p-4"
              >
                {messages && messages.length > 0 ? (
                  messages.map((msg, index) => {
                    // Message is from tutor if sender matches tutorId
                    const isTutorMessage = msg.sender === msg.tutorId;
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const showTimestamp = !prevMsg || 
                      new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() > 300000; // 5 minutes

                    return (
                      <div
                        key={`${msg.timestamp}-${index}`}
                        className={`mb-4 ${
                          isTutorMessage 
                            ? 'ml-auto text-right' 
                            : 'mr-auto text-left'
                        } max-w-[80%]`}
                      >
                        {/* Message bubble */}
                        <div
                          className={`inline-block p-3 rounded-lg ${
                            isTutorMessage
                              ? 'bg-primary text-white rounded-tr-none'
                              : 'bg-gray-100 dark:bg-gray-800 rounded-tl-none'
                          }`}
                        >
                          {msg.message}
                        </div>

                        {/* Timestamp */}
                        {showTimestamp && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatMessageTime(msg.timestamp)}
                          </div>
                        )}
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
    </>
  );
} 