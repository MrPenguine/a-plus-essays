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

interface BiddingMessage {
  message: string;
  sender: string;
  timestamp: string;
  tutorId: string;
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
  const [messages, setMessages] = useState<BiddingMessage[]>([]);
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
    const currentTutorId = selectedOrder?.tutorid || tutorid;
    if (!currentOrderId) return;

    const messagesRef = collection(db, 'messages');
    let q;

    if (chatType === 'bidding') {
      // For bidding chats, query messages specific to tutor
      q = query(
        messagesRef,
        where('orderid', '==', currentOrderId),
        where('tutorId', '==', currentTutorId)
      );
    } else {
      // For active chats, use existing query
      q = query(
        messagesRef,
        where('orderid', '==', currentOrderId)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const messageDoc = snapshot.docs[0];
        const messageData = messageDoc.data();
        if (messageData.messages && Array.isArray(messageData.messages)) {
          const sortedMessages = [...messageData.messages].sort((a: BiddingMessage, b: BiddingMessage) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          setMessages(sortedMessages);
        }
      }
    });

    return () => {
      unsubscribe();
      setMessages([]); // Clear messages when unmounting
    };
  }, [selectedOrder?.id, orderid, selectedOrder?.tutorid, tutorid, chatType]);

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

  // Update handleSendMessage for bidding chats
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    const currentOrderId = selectedOrder?.id || orderid;
    const currentTutorId = selectedOrder?.tutorid || tutorid;
    if (!currentOrderId || !currentTutorId) return;

    const messageData = {
      message: newMessage.trim(),
      sender: user.uid,
      timestamp: new Date().toISOString(),
      tutorId: currentTutorId,
      isBidding: chatType === 'bidding'
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
      let q;

      if (chatType === 'bidding') {
        // For bidding chats, query messages specific to tutor
        q = query(
          messagesRef,
          where('orderid', '==', currentOrderId),
          where('tutorId', '==', currentTutorId)
        );
      } else {
        // For active chats, use existing query
        q = query(messagesRef, where('orderid', '==', currentOrderId));
      }

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
          messages: arrayUnion(messageData)
        });
      }

      // Remove from pending after successful save
      setPendingMessages(prev => prev.filter(msg => msg.timestamp !== messageData.timestamp));

      // Handle notifications with correct orderid and recipient
      const recipientId = selectedOrder?.tutorid || tutorid;
      if (recipientId) {
        const notificationsRef = collection(db, 'notifications');
        const notificationId = chatType === 'bidding' 
          ? `bidding_${orderid}_${recipientId}`
          : orderid;

        const notificationQuery = query(
          notificationsRef,
          where('orderid', '==', notificationId),
          where('userid', '==', recipientId)
        );
        
        const notificationSnapshot = await getDocs(notificationQuery);
        
        if (notificationSnapshot.empty) {
          // Create new notification
          await addDoc(notificationsRef, {
            orderid: notificationId,
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

  const [tutors, setTutors] = useState<any[]>([]);

  // Add effect to fetch tutors for bidding chat
  useEffect(() => {
    const fetchTutors = async () => {
      if (chatType !== 'bidding') return;

      try {
        const tutorsRef = collection(db, 'tutors');
        const tutorsSnapshot = await getDocs(tutorsRef);
        const tutorsData = tutorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTutors(tutorsData);
      } catch (error) {
        console.error('Error fetching tutors:', error);
      }
    };

    fetchTutors();
  }, [chatType]);

  // Add state for bidding chat
  const [biddingTutors, setBiddingTutors] = useState<any[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);

  // Add effect to fetch tutors for bidding chat
  useEffect(() => {
    const fetchBiddingTutors = async () => {
      if (chatType !== 'bidding') return;

      try {
        const tutorsRef = collection(db, 'tutors');
        const tutorsSnapshot = await getDocs(tutorsRef);
        const tutorsData = tutorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBiddingTutors(tutorsData);
      } catch (error) {
        console.error('Error fetching tutors:', error);
      }
    };

    fetchBiddingTutors();
  }, [chatType]);

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Chat Panel */}
      <div className="fixed right-6 bottom-6 h-[600px] w-[400px] bg-white dark:bg-gray-900 
        shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 
        flex flex-col z-50">
        {showChatList ? (
          <>
            {/* Chat List Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-lg">
                {chatType === 'bidding' ? `Bidding Chats - Order #${orderid.slice(0, 8)}` : 'Active Chats'}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {chatType === 'bidding' ? (
                // Show tutor list for bidding
                biddingTutors.map((tutor) => (
                  <div
                    key={tutor.id}
                    onClick={() => handleOrderSelect({
                      id: orderid,
                      title: title || '',
                      tutorid: tutor.tutorid,
                      tutor_name: tutor.tutor_name,
                      profile_picture: tutor.profile_picture,
                      status: 'bidding'
                    })}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={tutor.profile_picture || '/default-avatar.png'} />
                      <AvatarFallback>{tutor.tutor_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">{tutor.tutor_name}</h3>
                      <p className="text-sm text-gray-500">Click to chat</p>
                    </div>
                    {chatNotifications[`bidding_${orderid}_${tutor.tutorid}`] > 0 && (
                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold bg-red-600 text-white rounded-full">
                          {chatNotifications[`bidding_${orderid}_${tutor.tutorid}`]}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // Show active chats list
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
                      <h3 className="font-medium text-dark dark:text-white">{order.title}</h3>
                      <p className="text-sm text-gray-500">#{order.id.slice(0, 8)}</p>
                    </div>
                    {chatNotifications[order.id] > 0 && (
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full">
                        {chatNotifications[order.id]}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={selectedOrder?.profile_picture || profile_pic || '/default-avatar.png'} 
                  alt={selectedOrder?.tutor_name || tutorname || 'Expert'}
                />
                <AvatarFallback>
                  {(selectedOrder?.tutor_name || tutorname || 'EX').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-semibold">
                  {selectedOrder?.tutor_name || tutorname || 'Expert'}
                </h2>
                <p className="text-sm text-gray-500">
                  {chatType === 'bidding' ? 'Bidding Chat' : 'Active Chat'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((msg, index) => (
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
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
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
