// @ts-nocheck

"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X, Send, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
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
import { useUnifiedChatNotifications } from '@/hooks/useUnifiedChatNotifications';

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
  adminread?: boolean;
  unreadadmincount?: number;
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
  const [bidChatNotifications, setBidChatNotifications] = useState<number>(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Record<string, number>>({});
  const [orderNotifications, setOrderNotifications] = useState<Record<string, number>>({});
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [showTutors, setShowTutors] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'tutors' | 'messages'>('details');
  const [orderTotalUnreadCounts, setOrderTotalUnreadCounts] = useState<Record<string, number>>({});

  const { messages: bidMessages, unreadCount, markMessagesAsRead } = useNewBidMessage(
    selectedOrder?.id || '',
    selectedTutor?.tutorid || ''
  );

  const bidNotifications = useBidNotifications();
  const { notifications: unifiedNotifications, markAsRead, createNotification, getUnreadCount } = useUnifiedChatNotifications();

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
          if (data.messages && data.messages.length > 0) {
            const latestMessageTime = Math.max(
              ...data.messages.map(m => new Date(m.timestamp).getTime())
            );
            orderIdsWithTimestamp.set(data.orderid, {
              timestamp: latestMessageTime,
              hasUnreadMessages: data.messages.some(m => !m.read)
            });
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
                latestMessageTime: orderIdsWithTimestamp.get(orderId).timestamp,
                hasUnreadMessages: orderIdsWithTimestamp.get(orderId).hasUnreadMessages
              };
            }
          }
          return null;
        });

        const results = await Promise.all(orderPromises);
        const validOrders = results.filter(Boolean);

        // Sort by latest message timestamp
        const sortedOrders = validOrders.sort((a, b) => 
          b.latestMessageTime - a.latestMessageTime
        );

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
          
          // Mark messages as read when loaded
          const messagesRef = collection(db, 'messages');
          const q = query(
            messagesRef,
            where('orderid', '==', selectedOrder.id),
            where('tutorId', '==', selectedTutor.tutorid)
          );

          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const messageDoc = snapshot.docs[0];
            const messages = messageDoc.data().messages || [];
            const updatedMessages = messages.map((msg: Message) => ({
              ...msg,
              read: true
            }));

            await updateDoc(messageDoc.ref, {
              messages: updatedMessages
            });
          }
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
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('chatType', '==', 'bidding'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: Record<string, number> = {};
      const newOrderNotifications: Record<string, number> = {};
      const newOrderTotalUnreads: Record<string, number> = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (
          data.chatType === 'bidding' && 
          data.adminread === false && 
          typeof data.unreadadmincount === 'number' && 
          data.unreadadmincount > 0
        ) {
          // Extract the order ID from the notification ID
          const orderId = data.orderid.split('bidding_')[1]?.split('_')[0];
          if (!orderId) return;

          // Track individual tutor notifications
          if (data.tutorId) {
            newNotifications[data.tutorId] = data.unreadadmincount;
          }
          
          // Sum up notifications for each order
          newOrderTotalUnreads[orderId] = (newOrderTotalUnreads[orderId] || 0) + data.unreadadmincount;
        }
      });

      setNotifications(newNotifications);
      setOrderTotalUnreadCounts(newOrderTotalUnreads);
    });

    return () => unsubscribe();
  }, []);

  // Add this effect to track unread messages at all levels
  useEffect(() => {
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: Record<string, number> = {};
      const newOrderNotifications: Record<string, number> = {};
      let totalUnreadCount = 0;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.messages && Array.isArray(data.messages)) {
          // Only count messages that are not from the current user
          const unreadMessages = data.messages.filter(msg => 
            msg.isBidding && !msg.read && msg.sender !== user?.uid
          );
          
          if (unreadMessages.length > 0) {
            // For tutor-level notifications
            unreadMessages.forEach(msg => {
              const tutorKey = msg.tutorId;
              newNotifications[tutorKey] = (newNotifications[tutorKey] || 0) + 1;
            });

            // For order-level notifications
            newOrderNotifications[data.orderid] = unreadMessages.length;
            totalUnreadCount += unreadMessages.length;
          }
        }
      });

      setNotifications(newNotifications);
      setOrderNotifications(newOrderNotifications);
      setBidChatNotifications(totalUnreadCount);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Add this effect to track unread messages at order level
  useEffect(() => {
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newOrderNotifications: Record<string, number> = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.messages && Array.isArray(data.messages)) {
          // Count all unread bidding messages for this order
          const unreadMessages = data.messages.filter(msg => 
            msg.isBidding && !msg.read && msg.sender !== user?.uid
          );
          
          if (unreadMessages.length > 0) {
            // Group by order
            newOrderNotifications[data.orderid] = unreadMessages.length;
          }
        }
      });

      setOrderNotifications(newOrderNotifications);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Add state to track which orders have their tutors list expanded
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Modify the toggle function
  const toggleTutorsList = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
    setSelectedOrder(orders.find(o => o.id === orderId) || null);
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setSelectedTutor(null);
    setMessages([]);
    // Don't mark messages as read here - wait until specific tutor chat is opened
  };

  const handleTutorSelect = async (tutor: Tutor) => {
    setSelectedTutor(tutor);
    if (selectedOrder) {
      try {
        // Update notifications collection
        const notificationsRef = collection(db, 'notifications');
        const notificationId = `bidding_${selectedOrder.id}_${tutor.tutorid}`;
        
        const q = query(
          notificationsRef,
          where('orderid', '==', notificationId),
          where('chatType', '==', 'bidding')
        );
        
        const snapshot = await getDocs(q);
        
        for (const doc of snapshot.docs) {
          await updateDoc(doc.ref, {
            adminread: true,
            unreadadmincount: 0
          });
        }
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
      read: false,
      adminread: true,
      unreadadmincount: 0
    };

    try {
      // Save message in tutor-specific message document
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('orderid', '==', selectedOrder.id),
        where('tutorId', '==', selectedTutor.tutorid)  // Add tutorId to query
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Create new message document for this tutor
        await addDoc(messagesRef, {
          orderid: selectedOrder.id,
          tutorId: selectedTutor.tutorid,  // Add tutorId to document
          messages: [messageData]
        });
      } else {
        const messageDoc = querySnapshot.docs[0];
        await updateDoc(messageDoc.ref, {
          messages: arrayUnion(messageData)
        });
      }

      // Create tutor-specific notification
      const notificationsRef = collection(db, 'notifications');
      const notificationId = `bidding_${selectedOrder.id}_${selectedTutor.tutorid}`;
      
      const notificationQuery = query(
        notificationsRef,
        where('orderid', '==', notificationId)  // Use combined ID for unique notifications
      );
      
      const notificationSnapshot = await getDocs(notificationQuery);
      
      if (notificationSnapshot.empty) {
        await addDoc(notificationsRef, {
          orderid: notificationId,  // Use combined ID
          userid: selectedOrder.userid,
          message: `New message from ${selectedTutor.tutor_name} in Order #${selectedOrder.id.slice(0, 8)}`,
          timestamp: new Date().toISOString(),
          read: false,
          adminread: true,
          ordertitle: selectedOrder.title,
          unreadCount: 1,
          unreadadmincount: 0,
          isBidding: true,
          chatType: 'bidding',
          tutorId: selectedTutor.tutorid,  // Add tutorId to notification
          displayOrderId: selectedOrder.id  // For linking to order page
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

  // Add this effect to handle notifications at tutor level
  useEffect(() => {
    if (!selectedOrder) return;

    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, where('orderid', '==', selectedOrder.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: Record<string, number> = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.messages && Array.isArray(data.messages)) {
          data.messages.forEach((msg: Message) => {
            if (!msg.read) {
              const key = msg.tutorId;
              newNotifications[key] = (newNotifications[key] || 0) + 1;
            }
          });
        }
      });

      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [selectedOrder]);

  // Add this function to check if an order has any unread messages
  const hasUnreadMessagesForOrder = (orderId: string) => {
    return tutors.some(tutor => notifications[tutor.tutorid] > 0);
  };

  // Add this effect to track total unread messages across all bid chats
  useEffect(() => {
    const messagesRef = collection(db, 'messages');
    
    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      let totalUnreadCount = 0;
      const newOrderNotifications: Record<string, number> = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.messages && Array.isArray(data.messages)) {
          // Count all unread bidding messages
          const unreadMessages = data.messages.filter((msg: Message) => 
            msg.isBidding && !msg.read
          );
          
          if (unreadMessages.length > 0) {
            totalUnreadCount += unreadMessages.length;
            newOrderNotifications[data.orderid] = unreadMessages.length;
          }
        }
      });
      
      setBidChatNotifications(totalUnreadCount);
      setOrderNotifications(newOrderNotifications);
    });

    return () => unsubscribe();
  }, []);

  // Add this function to get total unread count for an order
  const getTotalUnreadCount = (orderId: string) => {
    return orderNotifications[orderId] || 0;
  };

  return (
    <>
      {/* Overlay - only show on desktop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 hidden md:block"
        onClick={onClose}
      />
      
      {/* Chat Panel */}
      <div className="fixed md:right-6 md:bottom-6 inset-0 md:inset-auto md:h-[600px] md:w-[400px] 
        bg-white dark:bg-gray-900 shadow-xl md:rounded-lg border border-gray-200 
        dark:border-gray-700 flex flex-col z-50">
        <div className="flex flex-col h-full">
          {loading ? (
            <div className="flex items-center justify-center h-full p-8">
              <p>Loading orders...</p>
            </div>
          ) : !selectedTutor ? (
            <>
              <div className="sticky top-0 p-4 border-b border-gray-200 dark:border-gray-700 
                flex items-center justify-between bg-white dark:bg-gray-900">
                <h2 className="font-semibold text-lg">Bidding Orders</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {orders.map((order) => (
                  <div key={order.id} className="border-b border-gray-200 dark:border-gray-700">
                    {/* Order Details Card */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 relative">
                      <h3 className="font-medium text-lg">{order.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">#{order.id.slice(0, 8)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="relative">
                          Bidding
                          {orderTotalUnreadCounts[order.id] > 0 && (
                            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-600" />
                          )}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 ml-2"
                          onClick={() => toggleTutorsList(order.id)}
                        >
                          Available Tutors
                          {expandedOrders[order.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          {orderTotalUnreadCounts[order.id] > 0 && (
                            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                              {orderTotalUnreadCounts[order.id]}
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Tutors List - Show when expanded */}
                    {expandedOrders[order.id] && (
                      <div className="bg-white dark:bg-gray-900">
                        {tutors.map((tutor) => (
                          <div
                            key={tutor.tutorid}
                            onClick={() => handleTutorSelect(tutor)}
                            className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b relative"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={tutor.profile_picture} />
                              <AvatarFallback>{tutor.tutor_name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-medium">{tutor.tutor_name}</h3>
                            </div>
                            {notifications[tutor.tutorid] > 0 && (
                              <span className="absolute top-3 right-3 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full">
                                {notifications[tutor.tutorid]}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
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