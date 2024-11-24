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
import { dbService } from "@/lib/firebase/db-service";
import { useUnifiedChatNotifications } from '@/hooks/useUnifiedChatNotifications';
import { useMediaQuery } from '@/hooks/use-media-query';

interface ActiveOrderChatProps {
  orderid: string;
  onClose: () => void;
}

interface ChatOrder {
  id: string;
  title: string;
  tutorid: string;
  tutor_name: string;
  profile_picture: string;
  status: string;
}

interface Message {
  message: string;
  sender: string;
  timestamp: string;
  pending?: boolean;
}

export function ActiveOrderChat({ orderid, onClose }: ActiveOrderChatProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [showChatList, setShowChatList] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeOrders, setActiveOrders] = useState<ChatOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ChatOrder | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const { user } = useAuth();
  const { notifications, markAsRead, createNotification } = useUnifiedChatNotifications();

  useEffect(() => {
    const fetchActiveOrders = async () => {
      if (!user) return;

      setLoadingChats(true);
      try {
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef, 
          where('userid', '==', user.uid),
          where('tutorid', '!=', ''),
          where('status', 'in', ['pending', 'in_progress', 'partial'])
        );
        
        const querySnapshot = await getDocs(q);
        const orders: ChatOrder[] = [];
        
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          if (data.tutorid) {
            const tutorData = await dbService.getTutorById(data.tutorid);
            const order = {
              id: doc.id,
              title: data.title.substring(0, 20) + (data.title.length > 20 ? '...' : ''),
              tutorid: data.tutorid,
              tutor_name: tutorData?.tutor_name || 'Expert',
              profile_picture: tutorData?.profile_picture || '/default-avatar.png',
              status: data.status
            };
            
            if (doc.id === orderid) {
              orders.unshift({
                ...order,
                title: `${order.title} - Current Chat`
              });
            } else {
              orders.push(order);
            }
          }
        }

        setActiveOrders(orders);
      } catch (error) {
        console.error('Error fetching active orders:', error);
      } finally {
        setLoadingChats(false);
      }
    };

    fetchActiveOrders();
  }, [user, orderid]);

  useEffect(() => {
    const currentOrderId = selectedOrder?.id || orderid;
    if (!currentOrderId) return;

    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, where('orderid', '==', currentOrderId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const messageDoc = snapshot.docs[0];
        const messageData = messageDoc.data();
        if (messageData.messages && Array.isArray(messageData.messages)) {
          const sortedMessages = [...messageData.messages].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          setMessages(sortedMessages);
          
          if (!showChatList && selectedOrder) {
            markAsRead(currentOrderId, 'active');
          }
        }
      }
    });

    return () => {
      unsubscribe();
      setMessages([]);
    };
  }, [selectedOrder?.id, orderid, showChatList]);

  useEffect(() => {
    if (selectedOrder && !showChatList) {
      markAsRead(selectedOrder.id, 'active');
    }
  }, [selectedOrder, showChatList]);

  const handleOrderSelect = async (order: ChatOrder) => {
    setMessages([]);
    setSelectedOrder(order);
    setShowChatList(false);
    
    try {
      await markAsRead(order.id, 'active');
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    const currentOrderId = selectedOrder?.id || orderid;
    const currentTutorId = selectedOrder?.tutorid;
    if (!currentOrderId || !currentTutorId) return;

    const messageData = {
      message: newMessage.trim(),
      sender: user.uid,
      timestamp: new Date().toISOString(),
      tutorId: currentTutorId,
      pending: true
    };

    setMessages(prev => [...prev, messageData]);
    setNewMessage('');

    try {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('orderid', '==', currentOrderId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(messagesRef, {
          orderid: currentOrderId,
          tutorId: currentTutorId,
          messages: [messageData]
        });
      } else {
        const messageDoc = querySnapshot.docs[0];
        await updateDoc(messageDoc.ref, {
          messages: arrayUnion({ ...messageData, pending: false })
        });
      }

      const notificationsRef = collection(db, 'notifications');
      const notificationId = currentOrderId;

      const notificationQuery = query(
        notificationsRef,
        where('orderid', '==', notificationId),
        where('userid', '==', currentTutorId)
      );
      
      const notificationSnapshot = await getDocs(notificationQuery);
      
      if (notificationSnapshot.empty) {
        await addDoc(notificationsRef, {
          orderid: notificationId,
          userid: currentTutorId,
          message: `New message in ${selectedOrder?.title}`,
          timestamp: new Date().toISOString(),
          read: true,
          adminread: false,
          ordertitle: selectedOrder?.title,
          unreadCount: 0,
          unreadadmincount: 1,
          tutorId: currentTutorId
        });
      } else {
        const notificationDoc = notificationSnapshot.docs[0];
        await updateDoc(notificationDoc.ref, {
          timestamp: new Date().toISOString(),
          message: `New message in ${selectedOrder?.title}`,
          read: true,
          adminread: false,
          unreadCount: 0,
          unreadadmincount: increment(1)
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(msg => msg.timestamp !== messageData.timestamp));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center md:items-end md:justify-end p-0 md:p-4">
      <div 
        className={`
          bg-white dark:bg-gray-900 relative flex flex-col
          ${isMobile 
            ? 'w-full h-[calc(100vh-64px)] mt-16'
            : 'w-[400px] h-[600px] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700'
          }
        `}
      >
        {showChatList ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">Active Chats</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className={`overflow-y-auto ${isMobile ? 'h-[calc(100vh-4rem)]' : 'h-[calc(600px-4rem)]'}`}>
              {loadingChats ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                activeOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleOrderSelect(order)}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b relative"
                  >
                    <Avatar>
                      <AvatarImage src={order.profile_picture} />
                      <AvatarFallback>{order.tutor_name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">{order.title}</h3>
                      <p className="text-sm text-gray-500">#{order.id.slice(0, 8)}</p>
                    </div>
                    {notifications[order.id]?.unreadCount > 0 && (
                      <span className="absolute top-3 right-3 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full">
                        {notifications[order.id].unreadCount}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowChatList(true)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar>
                <AvatarImage src={selectedOrder?.profile_picture} />
                <AvatarFallback>{selectedOrder?.tutor_name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-semibold">{selectedOrder?.tutor_name}</h2>
                <p className="text-sm text-gray-500">Active Chat</p>
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

            <div className={`overflow-y-auto p-4 space-y-4 ${
              isMobile ? 'h-[calc(100vh-8rem)]' : 'h-[calc(600px-8rem)]'
            }`}>
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

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
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
          </>
        )}
      </div>
    </div>
  );
}
