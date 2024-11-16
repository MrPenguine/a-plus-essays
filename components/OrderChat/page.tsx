import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X, Send, ArrowLeft } from "lucide-react";
import ably from "@/lib/ably/config";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, addDoc, updateDoc, arrayUnion, increment, doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { toast } from "react-hot-toast";
import { dbService } from "@/lib/firebase/db-service";
import { useChatNotifications } from '@/hooks/useChatNotifications';

interface OrderChatProps {
  orderid: string;
  onClose: () => void;
  tutorid?: string;
  tutorname?: string;
  profile_pic?: string;
  title?: string;
  chatType: 'active' | 'bidding';
  hasUnreadMessages?: boolean;
}

interface Message {
  message: string;
  sender: string;
  timestamp: string;
  pending?: boolean;
}

interface ChatOrder {
  id: string;
  title: string;
  tutorid: string;
  tutor_name: string;
  profile_picture: string;
  status: string;
}

// Add this interface for tutor data
interface TutorData {
  id?: string;
  tutor_name?: string;
  profile_picture?: string;
}

// Add these interfaces at the top
interface MessageData {
  message: string;
  sender: string;
  timestamp: string;
  pending?: boolean;
}

// Add this helper function at the top of the component
const hasAnyUnreadMessages = (notifications: Record<string, number>) => {
  return Object.values(notifications).some(count => count > 0);
};

export default function OrderChat({ orderid, onClose, tutorid, tutorname, profile_pic, title, chatType, hasUnreadMessages }: OrderChatProps) {
  const [showChatList, setShowChatList] = useState(chatType === 'active');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeOrders, setActiveOrders] = useState<ChatOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ChatOrder | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const channel = ably.channels.get(orderid);

  // Add this CSS class at the top level of your component
  const avatarImageStyles = "object-cover w-full h-full";

  // Add state for tutor data
  const [tutorData, setTutorData] = useState<TutorData | null>(null);

  // Add optimistic updates state
  const [pendingMessages, setPendingMessages] = useState<Array<{
    message: string;
    sender: string;
    timestamp: string;
    pending?: boolean;
  }>>([]);

  // Add loading state
  const [loadingChats, setLoadingChats] = useState(true);

  // Add effect to fetch tutor data
  useEffect(() => {
    const fetchTutorData = async (tutorId: string) => {
      try {
        const tutorData = await dbService.getTutorById(tutorId);
        if (tutorData) {
          setTutorData({
            tutor_name: tutorData.tutor_name || 'Expert',
            profile_picture: tutorData.profile_picture || '/default-avatar.png'
          });
        }
      } catch (error) {
        console.error('Error fetching tutor data:', error);
      }
    };

    if (tutorid) {
      fetchTutorData(tutorid);
    }
  }, [tutorid]);

  // Modify the fetchActiveOrders function
  useEffect(() => {
    const fetchActiveOrders = async () => {
      if (!user || chatType !== 'active') return;

      setLoadingChats(true); // Set loading to true when starting fetch
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
        setLoadingChats(false); // Set loading to false when done
      }
    };

    fetchActiveOrders();
  }, [user, chatType, orderid]);

  // Update the message listener useEffect
  useEffect(() => {
    const currentOrderId = selectedOrder?.id || orderid;
    if (!currentOrderId) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('orderid', '==', currentOrderId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const messageDoc = snapshot.docs[0];
        const messageData = messageDoc.data();
        if (messageData.messages && Array.isArray(messageData.messages)) {
          const sortedMessages = [...messageData.messages].sort((a: Message, b: Message) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          setMessages(sortedMessages);
        }
      }
    }, (error) => {
      console.error('Error listening to messages:', error);
    });

    // Cleanup subscription
    return () => {
      unsubscribe();
      setMessages([]); // Clear messages when unmounting
    };
  }, [selectedOrder?.id, orderid]); // Add both IDs to dependency array

  // Update handleOrderSelect to properly switch chats
  const handleOrderSelect = async (order: ChatOrder) => {
    setMessages([]); // Clear current messages
    setSelectedOrder(order);
    setShowChatList(false);
    
    try {
      await markMessagesAsRead(order.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Update handleSendMessage to ensure correct orderid is used
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    // Use the selected order's ID or the prop orderid
    const currentOrderId = selectedOrder?.id || orderid;
    if (!currentOrderId) return;

    const messageData = {
      message: newMessage.trim(),
      sender: user.uid,
      timestamp: new Date().toISOString()
    };

    const uiMessageData = {
      ...messageData,
      pending: true
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, uiMessageData]);
    setPendingMessages(prev => [...prev, uiMessageData]);
    setNewMessage(''); // Clear input immediately

    try {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('orderid', '==', currentOrderId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(messagesRef, {
          orderid: currentOrderId,
          messages: [messageData]
        });
      } else {
        const messageDoc = querySnapshot.docs[0];
        await updateDoc(messageDoc.ref, {
          messages: arrayUnion(messageData)
        });
      }

      // Remove from pending after successful save
      setPendingMessages(prev => prev.filter(msg => msg.timestamp !== messageData.timestamp));

      // Handle notifications with correct orderid and recipient
      const recipientId = selectedOrder?.tutorid || tutorid;
      if (recipientId) {
        const notificationsRef = collection(db, 'notifications');
        const notificationQuery = query(
          notificationsRef,
          where('orderid', '==', currentOrderId),
          where('userid', '==', recipientId)
        );
        
        const notificationSnapshot = await getDocs(notificationQuery);
        
        if (notificationSnapshot.empty) {
          // Create new notification
          await addDoc(notificationsRef, {
            orderid: currentOrderId,
            userid: recipientId,
            message: `New message in ${selectedOrder?.title || title}`,
            timestamp: new Date().toISOString(),
            read: false,
            ordertitle: selectedOrder?.title || title,
            unreadCount: 1
          });
        } else {
          // Update existing notification
          const notificationDoc = notificationSnapshot.docs[0];
          await updateDoc(notificationDoc.ref, {
            timestamp: new Date().toISOString(),
            message: `New message in ${selectedOrder?.title || title}`,
            read: false,
            unreadCount: increment(1)
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(msg => msg.timestamp !== messageData.timestamp));
      setPendingMessages(prev => prev.filter(msg => msg.timestamp !== messageData.timestamp));
    }
  };

  // Add effect to clear messages when going back to chat list
  useEffect(() => {
    if (showChatList) {
      setMessages([]);
      setSelectedOrder(null);
    }
  }, [showChatList]);

  // Add useEffect to mark messages as read when chat is opened
  useEffect(() => {
    const markNotificationsAsRead = async () => {
      if (!user || !orderid) return;

      try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(
          notificationsRef,
          where('orderid', '==', orderid),
          where('userid', '==', user.uid),
          where('read', '==', false)
        );

        const snapshot = await getDocs(q);
        snapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, {
            read: true,
            unreadCount: 0
          });
        });
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    };

    markNotificationsAsRead();
  }, [user, orderid]);

  // Modified handleBack function
  const handleBack = () => {
    setMessages([]); // Clear messages before showing chat list
    setShowChatList(true);
    setSelectedOrder(null);
  };

  // Add effect to clear messages when component unmounts
  useEffect(() => {
    return () => {
      setMessages([]);
      setSelectedOrder(null);
    };
  }, []);

  // Add to existing state
  const { chatNotifications, markMessagesAsRead } = useChatNotifications();

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Chat Panel */}
      <div 
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '100px',
          zIndex: 50
        }}
        className="h-[600px] w-[400px] bg-white dark:bg-gray-900 
        shadow-xl transition-all duration-300 ease-in-out
        rounded-lg border border-secondary-gray-200 dark:border-secondary-gray-600 
        flex flex-col translate-x-0 relative"
      >
        {/* Show red dot if there are any unread messages */}
        {hasAnyUnreadMessages(chatNotifications) && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">•</span>
          </div>
        )}

        {chatType === 'active' ? (
          <>
            {showChatList ? (
              <>
                {/* Chat List Header */}
                <div className="p-4 border-b border-secondary-gray-200 dark:border-secondary-gray-600 flex justify-between items-center">
                  <h2 className="font-semibold text-lg">Active Chats</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                  {loadingChats ? (
                    <div className="space-y-4 p-4">
                      {[1, 2, 3].map((i) => (
                        <div 
                          key={i} 
                          className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 animate-pulse"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activeOrders.length > 0 ? (
                    activeOrders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => handleOrderSelect(order)}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800"
                      >
                        <Avatar className="h-10 w-10 rounded-full overflow-hidden">
                          <AvatarImage 
                            src={order.profile_picture} 
                            alt={order.tutor_name}
                            className={avatarImageStyles}
                            style={{
                              objectFit: 'cover',
                              aspectRatio: '1/1'
                            }}
                          />
                          <AvatarFallback className="bg-primary text-white">
                            {order.tutor_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium">{order.title}</h3>
                          <p className="text-sm text-gray-500">#{order.id.slice(0, 8)}</p>
                        </div>
                        {chatNotifications[order.id] > 0 && (
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full">
                            {chatNotifications[order.id]}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No active chats found
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-secondary-gray-200 dark:border-secondary-gray-600 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="mr-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-8 w-8 rounded-full overflow-hidden">
                    <AvatarImage 
                      src={selectedOrder?.profile_picture || tutorData?.profile_picture || '/default-avatar.png'} 
                      alt={selectedOrder?.tutor_name || tutorData?.tutor_name || 'Expert'}
                      className={avatarImageStyles}
                      style={{
                        objectFit: 'cover',
                        aspectRatio: '1/1'
                      }}
                    />
                    <AvatarFallback className="bg-primary text-white">
                      {(selectedOrder?.tutor_name || tutorData?.tutor_name || 'EX').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="font-semibold text-dark dark:text-white">
                      {selectedOrder?.tutor_name || tutorData?.tutor_name || 'Expert'}
                    </h2>
                    <p className="text-sm text-dark dark:text-white">Online</p>
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

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4">
                  {messages.length > 0 ? (
                    messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`mb-4 ${
                          msg.sender === user?.uid ? 'ml-auto text-right' : 'mr-auto'
                        }`}
                      >
                        <div
                          className={`inline-block p-3 rounded-lg ${
                            msg.sender === user?.uid
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 dark:bg-gray-800'
                          } ${msg.pending ? 'opacity-70' : ''}`}
                        >
                          {msg.message}
                          {msg.pending && (
                            <span className="ml-2 text-xs">●</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 text-center">
                      No messages yet
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-secondary-gray-200 dark:border-secondary-gray-600 mb-safe">
                  <div className="flex gap-2 items-center">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 h-10"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      size="icon" 
                      className="h-10 w-10 shrink-0"
                      onClick={handleSendMessage}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="p-4 text-center text-gray-500">
            Bidding chat functionality coming soon...
          </div>
        )}
      </div>
    </>
  );
}
